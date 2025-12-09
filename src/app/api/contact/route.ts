import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, subject, message } = body;

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: "Please fill all required fields" },
        { status: 400 }
      );
    }

    const payload = {
      recipients: [
        {
          to: [
            {
              email: "info@themollywoodclothing.com",
              name: "Mollywood Admin"
            }
          ],
          variables: {
            user_name: name,
            user_email: email,
            user_phone: phone || "Not provided",
            user_subject: subject,
            user_message: message,
          }
        }
      ],

      from: {
        email: "no-reply@themollywoodclothing.com"
      },
      domain: "send.themollywoodclothing.com",
      template_id: "mollywood_form"
    };

    const resp = await fetch("https://control.msg91.com/api/v5/email/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authkey: process.env.MSG91_AUTH_KEY || "481065A71TZKyy1p69311733P1"
      },
      body: JSON.stringify(payload)
    });

    const data = await resp.json();

    if (!resp.ok || data.hasError) {
      return NextResponse.json(
        { error: data.message || "Failed to send email" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "Message sent successfully" });

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to send email" },
      { status: 500 }
    );
  }
}
