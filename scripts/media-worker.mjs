// Media Processing Worker for SocialBluePro
// Handles conversion of HEIC/HEIF images to JPEG and MOV to MP4
// Runs as separate process

import { spawn } from 'child_process';
import { promises as fs, existsSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('[ERROR] DATABASE_URL environment variable is required');
  process.exit(1);
}

const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Detect production environment
const isProduction = existsSync('/opt/socialbluepro');
const baseDir = isProduction ? '/opt/socialbluepro' : resolve(__dirname, '..');

console.log(`[CONFIG] Environment: ${isProduction ? 'production' : 'development'}`);
console.log(`[CONFIG] Base directory: ${baseDir}`);

const CONFIG = {
  UPLOAD_TMP_DIR: resolve(process.env.UPLOAD_TMP_DIR || join(baseDir, isProduction ? 'var/uploads-tmp' : 'tmp/uploads')),
  MEDIA_QUEUE_DIR: resolve(process.env.MEDIA_QUEUE_DIR || join(baseDir, isProduction ? 'var/media-queue' : 'tmp/queue')),
  UPLOAD_DIR: resolve(process.env.UPLOAD_DIR || join(baseDir, 'public/uploads')),
  MAX_VIDEO_DURATION_SECONDS: parseInt(process.env.MAX_VIDEO_DURATION_SECONDS || '360', 10),
  VIDEO_OUTPUT_MAX_HEIGHT: parseInt(process.env.VIDEO_OUTPUT_MAX_HEIGHT || '720', 10),
  VIDEO_OUTPUT_FPS: parseInt(process.env.VIDEO_OUTPUT_FPS || '30', 10),
  VIDEO_MAXRATE: process.env.VIDEO_MAXRATE || '3.5M',
  VIDEO_BUFSIZE: process.env.VIDEO_BUFSIZE || '7M',
  VIDEO_CRF: parseInt(process.env.VIDEO_CRF || '23', 10),
  JOB_TIMEOUT_MS: parseInt(process.env.JOB_TIMEOUT_MS || '1200000', 10),
  MAX_RETRIES: parseInt(process.env.MAX_RETRIES || '1', 10),
  LOOP_INTERVAL_MS: parseInt(process.env.LOOP_INTERVAL_MS || '1000', 10),
};

const QUEUE_DIRS = {
  pending: join(CONFIG.MEDIA_QUEUE_DIR, 'pending'),
  processing: join(CONFIG.MEDIA_QUEUE_DIR, 'processing'),
  done: join(CONFIG.MEDIA_QUEUE_DIR, 'done'),
  failed: join(CONFIG.MEDIA_QUEUE_DIR, 'failed'),
};

function log(level, message, meta = {}) {
  const timestamp = new Date().toISOString();
  const metaStr = Object.keys(meta).length ? ' ' + JSON.stringify(meta) : '';
  console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`);
}

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

async function ffprobe(inputPath) {
  return new Promise((resolve, reject) => {
    const args = [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-show_entries', 'stream=codec_name,width,height,r_frame_rate,codec_type',
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
      try { proc.kill('SIGTERM'); } catch {}
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
      try { proc.kill('SIGTERM'); } catch {}
    };
    
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

async function convertImage(job) {
  const { inputPath, outputPath, originalName } = job;
  
  log('info', 'Converting HEIC/HEIF to JPEG', { jobId: job.jobId, originalName });
  
  try {
    await heifConvert(inputPath, outputPath);
    
    // Verificar se arquivo foi criado
    let stats;
    try {
      stats = await fs.stat(outputPath);
      log('info', 'Image file created successfully', { 
        jobId: job.jobId, 
        outputPath: outputPath,
        outputSize: stats.size 
      });
    } catch (statError) {
      log('error', 'Image file not found after conversion', { 
        jobId: job.jobId, 
        outputPath: outputPath,
        error: statError.message
      });
      throw new Error(`Output file not found: ${outputPath}`);
    }
    
    return {
      success: true,
      size: stats.size,
      mime: 'image/jpeg',
      ext: '.jpg',
    };
  } catch (heifError) {
    log('warn', 'heif-convert failed, trying ffmpeg fallback', { jobId: job.jobId, error: heifError.message });
    
    const args = [
      '-y',
      '-i', inputPath,
      '-frames:v', '1',
      '-q:v', '2',
      outputPath,
    ];
    
    await ffmpeg(args);
    
    // Verificar se arquivo foi criado
    let stats;
    try {
      stats = await fs.stat(outputPath);
      log('info', 'Image file created with ffmpeg fallback', { 
        jobId: job.jobId, 
        outputPath: outputPath,
        outputSize: stats.size 
      });
    } catch (statError) {
      log('error', 'Image file not found after ffmpeg fallback', { 
        jobId: job.jobId, 
        outputPath: outputPath,
        error: statError.message
      });
      throw new Error(`Output file not found: ${outputPath}`);
    }
    
    return {
      success: true,
      size: stats.size,
      mime: 'image/jpeg',
      ext: '.jpg',
    };
  }
}

async function convertVideo(job) {
  const { inputPath, outputPath } = job;
  
  log('info', 'Analyzing video', { jobId: job.jobId, input: inputPath });
  
  const probeData = await ffprobe(inputPath);
  const duration = parseFloat(probeData.format?.duration || '0');
  
  if (duration > CONFIG.MAX_VIDEO_DURATION_SECONDS) {
    throw new Error(`Video too long: ${duration}s > ${CONFIG.MAX_VIDEO_DURATION_SECONDS}s limit`);
  }
  
  const videoStream = probeData.streams?.find(s => s.codec_type === 'video');
  const audioStream = probeData.streams?.find(s => s.codec_type === 'audio');
  
  if (!videoStream) {
    throw new Error('No video stream found');
  }
  
  const width = videoStream.width || 1920;
  const height = videoStream.height || 1080;
  const isH264 = videoStream.codec_name === 'h264';
  const isH265 = videoStream.codec_name === 'hevc' || videoStream.codec_name === 'h265';
  const isAac = !audioStream || audioStream.codec_name === 'aac';
  const is720OrLess = height <= CONFIG.VIDEO_OUTPUT_MAX_HEIGHT;
  
  let args;
  
  if (isH264 && isAac && is720OrLess) {
    log('info', 'Fast remux (H.264+AAC, no re-encode)', { jobId: job.jobId });
    args = [
      '-y',
      '-i', inputPath,
      '-c', 'copy',
      '-movflags', '+faststart',
      outputPath,
    ];
  } else {
    log('info', 'Transcoding to H.264/AAC 720p', { jobId: job.jobId, codec: videoStream.codec_name, width, height });
    
    const scaleFilter = height > CONFIG.VIDEO_OUTPUT_MAX_HEIGHT
      ? `scale=-2:${CONFIG.VIDEO_OUTPUT_MAX_HEIGHT}`
      : 'scale=trunc(iw/2)*2:trunc(ih/2)*2';
    
    args = [
      '-y',
      '-i', inputPath,
      '-vf', `${scaleFilter},fps=${CONFIG.VIDEO_OUTPUT_FPS}`,
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-crf', String(CONFIG.VIDEO_CRF),
      '-maxrate', CONFIG.VIDEO_MAXRATE,
      '-bufsize', CONFIG.VIDEO_BUFSIZE,
      '-pix_fmt', 'yuv420p',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-ac', '2',
      '-movflags', '+faststart',
      outputPath,
    ];
  }
  
  const result = await ffmpeg(args);
  
  // Verificar se arquivo foi criado
  let stats;
  try {
    stats = await fs.stat(outputPath);
    log('info', 'Video file created successfully', { 
      jobId: job.jobId, 
      outputPath: outputPath,
      outputSize: stats.size,
      duration: result.duration
    });
  } catch (statError) {
    log('error', 'Video file not found after conversion', { 
      jobId: job.jobId, 
      outputPath: outputPath,
      error: statError.message
    });
    throw new Error(`Output file not found: ${outputPath}`);
  }
  
  return {
    success: true,
    size: stats.size,
    mime: 'video/mp4',
    ext: '.mp4',
    meta: {
      width: isH264 && is720OrLess ? width : Math.min(width, Math.round(CONFIG.VIDEO_OUTPUT_MAX_HEIGHT * (width / height))),
      height: Math.min(height, CONFIG.VIDEO_OUTPUT_MAX_HEIGHT),
      duration,
    },
  };
}

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
    
    const existingAtt = attachments[attachmentIndex];
    const originalName = existingAtt.original?.name || existingAtt.name || job.originalName;
    
    let finalName = originalName;
    if (!isFailed && result) {
      if (job.kind === 'video') {
        finalName = originalName.replace(/\.(mov|mp4|avi|mkv|webm)$/i, '.mp4');
      } else if (job.kind === 'image') {
        finalName = originalName.replace(/\.(heic|heif|png|gif|bmp|webp)$/i, '.jpg');
      }
    }
    
    const outputFileName = job.outputPath.split('/').pop();
    const absoluteOutputPath = job.outputPath;
    
    // Verificar se arquivo existe antes de atualizar banco
    let fileExists = false;
    try {
      await fs.stat(absoluteOutputPath);
      fileExists = true;
      log('info', 'File verified before DB update', { 
        jobId: job.jobId,
        absoluteOutputPath: absoluteOutputPath
      });
    } catch (e) {
      log('error', 'File not found before DB update', { 
        jobId: job.jobId,
        absoluteOutputPath: absoluteOutputPath,
        error: e.message
      });
    }
    
    const updatedAttachment = {
      ...existingAtt,
      name: finalName,
      status: isFailed ? 'failed' : (fileExists ? 'ready' : 'failed'),
      type: isFailed ? existingAtt.type : result.mime,
      size: isFailed ? existingAtt.size : result.size,
      kind: job.kind,
      meta: isFailed ? undefined : result.meta,
      error: isFailed ? (result.error || 'Conversion failed') : (fileExists ? undefined : 'File not found after conversion'),
      path: absoluteOutputPath,
      url: `/api/uploads/leads/${job.leadId}/${outputFileName}`,
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
      status: updatedAttachment.status,
      finalName: finalName,
      fileExists: fileExists
    });
  } catch (dbError) {
    log('error', 'Failed to update lead attachment', { 
      leadId: job.leadId, 
      attachmentId: job.attachmentId,
      error: dbError.message 
    });
  }
}

async function processJob(jobPath) {
  const jobFile = jobPath.split('/').pop();
  const processingPath = join(QUEUE_DIRS.processing, jobFile);
  
  try {
    await fs.rename(jobPath, processingPath);
    
    const job = JSON.parse(await fs.readFile(processingPath, 'utf-8'));
    
    log('info', 'Processing job', { 
      jobId: job.jobId, 
      kind: job.kind, 
      originalName: job.originalName,
      inputPath: job.inputPath,
      outputPath: job.outputPath 
    });
    
    const outputFileName = job.outputPath.split('/').pop();
    
    log('info', 'Using original output path', { 
      jobId: job.jobId,
      outputFileName: outputFileName,
      outputPath: job.outputPath,
      configUploadDir: CONFIG.UPLOAD_DIR
    });
    
    await fs.mkdir(dirname(job.outputPath), { recursive: true });
    
    let result;
    if (job.kind === 'image') {
      result = await convertImage(job);
    } else if (job.kind === 'video') {
      result = await convertVideo(job);
    } else {
      throw new Error(`Unknown kind: ${job.kind}`);
    }
    
    job.result = result;
    job.completedAt = new Date().toISOString();
    job.status = 'completed';
    
    await updateLeadAttachment(job, result, false);
    
    await fs.writeFile(join(QUEUE_DIRS.done, jobFile), JSON.stringify(job, null, 2));
    await fs.unlink(processingPath);
    
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
      
      await updateLeadAttachment(job, { error: error.message }, true);
      
      if (job.attempt >= CONFIG.MAX_RETRIES) {
        job.status = 'failed';
        await fs.writeFile(join(QUEUE_DIRS.failed, jobFile), JSON.stringify(job, null, 2));
        await fs.unlink(processingPath);
        
        try { await fs.unlink(job.inputPath); } catch {}
      } else {
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

async function scanJobs() {
  try {
    const files = await fs.readdir(QUEUE_DIRS.pending);
    const jobFiles = files.filter(f => f.endsWith('.json'));
    
    if (jobFiles.length === 0) {
      return [];
    }
    
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

async function main() {
  log('info', 'Media Worker starting', { config: { ...CONFIG, DATABASE_URL: undefined } });
  
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
      
      for (const jobPath of jobs) {
        await processJob(jobPath);
      }
      
    } catch (error) {
      log('error', 'Worker loop error', { error: error.message });
      await new Promise(resolve => setTimeout(resolve, CONFIG.LOOP_INTERVAL_MS));
    }
  }
}

process.on('SIGTERM', async () => {
  log('info', 'SIGTERM received, shutting down');
  await prisma.$disconnect().catch(() => {});
  await pool.end().catch(() => {});
  process.exit(0);
});

process.on('SIGINT', async () => {
  log('info', 'SIGINT received, shutting down');
  await prisma.$disconnect().catch(() => {});
  await pool.end().catch(() => {});
  process.exit(0);
});

main().catch(error => {
  log('error', 'Worker failed to start', { error: error.message });
  process.exit(1);
});
