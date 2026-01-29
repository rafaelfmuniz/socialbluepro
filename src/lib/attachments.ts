// Helper utilities for normalizing and proxying lead attachment URLs.
const LOCAL_DEV_HOSTNAME = "kong:8000";
const LOCAL_DEV_REPLACEMENT = "localhost:54321";
const STATIC_UPLOAD_PREFIX = "uploads/";
const API_ATTACHMENT_PREFIX = "/api/uploads/";

const getBrowserOrigin = () => (typeof window !== "undefined" ? window.location.origin : "");
const ensureLeadingSlash = (value: string) => (value.startsWith("/") ? value : `/${value}`);

export function resolveAttachmentUrl(rawUrl: string) {
  if (!rawUrl) return "";

  if (rawUrl.includes(LOCAL_DEV_HOSTNAME)) {
    return rawUrl.replace(LOCAL_DEV_HOSTNAME, LOCAL_DEV_REPLACEMENT);
  }

  if (/^https?:\/\//i.test(rawUrl)) {
    return rawUrl;
  }

  // If URL already starts with /api/uploads/, return as is
  if (rawUrl.startsWith(API_ATTACHMENT_PREFIX)) {
    const origin = getBrowserOrigin();
    const normalized = ensureLeadingSlash(rawUrl);
    return origin ? `${origin}${normalized}` : normalized;
  }

  // If URL starts with /uploads/, convert to /api/uploads/
  const withoutLeadingSlash = rawUrl.replace(/^\/+/, "");
  if (withoutLeadingSlash.toLowerCase().startsWith(STATIC_UPLOAD_PREFIX)) {
    const pathAfterUploads = withoutLeadingSlash.replace(new RegExp(`^${STATIC_UPLOAD_PREFIX}`, "i"), "");
    const apiPath = ensureLeadingSlash(`${API_ATTACHMENT_PREFIX}${pathAfterUploads}`);
    const origin = getBrowserOrigin();
    return origin ? `${origin}${apiPath}` : apiPath;
  }

  return rawUrl;
}
