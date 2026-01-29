"use client";

import { MapPin, CheckCircle2, ChevronRight } from "lucide-react";

import { IMAGES } from "@/lib/constants";

interface ServiceAreaProps {
  onGetQuote?: () => void;
}

const cities = [
  "Denver", "Aurora", "Lakewood", "Littleton", "Highlands Ranch", 
  "Centennial", "Parker", "Castle Rock", "Boulder", "Fort Collins",
  "Longmont", "Broomfield", "Arvada", "Golden", "Brighton", 
  "Thornton", "Northglenn"
];

export default function ServiceArea({ onGetQuote }: ServiceAreaProps) {
  const scrollToQuote = () => {
    if (onGetQuote) {
      onGetQuote();
      return;
    }
    if (typeof document !== 'undefined' && typeof window !== 'undefined') {
      const el = document.getElementById('quote');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      else window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

   return (
    <section id="service-area" className="py-16 md:py-24 bg-white overflow-hidden">
      <div className="container mx-auto px-4 md:px-8 w-full max-w-7xl">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          
          {/* Map Representation - Now Denver Focused */}
          <div className="flex-1 w-full max-w-lg relative order-2 lg:order-1">
            <div className="absolute -inset-6 bg-accent/5 blur-[80px] rounded-full animate-pulse" />
             <div className="relative bg-slate-100 border border-slate-200 rounded-3xl p-6 md:p-8 aspect-square flex items-center justify-center shadow-xl overflow-hidden">
               {/* Using a static Denver Map silhouette or high-end illustration style */}
                <div 
                  className="absolute inset-0 bg-cover opacity-20 grayscale hover:grayscale-0 transition-all duration-700" 
                  style={{ backgroundImage: `url(${IMAGES.map})` }}
                  role="img"
                  aria-label="Denver service area map"
                />
              <div className="relative text-center z-10">
                <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-accent/20 rounded-full mb-6 border-2 border-accent shadow-xl">
                  <MapPin className="text-accent" size={32} />
                </div>
                <h3 className="text-2xl md:text-3xl font-black text-slate-900 mb-2 uppercase tracking-tighter leading-none">Denver <br/> Coverage</h3>
                <p className="text-slate-500 font-bold max-w-[200px] mx-auto italic text-xs leading-relaxed">
                  Dedicated service across the entire Denver Metropolitan area.
                </p>
              </div>
              
              {/* Decorative Pulsing Rings */}
              <div className="absolute w-full h-full border-2 border-accent/20 rounded-full animate-ping opacity-10" />
            </div>
          </div>

          {/* List of Cities */}
          <div className="flex-1 space-y-8 order-1 lg:order-2 w-full">
             <div className="text-center lg:text-left">
               <span className="text-accent font-black tracking-[0.3em] uppercase text-[10px] mb-3 block">Service Area</span>
               <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tighter leading-none">
                 Serving the <br />
                 <span className="text-accent italic">Denver Metro.</span>
               </h2>
             </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
              {cities.map(city => (
                <div key={city} className="flex items-center gap-2 group">
                  <CheckCircle2 className="text-accent shrink-0 group-hover:scale-110 transition-transform" size={14} />
                  <span className="text-slate-700 font-bold text-[10px] md:text-xs uppercase tracking-widest group-hover:text-slate-900 transition-colors">{city}</span>
                </div>
              ))}
            </div>
            
            <div className="p-6 md:p-8 bg-slate-50 rounded-2xl border border-slate-100 border-dashed text-center lg:text-left shadow-sm">
              <p className="text-slate-500 font-medium mb-6 text-sm leading-relaxed italic">
                From Fort Collins to Castle Rock, we specialize in high-ticket outdoor transformations.
              </p>
              <button 
                onClick={scrollToQuote}
                className="bg-slate-900 text-white px-8 py-4 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] md:text-xs flex items-center justify-center lg:justify-start gap-3 hover:bg-slate-800 transition-all mx-auto lg:mx-0 shadow-lg group active:scale-95 w-full sm:w-auto"
              >
                Check Availability <ChevronRight className="group-hover:translate-x-1 transition-transform text-accent" size={16} />
              </button>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
