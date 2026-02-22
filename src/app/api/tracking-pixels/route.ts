import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const pixels = await prisma.trackingPixel.findMany({
      where: { is_enabled: true },
      orderBy: { created_at: "asc" },
      select: {
        id: true,
        name: true,
        type: true,
        code: true,
      },
    });

    return NextResponse.json({ success: true, pixels });
  } catch (error) {
    console.error("[API] Error fetching tracking pixels:", error);
    return NextResponse.json({ success: false, pixels: [] }, { status: 500 });
  }
}
