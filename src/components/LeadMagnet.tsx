"use client";

import { motion } from "framer-motion";
import { Download, FileText, Star } from "lucide-react";

interface LeadMagnetProps {
  onGetQuote: () => void;
}

export default function LeadMagnet({ onGetQuote }: LeadMagnetProps) {
  const currentYear = new Date().getFullYear();

  return (
    <section className="py-16 md:py-24 bg-white relative overflow-hidden" id="guide">
      <div className="container mx-auto px-4 md:px-8">
        <div className="bg-slate-900 p-8 md:p-12 lg:p-16 relative rounded-3xl shadow-2xl overflow-hidden">
           {/* High-end landscape drawing overlay */}
           <div className="absolute inset-0 opacity-10 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 mix-blend-overlay" />
          
          <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            <div className="flex-1 text-white text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-3 text-accent mb-6">
                <span className="h-px w-8 bg-accent hidden lg:block" />
                <span className="text-[9px] uppercase tracking-[0.4em] font-black">Digital Resource</span>
              </div>
              
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-6 leading-none tracking-tighter">
                Ready for <br />
                <span className="text-accent italic">the shift?</span>
              </h2>
              
               <p className="text-sm md:text-base text-slate-400 mb-8 max-w-lg mx-auto lg:mx-0 font-medium leading-relaxed italic">
                 Download our definitive {currentYear} Denver Landscape Prospectus. A curated guide for architectural exteriors.
               </p>
              
              <button
                onClick={onGetQuote}
                className="bg-accent text-white px-8 py-4 rounded-xl font-black flex items-center justify-center gap-3 hover:bg-green-600 transition-all text-[10px] md:text-xs uppercase tracking-[0.2em] shadow-xl active:scale-95 w-full sm:w-auto mx-auto lg:mx-0"
              >
                Get Guide & Quote <Download size={16} />
              </button>
            </div>
            
            {/* Minimalist Guide Cover */}
            <motion.div
              initial={{ rotate: 0, y: 30, opacity: 0 }}
              whileInView={{ rotate: 6, y: 0, opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="hidden md:block w-[240px] md:w-[280px] aspect-[1/1.4] bg-white shadow-2xl p-6 md:p-8 relative rounded-lg border border-slate-100 transform hover:rotate-0 transition-transform duration-500"
            >
              <div className="flex flex-col h-full border border-slate-200 p-4 relative z-10">
                <div className="flex justify-between items-start mb-8">
                   <FileText className="text-slate-900 w-8 h-8" />
                   <Star className="text-accent" fill="currentColor" size={16} />
                </div>
                 <p className="text-[8px] uppercase tracking-[0.5em] font-black text-slate-400 mb-4 leading-relaxed">
                    DENVER <br /> EXTERIORS <br /> VOL. III
                 </p>
                 <div className="mt-auto pt-4 border-t border-slate-100">
                    <p className="text-4xl font-serif italic text-slate-900 leading-none">{currentYear}</p>
                 </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
