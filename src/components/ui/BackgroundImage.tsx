"use client";

interface BackgroundImageProps {
  src: string;
  className?: string;
  children?: React.ReactNode;
  ariaLabel?: string;
}

function getWebPPath(src: string): string {
  return src.replace(/imgs\/(.+)\.(png|jpg|jpeg|webp)/i, "imgs/Imgs_WEBP/$1.webp");
}

function getAVIFPath(src: string): string {
  return src.replace(/imgs\/(.+)\.(png|jpg|jpeg|webp)/i, "imgs/Imgs_AVIF/$1.avif");
}

export default function BackgroundImage({
  src,
  className = "",
  children,
  ariaLabel,
}: BackgroundImageProps) {
  const avifPath = getAVIFPath(src);
  const webpPath = getWebPPath(src);

  return (
    <div className={className}>
      <picture className="absolute inset-0 w-full h-full">
        <source srcSet={avifPath} type="image/avif" />
        <img
          src={webpPath}
          alt=""
          className="w-full h-full object-cover"
        />
      </picture>
      {children}
    </div>
  );
}
