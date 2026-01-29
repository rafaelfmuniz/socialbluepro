import { NextRequest, NextResponse } from "next/server";
import { recordEmailOpen } from "@/actions/email-tracking";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ trackingId: string }> }
) {
  const { trackingId } = await params;
  
  try {
    console.log("[TRACK PIXEL] Open tracked:", trackingId);
    
    // Detect user agent for device type
    const userAgent = request.headers.get("user-agent") || "";
    const deviceType = /Mobile|Android|iPhone/i.test(userAgent) ? "mobile" : "desktop";
    
    // Detect client type (email client)
    let clientType = "unknown";
    if (userAgent.includes("Gmail")) {
      clientType = "gmail";
    } else if (userAgent.includes("Outlook")) {
      clientType = "outlook";
    } else if (userAgent.includes("AppleMail")) {
      clientType = "apple-mail";
    } else if (userAgent.includes("Thunderbird")) {
      clientType = "thunderbird";
    }
    
    console.log("[TRACK PIXEL] Device:", deviceType, "Client:", clientType);
    
    // Record open in database
    const success = await recordEmailOpen(trackingId, deviceType, clientType);
    if (!success) {
      console.error("[TRACK PIXEL] Failed to record open for:", trackingId);
      // Still return pixel even if recording fails
    }
    
    // Create a 1x1 transparent GIF pixel
    const pixel = Buffer.from(
      "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
      "base64"
    );
    
    return new NextResponse(pixel, {
      status: 200,
      headers: {
        "Content-Type": "image/gif",
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0"
      }
    });
  } catch (error) {
    console.error("[TRACK PIXEL] Error:", error);
    // Still return pixel to avoid breaking email display
    const pixel = Buffer.from(
      "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
      "base64"
    );
    return new NextResponse(pixel, {
      status: 200,
      headers: {
        "Content-Type": "image/gif",
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Pragma": "no-cache"
      }
    });
  }
}
