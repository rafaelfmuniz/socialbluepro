import { sendEmail } from "@/actions/email";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, subject, body: emailBody, isHtml = false, purpose = 'general' } = body;
    
    if (!to || !subject || !emailBody) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: to, subject, body" },
        { status: 400 }
      );
    }

    console.log(`[SEND EMAIL API] Sending to: ${to}, subject: ${subject}`);
    
    const result = await sendEmail(to, subject, emailBody, isHtml, purpose);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("[SEND EMAIL API] Error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
