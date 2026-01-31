import { NextRequest, NextResponse } from "next/server";
import { captureLeadWithAttachments } from "@/actions/leads";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const fields = Array.from(formData.entries());
    console.log("API leads: received form data with fields:", fields.map(([key, value]) => ({ 
      key, 
      isFile: value instanceof File,
      size: value instanceof File ? value.size : undefined,
      name: value instanceof File ? value.name : undefined,
      value: value instanceof File ? '[File]' : String(value).slice(0, 100)
    })));
    
    const result = await captureLeadWithAttachments(formData);
    console.log("API leads: result", result);
    
    if (result.success) {
      return NextResponse.json(result, { status: 200 });
    } else {
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error) {
    console.error("API leads error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}

// Route segment config - disable body parsing for file uploads
export const runtime = 'nodejs';
export const bodyParser = false;