import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import { join, normalize, extname } from "path";

const UPLOAD_BASE = join(process.cwd(), "public", "uploads");

const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".pdf": "application/pdf",
  ".heic": "image/heic",
};

function getMimeType(filePath: string) {
  const ext = extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || "application/octet-stream";
}

function ensureWithinUploadDir(candidate: string) {
  const normalized = normalize(candidate);
  return normalized.startsWith(UPLOAD_BASE) ? normalized : null;
}

export async function GET(_request: NextRequest, props: { params: Promise<{ path?: string[] }> }) {
  const params = await props.params;
  const segments = params?.path;
  if (!segments || segments.length === 0) {
    return NextResponse.json({ error: "Missing attachment path" }, { status: 400 });
  }

  const requestedPath = join(UPLOAD_BASE, ...segments);
  const safePath = ensureWithinUploadDir(requestedPath);
  if (!safePath) {
    return NextResponse.json({ error: "Invalid attachment" }, { status: 400 });
  }

  try {
    const data = await fs.readFile(safePath);
    return new NextResponse(data, {
      headers: {
        "Content-Type": getMimeType(safePath),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Attachment not found", error);
    return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
  }
}
