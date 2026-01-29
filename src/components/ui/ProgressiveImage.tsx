"use client";

import { useState } from "react";

interface ProgressiveImageProps {
  src: string;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
  decoding?: "sync" | "async" | "auto";
  priority?: boolean;
}

function getWebPPath(src: string): string {
  if (src.includes('/Imgs_WEBP/')) return src;
  if (src.includes('.webp')) return src;
  return src.replace(/imgs\/(.+)\.(png|jpg|jpeg)/i, "imgs/Imgs_WEBP/$1.webp");
}

function getAVIFPath(src: string): string {
  if (src.includes('.webp')) {
    return src.replace(/imgs\/(.+)\.webp/i, "imgs/Imgs_AVIF/$1.avif");
  }
  return src.replace(/imgs\/(.+)\.(png|jpg|jpeg)/i, "imgs/Imgs_AVIF/$1.avif");
}

export default function ProgressiveImage({
  src,
  alt,
  className = "",
  loading = "lazy",
  decoding = "async",
  priority = false,
}: ProgressiveImageProps) {
  const [imageError, setImageError] = useState(false);

  if (imageError) {
    return null;
  }

  const avifPath = getAVIFPath(src);
  const webpPath = getWebPPath(src);

  return (
    <picture>
      <source srcSet={avifPath} type="image/avif" />
      <img
        src={webpPath}
        alt={alt}
        className={className}
        loading={priority ? "eager" : loading}
        decoding={decoding}
        onError={() => setImageError(true)}
      />
    </picture>
  );
}
