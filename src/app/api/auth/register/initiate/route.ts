import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, fullName } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const { data: users, error: userError } =
      await supabaseAdmin.auth.admin.listUsers();

    if (userError) {
      console.error("Error fetching users:", userError);
      return NextResponse.json(
        { error: "Failed to check existing users" },
        { status: 500 }
      );
    }

    const existingUser = users.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (existingUser) {
      // If user exists and is verified, return error
      if (existingUser.email_confirmed_at || existingUser.user_metadata?.email_verified) {
        return NextResponse.json(
          { error: "User already exists. Please login." },
          { status: 400 }
        );
      }
      
      // If user exists but unverified, we might want to resend OTP or update password
      // For now, let's treat it as a new registration attempt and update the user
      // But we need the user ID to update.
      
      // Actually, let's just delete the unverified user and create a new one to avoid complexity
      // Or better, just update the existing unverified user
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes

    let userId;

    if (existingUser) {
       userId = existingUser.id;
       // Update existing unverified user
       const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
         password: password,
         user_metadata: {
           ...existingUser.user_metadata,
           full_name: fullName,
           email_verified: false,
           otp: otp,
           otp_expiry: otpExpiry
         }
       });

       if (updateError) {
         console.error("Error updating user:", updateError);
         return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
       }
    } else {
      // Create new user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm email at Supabase level, we handle verification manually via OTP
        user_metadata: {
          full_name: fullName,
          email_verified: false, // Custom verification flag
          otp: otp,
          otp_expiry: otpExpiry,
          role: "user"
        },
      });

      if (createError) {
        console.error("Error creating user:", createError);
        return NextResponse.json(
          { error: createError.message || "Failed to create user" },
          { status: 500 }
        );
      }
      userId = newUser.user.id;
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
                  name: fullName || "User",
                },
              ],
              variables: {
                otp: otp,
              },
            },
          ],
          from: {
            email: "no-reply@themollywoodclothing.com",
          },
          domain: "themollywoodclothing.com",
          template_id: "mollywood_signup",
        }),
      }
    );

    const emailData = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("MSG91 Email Error:", emailData);
      // If email fails, we should probably delete the user or handle it. 
      // But for now, just return error.
      return NextResponse.json(
        { error: "Failed to send OTP. Please try again." },
        { status: 500 }
      );
    }

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
    console.error("Register initiate error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to initiate registration" },
      { status: 500 }
    );
  }
}
