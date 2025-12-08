import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, otp } = body;

    if (!email || !otp) {
      return NextResponse.json(
        { error: "Email and OTP are required" },
        { status: 400 }
      );
    }

    // Get user from Supabase by email
    const { data: users, error: userError } =
      await supabaseAdmin.auth.admin.listUsers();

    if (userError) {
      console.error("Error fetching users:", userError);
      return NextResponse.json(
        { error: "Failed to verify OTP" },
        { status: 500 }
      );
    }

    const user = users.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check OTP
    const storedOtp = user.user_metadata?.otp;
    const otpExpiry = user.user_metadata?.otp_expiry;

    if (!storedOtp || !otpExpiry) {
      return NextResponse.json(
        { error: "Invalid or expired OTP" },
        { status: 400 }
      );
    }

    if (Date.now() > otpExpiry) {
      return NextResponse.json(
        { error: "OTP has expired" },
        { status: 400 }
      );
    }

    if (storedOtp !== otp) {
      return NextResponse.json(
        { error: "Invalid OTP" },
        { status: 400 }
      );
    }

    // Mark user as verified and clear OTP
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      {
        user_metadata: {
          ...user.user_metadata,
          email_verified: true,
          otp: null,
          otp_expiry: null,
        },
      }
    );

    if (updateError) {
      console.error("Error updating user:", updateError);
      return NextResponse.json(
        { error: "Failed to verify user" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Account verified successfully",
    });

  } catch (error: any) {
    console.error("Register verify error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to verify OTP" },
      { status: 500 }
    );
  }
}
