import { NextRequest, NextResponse } from "next/server";
import Busboy from "busboy";
import { createWriteStream } from "fs";
import { mkdir } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { randomUUID } from "crypto";
import { captureLead } from "@/actions/leads";
import { createMediaJob, ProcessingAttachment } from "@/lib/media-queue";
import { Prisma } from "@prisma/client";

const MAX_VIDEO_UPLOAD_BYTES = parseInt(process.env.MAX_VIDEO_UPLOAD_BYTES || "1073741824", 10); // 1GB default
const UPLOAD_TMP_DIR = process.env.UPLOAD_TMP_DIR || join(tmpdir(), "socialbluepro-uploads");

interface ParsedForm {
  fields: Record<string, string>;
  files: Array<{
    tempPath: string;
    originalName: string;
    size: number;
    mimeType: string;
  }>;
}

async function parseForm(request: NextRequest): Promise<ParsedForm> {
  return new Promise((resolve, reject) => {
    const fields: Record<string, string> = {};
    const files: ParsedForm["files"] = [];
    const filePromises: Promise<void>[] = [];

    // Get content type from headers
    const contentType = request.headers.get("content-type") || "";
    
    if (!contentType.includes("multipart/form-data")) {
      reject(new Error("Expected multipart/form-data"));
      return;
    }

    const busboy = Busboy({
      headers: { "content-type": contentType },
      limits: {
        fileSize: MAX_VIDEO_UPLOAD_BYTES,
        files: 10, // Max 10 files per upload
        fields: 50, // Max 50 fields
      },
    });

    busboy.on("file", (name, file, info) => {
      const { filename, mimeType } = info;
      
      if (!filename) {
        file.resume(); // Skip empty files
        return;
      }

      const uploadId = randomUUID();
      const tempPath = join(UPLOAD_TMP_DIR, `${uploadId}-${filename}`);
      
      const writeStream = createWriteStream(tempPath);
      let fileSize = 0;

      const filePromise = new Promise<void>((fileResolve, fileReject) => {
        file.on("data", (data: Buffer) => {
          fileSize += data.length;
          if (fileSize > MAX_VIDEO_UPLOAD_BYTES) {
            writeStream.destroy();
            file.resume(); // Drain the stream
            fileReject(new Error(`File ${filename} exceeds maximum size of ${MAX_VIDEO_UPLOAD_BYTES} bytes`));
          }
        });

        file.on("end", () => {
          files.push({
            tempPath,
            originalName: filename,
            size: fileSize,
            mimeType,
          });
          fileResolve();
        });

        file.on("error", (err: Error) => {
          writeStream.destroy();
          fileReject(err);
        });

        writeStream.on("error", (err) => {
          fileReject(err);
        });
      });

      filePromises.push(filePromise);
      file.pipe(writeStream);
    });

    busboy.on("field", (name, value) => {
      fields[name] = value;
    });

    busboy.on("error", (err: Error) => {
      reject(err);
    });

    busboy.on("finish", async () => {
      try {
        await Promise.all(filePromises);
        resolve({ fields, files });
      } catch (err) {
        reject(err);
      }
    });

    // Pipe the request body to busboy
    const reader = request.body?.getReader();
    if (!reader) {
      reject(new Error("No request body"));
      return;
    }

    // Read and pipe chunks
    const pump = async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            busboy.end();
            break;
          }
          busboy.write(value);
        }
      } catch (err) {
        busboy.destroy(err as Error);
      }
    };

    pump();
  });
}

export async function POST(request: NextRequest) {
  // Ensure temp directory exists
  await mkdir(UPLOAD_TMP_DIR, { recursive: true });

  try {
    console.log("[API/leads] Starting streaming upload parse");
    
    const { fields, files } = await parseForm(request);
    
    console.log("[API/leads] Parsed form:", {
      fieldCount: Object.keys(fields).length,
      fileCount: files.length,
      fieldNames: Object.keys(fields),
    });

    // Extract required fields
    const {
      name,
      email,
      phone,
      zip,
      address_line1,
      city,
      state,
      service,
      description,
      budget,
      timeframe,
      // UTM params
      utm_source,
      utm_medium,
      utm_campaign,
      utm_term,
      utm_content,
    } = fields;

    // Validate required fields
    if (!name || !email || !phone || !zip || !service) {
      // Cleanup temp files on validation error
      await Promise.all(files.map(f => 
        import("fs/promises").then(fs => fs.unlink(f.tempPath).catch(() => {}))
      ));
      
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate budget and timeframe
    const VALID_BUDGETS = ["Under $1,000", "$1,000 - $5,000", "$5,000 - $10,000", "$10,000 - $20,000", "$20,000+"];
    const VALID_TIMEFRAMES = ["As soon as possible", "Within 2 weeks", "Within a month", "Just planning"];
    
    if (!budget || !VALID_BUDGETS.includes(budget)) {
      await Promise.all(files.map(f => 
        import("fs/promises").then(fs => fs.unlink(f.tempPath).catch(() => {}))
      ));
      return NextResponse.json(
        { success: false, error: "Please select a valid budget option" },
        { status: 400 }
      );
    }
    
    if (!timeframe || !VALID_TIMEFRAMES.includes(timeframe)) {
      await Promise.all(files.map(f => 
        import("fs/promises").then(fs => fs.unlink(f.tempPath).catch(() => {}))
      ));
      return NextResponse.json(
        { success: false, error: "Please select a valid timeframe option" },
        { status: 400 }
      );
    }

    console.log("[API/leads] Creating lead with attachments...");

    // Create lead first (without attachments)
    const leadCreationResult = await captureLead({
      name,
      email,
      phone,
      address_line1: address_line1 || undefined,
      city: city || undefined,
      state: state || undefined,
      zip_code: zip,
      service_interest: service,
      description: description || undefined,
      notes: `Budget: ${budget}, Timeframe: ${timeframe}`,
      attachments: [],
      utm_source: utm_source || undefined,
      utm_medium: utm_medium || undefined,
      utm_campaign: utm_campaign || undefined,
      utm_term: utm_term || undefined,
      utm_content: utm_content || undefined,
    });

    if (!leadCreationResult.success) {
      // Cleanup temp files on lead creation failure
      await Promise.all(files.map(f => 
        import("fs/promises").then(fs => fs.unlink(f.tempPath).catch(() => {}))
      ));
      
      return NextResponse.json(leadCreationResult, { status: 400 });
    }

    const leadId = leadCreationResult.data?.id;
    if (!leadId) {
      await Promise.all(files.map(f => 
        import("fs/promises").then(fs => fs.unlink(f.tempPath).catch(() => {}))
      ));
      
      return NextResponse.json(
        { success: false, error: "Failed to create lead" },
        { status: 500 }
      );
    }

    console.log("[API/leads] Lead created:", leadId);

    // Create media jobs for each file
    const attachments: ProcessingAttachment[] = [];
    
    for (const file of files) {
      try {
        console.log("[API/leads] Creating media job for:", file.originalName);
        const attachment = await createMediaJob(
          leadId,
          file.tempPath,
          file.originalName,
          file.size,
          file.mimeType
        );
        attachments.push(attachment);
      } catch (error) {
        console.error("[API/leads] Failed to create media job:", error);
        // Try to cleanup the temp file
        try {
          await import("fs/promises").then(fs => fs.unlink(file.tempPath));
        } catch {}
      }
    }

    console.log("[API/leads] Created", attachments.length, "attachments");

    // Update lead with attachments
    if (attachments.length > 0) {
      try {
        const { prisma } = await import("@/lib/prisma");
        await prisma.lead.update({
          where: { id: leadId },
          data: { 
            attachments: attachments as unknown as Prisma.InputJsonValue 
          },
        });
        console.log("[API/leads] Updated lead with attachments");
      } catch (error) {
        console.error("[API/leads] Failed to update lead with attachments:", error);
        // Non-fatal: lead exists, files are queued, admin can see them
      }
    }

    // Return success response
    return NextResponse.json({
      ...leadCreationResult,
      data: leadCreationResult.data ? {
        ...leadCreationResult.data,
        attachments,
      } : leadCreationResult.data,
    }, { status: 200 });

  } catch (error) {
    console.error("[API/leads] Error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Internal server error" 
      },
      { status: 500 }
    );
  }
}

// Route segment config - use Node.js runtime for streaming
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
