"use client";

import { Shield, Clock, ArrowRight, CheckCircle } from "lucide-react";

interface AboutSectionProps {
  onGetQuote: () => void;
}

export default function AboutSection({ onGetQuote }: AboutSectionProps) {
  return (
    <section id="about" className="py-16 md:py-24 bg-slate-900 relative overflow-hidden">
      <div className="container mx-auto px-4 md:px-8 w-full max-w-6xl relative z-10">

        {/* Header Section */}
        <div className="text-center mb-8 md:mb-12">
          <span className="text-accent font-black tracking-widest uppercase text-[10px] mb-3 block">Our Story</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tighter leading-[1.1] uppercase mb-6">
            Estate <br />
            <span className="text-accent italic">Landscaping.</span>
          </h2>
        </div>

        {/* Content Grid */}
        <div className="grid lg:grid-cols-2 gap-8 md:gap-12 mb-8">
          
          <div className="space-y-4 text-left">
            <p className="text-sm md:text-base text-slate-300 font-medium leading-relaxed">
              In 2020, SocialBluePro started with a simple belief: your outdoor space should feel as finished as inside of your home. We're a family-owned landscaping company serving Denver Metro area, built on referrals, clean execution, and kind of communication that makes projects feel easy.
            </p>
            <p className="text-sm md:text-base text-slate-300 font-medium leading-relaxed">
              For homeowners, we specialize in one-time, high-impact transformations, not weekly mowing routes. That means when we show up, we show up with a plan: precise prep, clean lines, premium materials, and a final result that looks intentional from every angle.
            </p>
          </div>

          <div className="space-y-4 text-left">
            <p className="text-sm md:text-base text-slate-300 font-medium leading-relaxed">
              From sod installation, decorative rock, mulch, hardscaping, spring/fall cleanups, and snow removal, we treat every property like it's our own.
            </p>
            <p className="text-sm md:text-base text-slate-300 font-medium leading-relaxed">
              For businesses and property managers, we offer Commercial Landscaping Maintenance Contracts. Reliable, scheduled service designed to keep your property looking sharp, safe, and professional year-round. Clear scopes, consistent crews, and standards you can count on.
            </p>
          </div>
        </div>

        {/* Philosophy Quote */}
        <div className="bg-gradient-to-r from-accent/10 via-transparent to-accent/10 border border-accent/20 rounded-2xl p-6 md:p-8 mb-8 text-center">
           <p className="text-base md:text-lg lg:text-xl text-white font-black leading-tight italic tracking-tight">
            "Because landscaping isn't just making it look better."
            <br />
            <span className="text-accent">It's protecting your investment, elevating curb appeal, and creating a space that represents you at home and at work.</span>
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
          <div className="flex gap-4 items-start p-5 bg-white/5 rounded-xl border border-white/10 hover:border-accent/50 transition-all text-left group hover:bg-white/10">
            <div className="shrink-0 text-accent group-hover:scale-110 transition-transform">
              <Shield size={20} />
            </div>
            <div>
               <h3 className="text-xs font-black text-white uppercase tracking-wider mb-2">Local & Insured</h3>
              <p className="text-xs text-slate-400 leading-relaxed">Family-owned, Colorado-based. Licensed/insured standards and professional jobsite etiquette every time.</p>
            </div>
          </div>
          <div className="flex gap-4 items-start p-5 bg-white/5 rounded-xl border border-white/10 hover:border-accent/50 transition-all text-left group hover:bg-white/10">
            <div className="shrink-0 text-accent group-hover:scale-110 transition-transform">
              <Clock size={20} />
            </div>
            <div>
               <h3 className="text-xs font-black text-white uppercase tracking-wider mb-2">Project Focus</h3>
              <p className="text-xs text-slate-400 leading-relaxed">Clear scope, clean timeline, and consistent communication so your project stays smooth and predictable.</p>
            </div>
          </div>
          <div className="flex gap-4 items-start p-5 bg-white/5 rounded-xl border border-white/10 hover:border-accent/50 transition-all text-left group hover:bg-white/10 sm:col-span-2 lg:col-span-1">
            <div className="shrink-0 text-accent group-hover:scale-110 transition-transform">
              <CheckCircle size={20} />
            </div>
            <div>
               <h3 className="text-xs font-black text-white uppercase tracking-wider mb-2">100% Satisfaction</h3>
              <p className="text-xs text-slate-400 leading-relaxed">If it's not right, we make it right because our name is on it.</p>
            </div>
          </div>
        </div>

          {/* CTA Section */}
          <div className="text-center space-y-4">
            <button 
              onClick={onGetQuote}
              className="inline-flex items-center gap-3 bg-accent text-white px-8 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-green-600 transition-all shadow-xl shadow-accent/20 active:scale-95 group"
            >
              Request an Estimate
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
      </div>
    </section>
  );
}
