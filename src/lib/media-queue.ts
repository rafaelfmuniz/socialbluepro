// Media Queue Utilities
// Handles job creation and management for the media processing worker

import { promises as fs } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';

const MEDIA_QUEUE_DIR = process.env.MEDIA_QUEUE_DIR || '/opt/socialbluepro/var/media-queue';
const UPLOAD_TMP_DIR = process.env.UPLOAD_TMP_DIR || '/opt/socialbluepro/var/uploads-tmp';
const UPLOAD_DIR = process.env.UPLOAD_DIR || '/opt/socialbluepro/public/uploads';

export interface MediaJob {
  jobId: string;
  leadId: string;
  attachmentId: string;
  kind: 'image' | 'video';
  inputPath: string;
  outputPath: string;
  originalName: string;
  originalSize: number;
  originalMime?: string;
  attempt: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
  failedAt?: string;
  result?: {
    success: boolean;
    size: number;
    mime: string;
    ext: string;
    meta?: {
      width?: number;
      height?: number;
      duration?: number;
      fps?: number;
    };
  };
  error?: string;
}

export interface ProcessingAttachment {
  id: string;
  name: string;
  url: string;
  path: string;
  size: number;
  type: string;
  status: 'processing' | 'ready' | 'failed';
  kind: 'image' | 'video';
  original?: {
    name: string;
    size: number;
    type: string;
  };
  meta?: {
    width?: number;
    height?: number;
    duration?: number;
    fps?: number;
  };
  error?: string;
  createdAt: string;
  processedAt?: string;
}

const QUEUE_DIRS = {
  pending: join(MEDIA_QUEUE_DIR, 'pending'),
  processing: join(MEDIA_QUEUE_DIR, 'processing'),
  done: join(MEDIA_QUEUE_DIR, 'done'),
  failed: join(MEDIA_QUEUE_DIR, 'failed'),
};

// Ensure queue directories exist
export async function ensureQueueDirectories(): Promise<void> {
  const dirs = [
    MEDIA_QUEUE_DIR,
    UPLOAD_TMP_DIR,
    ...Object.values(QUEUE_DIRS),
    join(UPLOAD_DIR, 'leads'),
  ];

  for (const dir of dirs) {
    await fs.mkdir(dir, { recursive: true });
  }
}

// Get file extension
function getExtension(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return ext;
}

// Determine file kind based on mime type and extension
export function getFileKind(mimeType: string, filename: string): 'image' | 'video' | null {
  const ext = getExtension(filename);
  
  // Image types (including HEIC/HEIF)
  if (mimeType.startsWith('image/') || ['heic', 'heif'].includes(ext)) {
    return 'image';
  }
  
  // Video types
  if (mimeType.startsWith('video/') || ['mov', 'mp4', 'avi', 'mkv', 'webm'].includes(ext)) {
    return 'video';
  }
  
  // Default based on extension
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext)) {
    return 'image';
  }
  
  if (['mov', 'mp4', 'avi', 'mkv', 'webm', 'm4v', '3gp'].includes(ext)) {
    return 'video';
  }
  
  return null;
}

// Check if image needs conversion (only HEIC/HEIF)
export function needsImageConversion(filename: string): boolean {
  const ext = getExtension(filename);
  return ['heic', 'heif'].includes(ext);
}

// Check if video needs processing (always convert to MP4)
export function needsVideoProcessing(filename: string): boolean {
  const ext = getExtension(filename);
  // Always process to ensure MP4 format and 720p limit
  return true;
}

// Create a new processing job
export async function createMediaJob(
  leadId: string,
  tempPath: string,
  originalName: string,
  originalSize: number,
  originalMime: string
): Promise<ProcessingAttachment> {
  await ensureQueueDirectories();
  
  const kind = getFileKind(originalMime, originalName);
  
  if (!kind) {
    throw new Error(`Unsupported file type: ${originalMime} / ${originalName}`);
  }
  
  const attachmentId = randomUUID();
  const jobId = randomUUID();
  
  // Determine output extension
  let outputExt: string;
  if (kind === 'image') {
    outputExt = needsImageConversion(originalName) ? '.jpg' : `.${getExtension(originalName)}`;
  } else {
    outputExt = '.mp4';
  }
  
  // If no conversion needed for image, just move it
  if (kind === 'image' && !needsImageConversion(originalName)) {
    const finalPath = join(UPLOAD_DIR, 'leads', leadId, `${attachmentId}${outputExt}`);
    const finalUrl = `/api/uploads/leads/${leadId}/${attachmentId}${outputExt}`;
    
    // Move file to final location
    await fs.mkdir(join(UPLOAD_DIR, 'leads', leadId), { recursive: true });
    await fs.rename(tempPath, finalPath);
    
    const stats = await fs.stat(finalPath);
    
    return {
      id: attachmentId,
      name: originalName,
      url: finalUrl,
      path: finalPath,
      size: stats.size,
      type: originalMime,
      status: 'ready',
      kind: 'image',
      original: {
        name: originalName,
        size: originalSize,
        type: originalMime,
      },
      createdAt: new Date().toISOString(),
      processedAt: new Date().toISOString(),
    };
  }
  
  // Move temp file to organized location
  const organizedTempPath = join(UPLOAD_TMP_DIR, 'leads', leadId, `${attachmentId}.${getExtension(originalName)}`);
  await fs.mkdir(join(UPLOAD_TMP_DIR, 'leads', leadId), { recursive: true });
  await fs.rename(tempPath, organizedTempPath);
  
  // Determine output paths
  const outputPath = join(UPLOAD_DIR, 'leads', leadId, `${attachmentId}${outputExt}`);
  const outputUrl = `/api/uploads/leads/${leadId}/${attachmentId}${outputExt}`;
  
  // Create job
  const job: MediaJob = {
    jobId,
    leadId,
    attachmentId,
    kind,
    inputPath: organizedTempPath,
    outputPath,
    originalName,
    originalSize,
    originalMime,
    attempt: 0,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  
  // Write job to pending queue
  await fs.writeFile(
    join(QUEUE_DIRS.pending, `${jobId}.json`),
    JSON.stringify(job, null, 2)
  );
  
  return {
    id: attachmentId,
    name: originalName,
    url: outputUrl, // URL where it WILL be after processing
    path: outputPath,
    size: originalSize,
    type: kind === 'image' ? 'image/jpeg' : 'video/mp4',
    status: 'processing',
    kind,
    original: {
      name: originalName,
      size: originalSize,
      type: originalMime,
    },
    createdAt: new Date().toISOString(),
  };
}

// Update attachment from completed job
export function updateAttachmentFromJob(
  attachment: ProcessingAttachment,
  job: MediaJob
): ProcessingAttachment {
  if (job.status === 'completed' && job.result) {
    return {
      ...attachment,
      status: 'ready',
      size: job.result.size,
      type: job.result.mime,
      meta: job.result.meta,
      processedAt: job.completedAt,
    };
  }
  
  if (job.status === 'failed') {
    return {
      ...attachment,
      status: 'failed',
      error: job.error || 'Unknown error',
      processedAt: job.failedAt,
    };
  }
  
  return attachment;
}

// Cleanup temp files for a lead
export async function cleanupLeadTempFiles(leadId: string): Promise<void> {
  const leadTempDir = join(UPLOAD_TMP_DIR, 'leads', leadId);
  
  try {
    await fs.rm(leadTempDir, { recursive: true, force: true });
  } catch (e) {
    // Directory might not exist, that's fine
  }
}

// Cleanup pending jobs for a lead
export async function cleanupLeadJobs(leadId: string): Promise<void> {
  const dirs = [QUEUE_DIRS.pending, QUEUE_DIRS.processing];
  
  for (const dir of dirs) {
    try {
      const files = await fs.readdir(dir);
      
      for (const file of files) {
        if (!file.endsWith('.json')) continue;
        
        const jobPath = join(dir, file);
        const job = JSON.parse(await fs.readFile(jobPath, 'utf-8'));
        
        if (job.leadId === leadId) {
          // Delete job file
          await fs.unlink(jobPath);
          
          // Try to delete temp file
          try {
            await fs.unlink(job.inputPath);
          } catch {}
        }
      }
    } catch (e) {
      // Directory might not exist
    }
  }
}
