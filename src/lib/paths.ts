// Centralized path configuration for SocialBluePro
// Automatically detects production vs development environment
// Production: Linux VPS with /opt/socialbluepro
// Development: Windows/Mac - uses project-relative paths

import { existsSync } from 'fs';
import { resolve } from 'path';

// Detect production environment by checking if /opt/socialbluepro exists
const isProduction = (() => {
  try {
    return existsSync('/opt/socialbluepro');
  } catch {
    return false;
  }
})();

// Environment-specific paths
export const PATHS = isProduction
  ? {
      // Production - Linux VPS with absolute paths
      UPLOAD_DIR: '/opt/socialbluepro/public/uploads',
      UPLOAD_TMP_DIR: '/opt/socialbluepro/var/uploads-tmp',
      MEDIA_QUEUE_DIR: '/opt/socialbluepro/var/media-queue',
      isProduction: true,
    }
  : {
      // Development - project-relative paths
      UPLOAD_DIR: resolve(process.cwd(), 'public/uploads'),
      UPLOAD_TMP_DIR: resolve(process.cwd(), 'tmp/uploads'),
      MEDIA_QUEUE_DIR: resolve(process.cwd(), 'tmp/queue'),
      isProduction: false,
    };

// Log environment detection on startup
console.log(`[PATHS] Environment: ${isProduction ? 'production' : 'development'}`);
console.log(`[PATHS] UPLOAD_DIR: ${PATHS.UPLOAD_DIR}`);
console.log(`[PATHS] UPLOAD_TMP_DIR: ${PATHS.UPLOAD_TMP_DIR}`);
console.log(`[PATHS] MEDIA_QUEUE_DIR: ${PATHS.MEDIA_QUEUE_DIR}`);

// For backwards compatibility with existing code that uses env vars
// These should NOT be used directly - always import from this file
export const UPLOAD_DIR = PATHS.UPLOAD_DIR;
export const UPLOAD_TMP_DIR = PATHS.UPLOAD_TMP_DIR;
export const MEDIA_QUEUE_DIR = PATHS.MEDIA_QUEUE_DIR;
