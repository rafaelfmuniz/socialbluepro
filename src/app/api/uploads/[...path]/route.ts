import { NextRequest, NextResponse } from "next/server";
import { createReadStream, statSync } from "fs";
import { open } from "fs/promises";
import { join, normalize, extname } from "path";
import { Readable } from "stream";

// Use absolute path via env to avoid cwd issues with standalone output
const UPLOAD_BASE = process.env.UPLOAD_DIR || "/opt/socialbluepro/public/uploads";

// Allowed paths (security: only serve from leads directory)
const ALLOWED_PATH_PREFIX = join(UPLOAD_BASE, "leads");

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
  // Security: ensure path is within allowed directory
  if (!normalized.startsWith(ALLOWED_PATH_PREFIX)) {
    return null;
  }
  return normalized;
}

// Convert Node stream to Web stream
function nodeStreamToWebStream(nodeStream: Readable): ReadableStream {
  return new ReadableStream({
    start(controller) {
      nodeStream.on("data", (chunk) => {
        controller.enqueue(chunk);
      });
      nodeStream.on("end", () => {
        controller.close();
      });
      nodeStream.on("error", (err) => {
        controller.error(err);
      });
    },
    cancel() {
      nodeStream.destroy();
    },
  });
}

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ path?: string[] }> }
) {
  const params = await props.params;
  const segments = params?.path;

  console.log("[API/Uploads] Request segments:", segments);

  if (!segments || segments.length === 0) {
    console.error("[API/Uploads] Missing path segments");
    return NextResponse.json({ error: "Missing attachment path" }, { status: 400 });
  }

  const requestedPath = join(UPLOAD_BASE, ...segments);
  console.log("[API/Uploads] Requested path:", requestedPath);

  const safePath = ensureWithinUploadDir(requestedPath);

  if (!safePath) {
    console.error("[API/Uploads] Invalid/Unsafe path:", requestedPath);
    return NextResponse.json({ error: "Invalid attachment" }, { status: 403 });
  }

  try {
    // Get file stats
    const stats = statSync(safePath);
    const fileSize = stats.size;
    const mimeType = getMimeType(safePath);

    // Check for Range header (needed for video streaming)
    const range = request.headers.get("range");

    if (range) {
      // Parse Range header (e.g., "bytes=0-1023")
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize || end >= fileSize || start > end) {
        return new NextResponse(null, {
          status: 416,
          headers: {
            "Content-Range": `bytes */${fileSize}`,
          },
        });
      }

      const chunkSize = end - start + 1;

      // Use file handle for efficient reading
      const fileHandle = await open(safePath, "r");
      const buffer = Buffer.alloc(chunkSize);
      await fileHandle.read(buffer, 0, chunkSize, start);
      await fileHandle.close();

      return new NextResponse(buffer, {
        status: 206,
        headers: {
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunkSize.toString(),
          "Content-Type": mimeType,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }

    // No Range header - stream the full file efficiently
    const fileStream = createReadStream(safePath);
    const webStream = nodeStreamToWebStream(fileStream);

    return new NextResponse(webStream, {
      headers: {
        "Content-Type": mimeType,
        "Content-Length": fileSize.toString(),
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("[API/Uploads] File not found:", error);
    return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
  }
}

// Use Node.js runtime for file system access
export const runtime = "nodejs";
