import { NextRequest, NextResponse } from "next/server";
import { getShortLinkBySlug, incrementClicks } from "@/actions/shortlinks";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
    const result = await getShortLinkBySlug(slug);
    
    if (!result.success || !result.data) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    const shortLink = result.data;

    if (!shortLink.active) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Increment click count
    await incrementClicks(slug);

    // Redirect to destination
    return NextResponse.redirect(shortLink.destination);
  } catch (error) {
    console.error("[REDIRECT] Error:", error);
    return NextResponse.redirect(new URL("/", request.url));
  }
}
