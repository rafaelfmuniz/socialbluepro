"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Star } from "lucide-react";
import { IMAGES } from "@/lib/constants";

export default function DesktopImage() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    
    checkDesktop();
    
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const handleChange = (e: MediaQueryListEvent) => {
      setIsDesktop(e.matches);
    };
    
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  if (!isDesktop) {
    return null;
  }

  return (
    <div className="relative animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
      <div className="relative z-10 bg-slate-800/50 backdrop-blur-sm p-4 rounded-3xl border border-white/10 transform rotate-2 hover:rotate-0 transition-transform duration-500">
        <Image
          src={IMAGES.custom}
          alt="Luxury Landscaping Project"
          width={600}
          height={450}
          className="rounded-2xl shadow-2xl w-full aspect-[4/3] object-cover"
          priority={false}
          loading="lazy"
          fetchPriority="low"
          decoding="async"
          quality={50}
          sizes="(max-width: 768px) 100vw, 600px"
          placeholder="blur"
          blurDataURL="data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A="
        />
        <div className="absolute -bottom-6 -right-6 bg-white p-4 rounded-2xl shadow-xl max-w-[200px]">
          <div className="flex gap-1 text-accent mb-2">
            {[...Array(5)].map((_, i) => <Star key={i} size={12} fill="currentColor" />)}
          </div>
          <p className="text-slate-900 font-bold text-xs italic leading-tight">
            &quot;Transformed our backyard into a masterpiece.&quot;
          </p>
        </div>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute -top-10 -right-10 w-64 h-64 bg-accent/20 blur-[100px] rounded-full z-0" />
      <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-blue-500/20 blur-[100px] rounded-full z-0" />
    </div>
  );
}