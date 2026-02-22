// Media Queue Utilities
// Handles job creation and management for the media processing worker

import { promises as fs } from 'fs';
import { join, resolve } from 'path';
import { randomUUID } from 'crypto';

const MEDIA_QUEUE_DIR = resolve(process.env.MEDIA_QUEUE_DIR || '/opt/socialbluepro/var/media-queue');
const UPLOAD_TMP_DIR = resolve(process.env.UPLOAD_TMP_DIR || '/opt/socialbluepro/var/uploads-tmp');
const UPLOAD_DIR = resolve(process.env.UPLOAD_DIR || '/opt/socialbluepro/public/uploads');

export const ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'heic', 'heif'];
export const ALLOWED_VIDEO_EXTENSIONS = ['mp4', 'mov'];
export const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/heic', 'image/heif'];
export const ALLOWED_VIDEO_MIMES = ['video/mp4', 'video/quicktime'];

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

function getExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

export function isValidMediaType(mimeType: string, filename: string): { valid: boolean; error?: string } {
  const ext = getExtension(filename);
  const mime = mimeType.toLowerCase();
  
  const isImage = ALLOWED_IMAGE_EXTENSIONS.includes(ext) && ALLOWED_IMAGE_MIMES.includes(mime);
  const isVideo = ALLOWED_VIDEO_EXTENSIONS.includes(ext) && ALLOWED_VIDEO_MIMES.includes(mime);
  
  if (!isImage && !isVideo) {
    return {
      valid: false,
      error: `Formato não suportado: .${ext}. Use JPG, HEIC (fotos) ou MP4, MOV (vídeos).`
    };
  }
  
  return { valid: true };
}

export function getFileKind(mimeType: string, filename: string): 'image' | 'video' | null {
  const ext = getExtension(filename);
  
  if (ALLOWED_IMAGE_EXTENSIONS.includes(ext)) {
    return 'image';
  }
  
  if (ALLOWED_VIDEO_EXTENSIONS.includes(ext)) {
    return 'video';
  }
  
  return null;
}

export function needsImageConversion(filename: string): boolean {
  const ext = getExtension(filename);
  return ['heic', 'heif'].includes(ext);
}

export function needsVideoProcessing(filename: string): boolean {
  const ext = getExtension(filename);
  return ext === 'mov';
}

export async function createMediaJob(
  leadId: string,
  tempPath: string,
  originalName: string,
  originalSize: number,
  originalMime: string
): Promise<ProcessingAttachment> {
  await ensureQueueDirectories();
  
  const validation = isValidMediaType(originalMime, originalName);
  if (!validation.valid) {
    throw new Error(validation.error || `Unsupported file type: ${originalMime} / ${originalName}`);
  }
  
  const kind = getFileKind(originalMime, originalName);
  
  if (!kind) {
    throw new Error(`Unsupported file type: ${originalMime} / ${originalName}`);
  }
  
  const attachmentId = randomUUID();
  const jobId = randomUUID();
  
  let outputExt: string;
  if (kind === 'image') {
    outputExt = needsImageConversion(originalName) ? '.jpg' : `.${getExtension(originalName)}`;
  } else {
    outputExt = '.mp4';
  }
  
  const needsProcessing = (kind === 'image' && needsImageConversion(originalName)) || 
                          (kind === 'video' && needsVideoProcessing(originalName));
  
  const ext = getExtension(originalName);
  
  if (!needsProcessing) {
    const finalPath = join(UPLOAD_DIR, 'leads', leadId, `${attachmentId}${outputExt}`);
    const finalUrl = `/api/uploads/leads/${leadId}/${attachmentId}${outputExt}`;
    
    await fs.mkdir(join(UPLOAD_DIR, 'leads', leadId), { recursive: true });
    await fs.rename(tempPath, finalPath);
    
    const stats = await fs.stat(finalPath);
    
    const finalName = kind === 'video' && ext === 'mov' 
      ? originalName.replace(/\.mov$/i, '.mp4')
      : originalName;
    
    return {
      id: attachmentId,
      name: finalName,
      url: finalUrl,
      path: finalPath,
      size: stats.size,
      type: kind === 'image' ? 'image/jpeg' : 'video/mp4',
      status: 'ready',
      kind,
      original: {
        name: originalName,
        size: originalSize,
        type: originalMime,
      },
      createdAt: new Date().toISOString(),
      processedAt: new Date().toISOString(),
    };
  }
  
  const organizedTempPath = join(UPLOAD_TMP_DIR, 'leads', leadId, `${attachmentId}.${ext}`);
  await fs.mkdir(join(UPLOAD_TMP_DIR, 'leads', leadId), { recursive: true });
  await fs.rename(tempPath, organizedTempPath);
  
  const outputPath = join(UPLOAD_DIR, 'leads', leadId, `${attachmentId}${outputExt}`);
  const outputUrl = `/api/uploads/leads/${leadId}/${attachmentId}${outputExt}`;
  
  const finalName = kind === 'video' 
    ? originalName.replace(/\.mov$/i, '.mp4')
    : originalName.replace(/\.heic$/i, '.jpg').replace(/\.heif$/i, '.jpg');
  
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
  
  await fs.writeFile(
    join(QUEUE_DIRS.pending, `${jobId}.json`),
    JSON.stringify(job, null, 2)
  );
  
  return {
    id: attachmentId,
    name: finalName,
    url: outputUrl,
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

export function updateAttachmentFromJob(
  attachment: ProcessingAttachment,
  job: MediaJob
): ProcessingAttachment {
  if (job.status === 'completed' && job.result) {
    const finalExt = job.result.ext;
    const originalName = attachment.original?.name || attachment.name;
    let finalName = originalName;
    
    if (job.kind === 'video') {
      finalName = originalName.replace(/\.(mov|mp4)$/i, finalExt);
    } else if (job.kind === 'image') {
      finalName = originalName.replace(/\.(heic|heif|jpg|jpeg)$/i, finalExt);
    }
    
    return {
      ...attachment,
      name: finalName,
      status: 'ready',
      size: job.result.size,
      type: job.result.mime,
      kind: job.kind,
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

export async function cleanupLeadTempFiles(leadId: string): Promise<void> {
  const leadTempDir = join(UPLOAD_TMP_DIR, 'leads', leadId);
  
  try {
    await fs.rm(leadTempDir, { recursive: true, force: true });
  } catch (e) {
    // Directory might not exist, that's fine
  }
}

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
          await fs.unlink(jobPath);
          
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
