import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, otp } = body;

    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email and OTP are required' },
        { status: 400 }
      );
    }

    // Get user from Supabase by email using admin client
    const { data: users, error: userError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (userError) {
      console.error('Error fetching users:', userError);
      return NextResponse.json(
        { error: 'Failed to verify OTP' },
        { status: 500 }
      );
    }

    const user = users.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or OTP' },
        { status: 400 }
      );
    }

    // Get stored OTP from user metadata
    const storedOtp = user.user_metadata?.reset_otp;
    const otpExpiry = user.user_metadata?.reset_otp_expiry;

    if (!storedOtp || !otpExpiry) {
      return NextResponse.json(
        { error: 'OTP not found or expired. Please request a new OTP.' },
        { status: 400 }
      );
    }

    // Check if OTP is expired
    if (Date.now() > otpExpiry) {
      return NextResponse.json(
        { error: 'OTP has expired. Please request a new OTP.' },
        { status: 400 }
      );
    }

    // Verify OTP
    if (storedOtp !== otp) {
      return NextResponse.json(
        { error: 'Invalid OTP. Please try again.' },
        { status: 400 }
      );
    }

    // OTP verified - clear OTP from metadata and create a reset token
    const resetToken = crypto.randomUUID();
    
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      {
        user_metadata: {
          ...user.user_metadata,
          reset_otp: null,
          reset_otp_expiry: null,
          reset_token: resetToken,
          reset_token_expiry: Date.now() + 30 * 60 * 1000, // 30 minutes
        },
      }
    );

    if (updateError) {
      console.error('Error updating user:', updateError);
      return NextResponse.json(
        { error: 'Failed to verify OTP' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'OTP verified successfully',
      resetToken: resetToken,
    });
  } catch (error: any) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify OTP' },
      { status: 500 }
    );
  }
}

