"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Star, Quote, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";

const testimonials = [
   {
     name: "Sarah Mitchell",
     role: "Denver Resident",
     content: "The sod installation was flawless. They transformed my patchy backyard into a lush green oasis in just two days. The team was professional, clean, and the work quality exceeded my expectations. Highly recommend SocialBluePro for any landscaping project!",
     stars: 5
   },
   {
     name: "Linda Rodriguez",
     role: "Property Manager",
     content: "We've used SocialBluePro for snow removal for three seasons now. They are always on site before our staff arrives. Their reliability and attention to detail have made our winter operations stress-free. Excellent service every time.",
     stars: 5
   },
   {
     name: "James Anderson",
     role: "Highlands Ranch Owner",
     content: "Expert hardscaping! Our new stone patio and retaining wall look amazing. The quality of the masonry work is outstanding. SocialBluePro brought our vision to life and the craftsmanship is top-notch. Could not be happier with the results.",
     stars: 5
   },
   {
     name: "Maria Garcia",
     role: "Aurora Resident",
     content: "After getting multiple quotes, SocialBluePro offered the best value and most transparent pricing. They installed decorative rock and mulch throughout our front yard. The transformation was incredible and they cleaned up everything before leaving. Five stars all the way!",
     stars: 5
   },
   {
     name: "David Thompson",
     role: "Business Owner",
     content: "We hired SocialBluePro for commercial landscaping maintenance at our office property. Their professionalism is unmatched. Reliable scheduling, clear communication, and consistently beautiful results. They understand the importance of curb appeal for businesses.",
     stars: 5
   }
 ];

export default function Testimonials() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const safeIndex = testimonials.length > 0 ? index % testimonials.length : 0;

  return (
    <section className="py-16 md:py-24 bg-slate-900 overflow-hidden relative" id="testimonials">
      <div className="container mx-auto px-4 md:px-8 w-full max-w-7xl relative z-10">
        <div className="text-center mb-12">
          <span className="text-accent font-black tracking-widest uppercase text-[10px] mb-3 block">Testimonials</span>
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter leading-tight">
            Trusted by <br />
            <span className="text-accent italic">Colorado Families.</span>
          </h2>
        </div>

        <div className="max-w-3xl mx-auto relative h-[320px] sm:h-[280px]">
          <AnimatePresence mode="wait">
            {testimonials.length > 0 && (
              <motion.div
                key={safeIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0 bg-white/5 border border-white/10 p-6 md:p-10 rounded-3xl flex flex-col justify-center items-center text-center backdrop-blur-sm"
              >
                <Quote className="text-accent/20 w-8 h-8 md:w-10 md:h-10 mb-4 md:mb-6" />
                <div className="flex gap-1 mb-4 md:mb-6 text-accent">
                  {[...Array(testimonials[safeIndex].stars)].map((_, i) => (
                    <Star key={i} size={14} fill="currentColor" />
                  ))}
                </div>
                <p className="text-white text-base md:text-lg font-medium leading-relaxed mb-6 md:mb-8 italic max-w-xl">
                  &quot;{testimonials[safeIndex].content}&quot;
                </p>
                <div>
                  <p className="font-black text-white text-base md:text-lg">{testimonials[safeIndex].name}</p>
                  <p className="text-accent font-bold text-[9px] uppercase tracking-widest">{testimonials[safeIndex].role}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex justify-center gap-3 mt-6">
           <button 
             onClick={() => setIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)}
             className="p-2.5 bg-white/5 rounded-full text-white hover:bg-accent transition-colors"
           >
              <ChevronLeft size={18} />
           </button>
           <button 
             onClick={() => setIndex((prev) => (prev + 1) % testimonials.length)}
             className="p-2.5 bg-white/5 rounded-full text-white hover:bg-accent transition-colors"
           >
              <ChevronRight size={18} />
           </button>
        </div>
      </div>
    </section>
  );
}
