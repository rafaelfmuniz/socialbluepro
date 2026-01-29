import { NextRequest, NextResponse } from "next/server";
import { recordEmailClick } from "@/actions/email-tracking";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ trackingId: string }> }
) {
  const { trackingId } = await params;
  
  try {
    console.log("[TRACK CLICK] Click tracked:", trackingId);
    
    // Get the redirect URL from query parameters
    const url = request.nextUrl.searchParams.get("url");
    
    if (!url) {
      console.error("[TRACK CLICK] Missing URL parameter");
      return new NextResponse("Missing URL parameter", { status: 400 });
    }
    
    // Decode the URL (it should be encoded)
    let redirectUrl: string;
    try {
      redirectUrl = decodeURIComponent(url);
    } catch {
      redirectUrl = url;
    }
    
    // Validate URL format
    if (!redirectUrl.startsWith("http://") && !redirectUrl.startsWith("https://")) {
      console.error("[TRACK CLICK] Invalid URL format:", redirectUrl);
      return new NextResponse("Invalid URL format", { status: 400 });
    }
    
    // Record the click in database
    const success = await recordEmailClick(trackingId);
    if (!success) {
      console.error("[TRACK CLICK] Failed to record click for:", trackingId);
      // Continue redirecting even if recording fails
    }
    
    console.log("[TRACK CLICK] Redirecting to:", redirectUrl);
    
    // Redirect to the original URL
    return NextResponse.redirect(redirectUrl, 302);
  } catch (error) {
    console.error("[TRACK CLICK] Error:", error);
    return new NextResponse("Error tracking click", { status: 500 });
  }
}