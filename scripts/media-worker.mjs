// Media Processing Worker for SocialBluePro
// Handles conversion of HEIC/HEIF images to JPEG and videos to MP4 (720p, 30fps)
// Runs as separate process with controlled CPU usage

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Prisma Client
const prisma = new PrismaClient();

// Environment configuration
const CONFIG = {
  UPLOAD_TMP_DIR: process.env.UPLOAD_TMP_DIR || '/opt/socialbluepro/var/uploads-tmp',
  MEDIA_QUEUE_DIR: process.env.MEDIA_QUEUE_DIR || '/opt/socialbluepro/var/media-queue',
  UPLOAD_DIR: process.env.UPLOAD_DIR || '/opt/socialbluepro/public/uploads',
  MAX_VIDEO_DURATION_SECONDS: parseInt(process.env.MAX_VIDEO_DURATION_SECONDS || '360', 10),
  VIDEO_OUTPUT_MAX_HEIGHT: parseInt(process.env.VIDEO_OUTPUT_MAX_HEIGHT || '720', 10),
  VIDEO_OUTPUT_FPS: parseInt(process.env.VIDEO_OUTPUT_FPS || '30', 10),
  FFMPEG_THREADS: parseInt(process.env.FFMPEG_THREADS || '2', 10),
  FFMPEG_PRESET: process.env.FFMPEG_PRESET || 'veryfast',
  FFMPEG_CRF: parseInt(process.env.FFMPEG_CRF || '23', 10),
  FFMPEG_MAXRATE: process.env.FFMPEG_MAXRATE || '3.5M',
  FFMPEG_BUFSIZE: process.env.FFMPEG_BUFSIZE || '7M',
  JOB_TIMEOUT_MS: parseInt(process.env.JOB_TIMEOUT_MS || '1200000', 10),
  MAX_RETRIES: parseInt(process.env.MAX_RETRIES || '1', 10),
  LOOP_INTERVAL_MS: parseInt(process.env.LOOP_INTERVAL_MS || '2000', 10),
};

const QUEUE_DIRS = {
  pending: join(CONFIG.MEDIA_QUEUE_DIR, 'pending'),
  processing: join(CONFIG.MEDIA_QUEUE_DIR, 'processing'),
  done: join(CONFIG.MEDIA_QUEUE_DIR, 'done'),
  failed: join(CONFIG.MEDIA_QUEUE_DIR, 'failed'),
};

// Logger
function log(level, message, meta = {}) {
  const timestamp = new Date().toISOString();
  const metaStr = Object.keys(meta).length ? ' ' + JSON.stringify(meta) : '';
  console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`);
}

// Ensure directories exist
async function ensureDirectories() {
  const dirs = [
    CONFIG.UPLOAD_TMP_DIR,
    CONFIG.MEDIA_QUEUE_DIR,
    ...Object.values(QUEUE_DIRS),
    join(CONFIG.UPLOAD_DIR, 'leads'),
  ];
  
  for (const dir of dirs) {
    await fs.mkdir(dir, { recursive: true });
  }
}

// Execute ffprobe to get video info
async function ffprobe(inputPath) {
  return new Promise((resolve, reject) => {
    const args = [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-show_entries', 'stream=codec_name,width,height,r_frame_rate',
      '-of', 'json',
      inputPath,
    ];
    
    const proc = spawn('ffprobe', args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    
    proc.stdout.on('data', (data) => { stdout += data; });
    proc.stderr.on('data', (data) => { stderr += data; });
    
    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`ffprobe failed: ${stderr || 'unknown error'}`));
      } else {
        try {
          resolve(JSON.parse(stdout));
        } catch (e) {
          reject(new Error(`ffprobe parse error: ${e.message}`));
        }
      }
    });
  });
}

// Execute ffmpeg
async function ffmpeg(args, timeoutMs = CONFIG.JOB_TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const proc = spawn('ffmpeg', args, { stdio: ['ignore', 'pipe', 'pipe'] });
    
    let stdout = '';
    let stderr = '';
    let timeoutId;
    
    proc.stdout.on('data', (data) => { stdout += data; });
    proc.stderr.on('data', (data) => { stderr += data; });
    
    const cleanup = () => {
      if (timeoutId) clearTimeout(timeoutId);
      try {
        proc.kill('SIGTERM');
      } catch {}
    };
    
    timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error(`ffmpeg timeout after ${timeoutMs}ms`));
    }, timeoutMs);
    
    proc.on('close', (code) => {
      cleanup();
      const duration = Date.now() - startTime;
      
      if (code !== 0) {
        reject(new Error(`ffmpeg failed (code ${code}): ${stderr.slice(-500)}`));
      } else {
        resolve({ duration, stderr });
      }
    });
    
    proc.on('error', (err) => {
      cleanup();
      reject(new Error(`ffmpeg spawn error: ${err.message}`));
    });
  });
}

// Execute heif-convert
async function heifConvert(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const proc = spawn('heif-convert', [inputPath, outputPath], { stdio: ['ignore', 'pipe', 'pipe'] });
    
    let stdout = '';
    let stderr = '';
    let timeoutId;
    
    proc.stdout.on('data', (data) => { stdout += data; });
    proc.stderr.on('data', (data) => { stderr += data; });
    
    const cleanup = () => {
      if (timeoutId) clearTimeout(timeoutId);
      try {
        proc.kill('SIGTERM');
      } catch {}
    };
    
    // heif-convert é rápido, timeout menor (5 min)
    timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error('heif-convert timeout after 5min'));
    }, 300000);
    
    proc.on('close', (code) => {
      cleanup();
      const duration = Date.now() - startTime;
      
      if (code !== 0) {
        reject(new Error(`heif-convert failed (code ${code}): ${stderr || 'unknown error'}`));
      } else {
        resolve({ duration, stderr });
      }
    });
    
    proc.on('error', (err) => {
      cleanup();
      if (err.code === 'ENOENT') {
        reject(new Error('heif-convert not found'));
      } else {
        reject(new Error(`heif-convert spawn error: ${err.message}`));
      }
    });
  });
}

// Check if file is HEIC/HEIF
function isHeicHeif(filename) {
  const ext = filename.toLowerCase().split('.').pop();
  return ext === 'heic' || ext === 'heif';
}

// Convert HEIC/HEIF to JPEG
async function convertImage(job) {
  const { inputPath, outputPath, originalName } = job;
  
  log('info', 'Converting image', { jobId: job.jobId, input: inputPath, originalName });
  
  const isHeic = isHeicHeif(originalName || inputPath);
  
  if (isHeic) {
    // Tentar heif-convert primeiro (melhor suporte para HEIC no Ubuntu)
    try {
      log('info', 'Using heif-convert for HEIC/HEIF', { jobId: job.jobId });
      await heifConvert(inputPath, outputPath);
      
      const stats = await fs.stat(outputPath);
      return {
        success: true,
        size: stats.size,
        mime: 'image/jpeg',
        ext: '.jpg',
      };
    } catch (heifError) {
      log('warn', 'heif-convert failed, trying ffmpeg fallback', { jobId: job.jobId, error: heifError.message });
      // Fallback para ffmpeg
    }
  }
  
  // Usar ffmpeg para outros formatos ou como fallback
  const args = [
    '-y',
    '-threads', String(CONFIG.FFMPEG_THREADS),
    '-i', inputPath,
    '-frames:v', '1',
    '-q:v', '2',
    outputPath,
  ];
  
  await ffmpeg(args);
  
  const stats = await fs.stat(outputPath);
  
  return {
    success: true,
    size: stats.size,
    mime: 'image/jpeg',
    ext: '.jpg',
  };
}

// Check if video can use fast remux
async function canFastRemux(probeData) {
  const videoStream = probeData.streams?.find(s => s.codec_type === 'video');
  const audioStream = probeData.streams?.find(s => s.codec_type === 'audio');
  
  if (!videoStream) return false;
  
  const isH264 = videoStream.codec_name === 'h264';
  const height = videoStream.height || 0;
  const is720OrLess = height <= CONFIG.VIDEO_OUTPUT_MAX_HEIGHT;
  const isAudioOk = !audioStream || audioStream.codec_name === 'aac';
  
  return isH264 && is720OrLess && isAudioOk;
}

// Convert video to MP4
async function convertVideo(job) {
  const { inputPath, outputPath } = job;
  
  log('info', 'Analyzing video', { jobId: job.jobId, input: inputPath });
  
  const probeData = await ffprobe(inputPath);
  const duration = parseFloat(probeData.format?.duration || '0');
  
  if (duration > CONFIG.MAX_VIDEO_DURATION_SECONDS) {
    throw new Error(`Video too long: ${duration}s > ${CONFIG.MAX_VIDEO_DURATION_SECONDS}s limit`);
  }
  
  const videoStream = probeData.streams?.find(s => s.codec_type === 'video');
  const width = videoStream?.width || 1920;
  const height = videoStream?.height || 1080;
  
  const canRemux = await canFastRemux(probeData);
  
  let args;
  
  if (canRemux) {
    log('info', 'Fast remux (no re-encode)', { jobId: job.jobId });
    args = [
      '-y',
      '-i', inputPath,
      '-c', 'copy',
      '-movflags', '+faststart',
      outputPath,
    ];
  } else {
    log('info', 'Transcoding to H.264/AAC', { jobId: job.jobId, width, height });
    
    const scaleFilter = height > CONFIG.VIDEO_OUTPUT_MAX_HEIGHT
      ? `scale=-2:${CONFIG.VIDEO_OUTPUT_MAX_HEIGHT}`
      : 'scale=trunc(iw/2)*2:trunc(ih/2)*2';
    
    args = [
      '-y',
      '-threads', String(CONFIG.FFMPEG_THREADS),
      '-i', inputPath,
      '-vf', `${scaleFilter},fps=${CONFIG.VIDEO_OUTPUT_FPS}`,
      '-c:v', 'libx264',
      '-preset', CONFIG.FFMPEG_PRESET,
      '-crf', String(CONFIG.FFMPEG_CRF),
      '-maxrate', CONFIG.FFMPEG_MAXRATE,
      '-bufsize', CONFIG.FFMPEG_BUFSIZE,
      '-pix_fmt', 'yuv420p',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-ac', '2',
      '-movflags', '+faststart',
      outputPath,
    ];
  }
  
  const result = await ffmpeg(args);
  const stats = await fs.stat(outputPath);
  
  log('info', 'Video conversion complete', { 
    jobId: job.jobId, 
    duration: result.duration,
    outputSize: stats.size 
  });
  
  return {
    success: true,
    size: stats.size,
    mime: 'video/mp4',
    ext: '.mp4',
    meta: {
      width: canRemux ? width : Math.min(width, Math.round(CONFIG.VIDEO_OUTPUT_MAX_HEIGHT * (width / height))),
      height: Math.min(height, CONFIG.VIDEO_OUTPUT_MAX_HEIGHT),
      duration,
      fps: CONFIG.VIDEO_OUTPUT_FPS,
    },
  };
}

// Update lead attachment in database
async function updateLeadAttachment(job, result, isFailed = false) {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: job.leadId },
      select: { attachments: true }
    });
    
    if (!lead || !lead.attachments) {
      log('warn', 'Lead not found or no attachments', { leadId: job.leadId });
      return;
    }
    
    const attachments = Array.isArray(lead.attachments) ? lead.attachments : [];
    const attachmentIndex = attachments.findIndex(att => att.id === job.attachmentId);
    
    if (attachmentIndex === -1) {
      log('warn', 'Attachment not found in lead', { leadId: job.leadId, attachmentId: job.attachmentId });
      return;
    }
    
    // Update attachment
    const updatedAttachment = {
      ...attachments[attachmentIndex],
      status: isFailed ? 'failed' : 'ready',
      type: isFailed ? attachments[attachmentIndex].type : result.mime,
      size: isFailed ? attachments[attachmentIndex].size : result.size,
      meta: isFailed ? undefined : result.meta,
      error: isFailed ? (result.error || 'Conversion failed') : undefined,
      processedAt: new Date().toISOString(),
    };
    
    attachments[attachmentIndex] = updatedAttachment;
    
    await prisma.lead.update({
      where: { id: job.leadId },
      data: { attachments: attachments }
    });
    
    log('info', 'Updated lead attachment in database', { 
      leadId: job.leadId, 
      attachmentId: job.attachmentId,
      status: updatedAttachment.status 
    });
  } catch (dbError) {
    log('error', 'Failed to update lead attachment', { 
      leadId: job.leadId, 
      attachmentId: job.attachmentId,
      error: dbError.message 
    });
  }
}

// Process a single job
async function processJob(jobPath) {
  const jobFile = jobPath.split('/').pop();
  const processingPath = join(QUEUE_DIRS.processing, jobFile);
  
  try {
    // Atomic claim: move to processing
    await fs.rename(jobPath, processingPath);
    
    const job = JSON.parse(await fs.readFile(processingPath, 'utf-8'));
    
    log('info', 'Processing job', { jobId: job.jobId, kind: job.kind });
    
    // Ensure output directory exists
    await fs.mkdir(dirname(job.outputPath), { recursive: true });
    
    // Convert based on kind
    let result;
    if (job.kind === 'image') {
      result = await convertImage(job);
    } else if (job.kind === 'video') {
      result = await convertVideo(job);
    } else {
      throw new Error(`Unknown kind: ${job.kind}`);
    }
    
    // Update job with result
    job.result = result;
    job.completedAt = new Date().toISOString();
    job.status = 'completed';
    
    // Update database
    await updateLeadAttachment(job, result, false);
    
    // Move to done
    await fs.writeFile(join(QUEUE_DIRS.done, jobFile), JSON.stringify(job, null, 2));
    await fs.unlink(processingPath);
    
    // Clean up temp file
    try {
      await fs.unlink(job.inputPath);
      log('info', 'Cleaned up temp file', { inputPath: job.inputPath });
    } catch (e) {
      log('warn', 'Failed to cleanup temp file', { inputPath: job.inputPath, error: e.message });
    }
    
    log('info', 'Job completed', { jobId: job.jobId, status: 'completed' });
    return { success: true, job };
    
  } catch (error) {
    log('error', 'Job failed', { jobId: jobFile, error: error.message });
    
    try {
      const job = JSON.parse(await fs.readFile(processingPath, 'utf-8'));
      job.error = error.message;
      job.failedAt = new Date().toISOString();
      job.attempt = (job.attempt || 0) + 1;
      
      // Update database with failure
      await updateLeadAttachment(job, { error: error.message }, true);
      
      if (job.attempt >= CONFIG.MAX_RETRIES) {
        job.status = 'failed';
        await fs.writeFile(join(QUEUE_DIRS.failed, jobFile), JSON.stringify(job, null, 2));
        await fs.unlink(processingPath);
        
        // Cleanup temp
        try {
          await fs.unlink(job.inputPath);
        } catch {}
      } else {
        // Retry: move back to pending
        job.status = 'pending';
        await fs.writeFile(join(QUEUE_DIRS.pending, jobFile), JSON.stringify(job, null, 2));
        await fs.unlink(processingPath);
      }
    } catch (e) {
      log('error', 'Failed to handle job error', { error: e.message });
    }
    
    return { success: false, error: error.message };
  }
}

// Scan for pending jobs
async function scanJobs() {
  try {
    const files = await fs.readdir(QUEUE_DIRS.pending);
    const jobFiles = files.filter(f => f.endsWith('.json'));
    
    if (jobFiles.length === 0) {
      return [];
    }
    
    // Sort by creation time (oldest first)
    const jobsWithStats = await Promise.all(
      jobFiles.map(async (f) => {
        const stat = await fs.stat(join(QUEUE_DIRS.pending, f));
        return { file: f, mtime: stat.mtime };
      })
    );
    
    jobsWithStats.sort((a, b) => a.mtime - b.mtime);
    return jobsWithStats.map(j => join(QUEUE_DIRS.pending, j.file));
  } catch (e) {
    log('error', 'Failed to scan jobs', { error: e.message });
    return [];
  }
}

// Main worker loop
async function main() {
  log('info', 'Media Worker starting', { config: { ...CONFIG, DATABASE_URL: undefined } });
  
  // Ensure directories
  await ensureDirectories();
  
  log('info', 'Worker ready');
  
  while (true) {
    try {
      const jobs = await scanJobs();
      
      if (jobs.length === 0) {
        await new Promise(resolve => setTimeout(resolve, CONFIG.LOOP_INTERVAL_MS));
        continue;
      }
      
      log('info', `Found ${jobs.length} pending job(s)`);
      
      // Process one job at a time
      for (const jobPath of jobs) {
        await processJob(jobPath);
      }
      
    } catch (error) {
      log('error', 'Worker loop error', { error: error.message });
      await new Promise(resolve => setTimeout(resolve, CONFIG.LOOP_INTERVAL_MS));
    }
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  log('info', 'SIGTERM received, shutting down');
  process.exit(0);
});

process.on('SIGINT', () => {
  log('info', 'SIGINT received, shutting down');
  process.exit(0);
});

// Start worker
main().catch(error => {
  log('error', 'Worker failed to start', { error: error.message });
  process.exit(1);
});
