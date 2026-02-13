"use client";

import { ChevronRight, Shield, Star } from "lucide-react";
import { IMAGES } from "@/lib/constants";
import Image from "next/image";
import DesktopImage from "@/components/ui/DesktopImage";

interface HeroProps {
  onGetQuote: () => void;
}

export default function Hero({ onGetQuote }: HeroProps) {
  return (
     <section id="home" className="relative min-h-[100dvh] flex items-center pt-24 pb-0 overflow-hidden bg-slate-900">
      {/* Precision Landscaping Background */}
      <div className="absolute inset-0 z-0">
          <Image
            src={IMAGES.hero}
            alt="Landscaping background"
            fill
            priority
            fetchPriority="high"
            decoding="async"
                          quality={35}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover opacity-40 md:opacity-50"
             loading="eager"
             placeholder="blur"
             blurDataURL="data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A="

           />
       <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/80 to-slate-900/20" />
       <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/50 to-slate-900" />
     </div>

      <div className="container mx-auto px-4 md:px-8 w-full max-w-7xl relative z-10 w-full">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          
           <div
             className="text-center lg:text-left pt-8 lg:pt-0 animate-fade-in-up"
          >
            <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 text-accent px-3 py-1.5 rounded-full text-[9px] md:text-[10px] font-black tracking-widest mb-6 uppercase">
              <Star size={12} fill="currentColor" />
              <span>Denver&apos;S Best Landscaping</span>
            </div>
            
             <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.1] tracking-tighter mb-4 md:mb-6 uppercase">
               Expert <br />
               <span className="text-accent italic">Landscaping.</span>
             </h1>
            
             <p className="text-sm md:text-base lg:text-lg text-slate-300 mb-6 md:mb-8 max-w-lg mx-auto lg:mx-0 leading-relaxed font-medium">
               Elite exterior transformations for Denver estates. We specialize in precision execution and premium materials for high-impact results.
             </p>

             <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                 <button 
                   onClick={onGetQuote}
                   className="w-full sm:w-auto bg-accent text-white px-8 py-3.5 rounded-xl font-black uppercase tracking-widest text-[10px] md:text-xs hover:bg-green-600 transition-all shadow-xl shadow-accent/30 flex items-center justify-center gap-3 group active:scale-95"
                   aria-label="Get free landscaping estimate"
                 >
                 Get Free Estimate
                 <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

             <div className="mt-8 md:mt-12 flex items-center justify-center lg:justify-start gap-6 md:gap-8 text-slate-400">
               <div className="flex items-center gap-2">
                 <Shield size={16} className="text-accent" />
                 <span className="text-[10px] uppercase tracking-widest font-bold">Insured</span>
               </div>
               <div className="w-px h-4 bg-white/10" />
               <div className="flex items-center gap-2">
                 <Star size={16} className="text-accent" />
                 <span className="text-[10px] uppercase tracking-widest font-bold">5-Star Rated</span>
               </div>
              </div>
           </div>

           <DesktopImage />

        </div>
      </div>
    </section>
  );
}