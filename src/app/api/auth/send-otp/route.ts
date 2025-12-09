import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

const MSG91_AUTH_KEY =
  process.env.MSG91_AUTH_KEY ;
const MSG91_API_URL = "https://control.msg91.com/api/v5/otp";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Get user from Supabase by email using admin client
    const { data: users, error: userError } =
      await supabaseAdmin.auth.admin.listUsers();

    if (userError) {
      console.error("Error fetching users:", userError);
      return NextResponse.json(
        { error: "Failed to find user" },
        { status: 500 }
      );
    }

    const user = users.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (!user) {
      return NextResponse.json(
        { error: "Email not registered" },
        { status: 404 }
      );
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP in Supabase user metadata temporarily
    const { error: updateError } =
      await supabaseAdmin.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...user.user_metadata,
          reset_otp: otp,
          reset_otp_expiry: Date.now() + 10 * 60 * 1000, // 10 minutes
        },
      });

    if (updateError) {
      console.error("Error storing OTP:", updateError);
      return NextResponse.json(
        { error: "Failed to generate OTP" },
        { status: 500 }
      );
    }

    // Send OTP via MSG91 Email API
    const emailResponse = await fetch(
      "https://control.msg91.com/api/v5/email/send",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authkey: MSG91_AUTH_KEY!,
        },
        body: JSON.stringify({
          recipients: [
            {
              to: [
                {
                  email: email,
                  name: user.user_metadata?.full_name || "User",
                },
              ],
              variables: {
                otp: otp,
              },
            },
          ],
          from: {
            email: "no-reply@themollywoodclothing.com", // Assuming this is the domain, based on user request "info@themollywoodclothing.com"
          },
          domain: "send.themollywoodclothing.com", // Assuming this is the domain
          template_id: "password_reset_30",
        }),
      }
    );

    const emailData = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("MSG91 Email Error:", emailData);
      return NextResponse.json(
        { error: "Failed to send OTP. Please try again." },
        { status: 500 }
      );
    }

    // MSG91 Email API success check
    if (emailData.status === "error") {
       console.error("MSG91 Email Error:", emailData);
       return NextResponse.json(
         { error: emailData.message || "Failed to send OTP. Please try again." },
         { status: 500 }
       );
    }

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error: any) {
    console.error("Send OTP error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send OTP" },
      { status: 500 }
    );
  }
}
