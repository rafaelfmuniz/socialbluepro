"use client";

import { useState } from "react";
import dynamic from 'next/dynamic';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackToTop from "@/components/ui/BackToTop";
import { Shield, Star, Briefcase, ArrowRight } from "lucide-react";
import { IMAGES } from "@/lib/constants";

const QuoteModal = dynamic(
  () => import('@/components/ui/QuoteModal'),
  { ssr: false }
);

export default function AboutPageClient() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <main className="min-h-screen w-full relative bg-slate-50">
      <Navbar onGetQuote={() => setIsModalOpen(true)} />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 bg-slate-900 overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-40">
          <img 
            src={IMAGES.hero} 
            alt="Denver Landscaping" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900/60 to-slate-900" />
        </div>
        
        <div className="container mx-auto px-4 md:px-8 relative z-10 text-center">
          <span className="text-accent font-black tracking-widest uppercase text-xs mb-4 block">Established 2020</span>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white tracking-tighter leading-[1.1] uppercase mb-6">
            Denver's Trusted <br />
            <span className="text-accent italic">Family Landscapers.</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto font-medium leading-relaxed mb-10">
            SocialBluePro is dedicated to high-quality outdoor transformations, built on family values and professional execution.
          </p>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-3 bg-accent text-white px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-green-600 transition-all shadow-xl shadow-accent/20 active:scale-95 group"
          >
            Get a Free Quote
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 md:px-8 max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <span className="text-accent font-black tracking-widest uppercase text-xs block">Our Story</span>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight uppercase leading-tight">
                From One Family to <br /> Another Since 2020
              </h2>
              <p className="text-slate-600 text-lg leading-relaxed">
                SocialBluePro started with a simple belief: your outdoor space should feel as finished as the inside of your home. We're a family-owned landscaping company serving the Denver Metro area, built on referrals, clean execution, and transparent communication.
              </p>
              <p className="text-slate-600 text-lg leading-relaxed">
                We specialize in one-time, high-impact transformations. That means when we show up, we show up with a plan: precise prep, clean lines, premium materials, and a final result that looks intentional from every angle.
              </p>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-3xl overflow-hidden shadow-2xl">
                <img 
                  src={IMAGES.custom} 
                  alt="SocialBluePro Team Work" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-accent p-8 rounded-2xl shadow-xl text-white">
                <span className="text-4xl font-black block mb-1">5.0</span>
                <div className="flex gap-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} fill="currentColor" />
                  ))}
                </div>
                <span className="text-xs font-bold uppercase tracking-widest">Average Rating</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Differentiators */}
      <section className="py-20 bg-slate-50 border-y border-slate-200">
        <div className="container mx-auto px-4 md:px-8 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight uppercase mb-4">Why Homeowners Choose Us</h2>
            <div className="h-1.5 w-24 bg-accent mx-auto" />
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:border-accent/30 transition-all group">
              <div className="w-14 h-14 bg-accent/10 rounded-xl flex items-center justify-center text-accent mb-6 group-hover:scale-110 transition-transform">
                <Shield size={28} />
              </div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-4">Licensed & Insured</h3>
              <p className="text-slate-600 leading-relaxed">
                Full liability coverage and professional standards for your peace of mind on every project.
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:border-accent/30 transition-all group">
              <div className="w-14 h-14 bg-accent/10 rounded-xl flex items-center justify-center text-accent mb-6 group-hover:scale-110 transition-transform">
                <Star size={28} />
              </div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-4">5-Star Rated</h3>
              <p className="text-slate-600 leading-relaxed">
                Our reputation is built on consistent quality and the kind of service that earns referrals.
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:border-accent/30 transition-all group">
              <div className="w-14 h-14 bg-accent/10 rounded-xl flex items-center justify-center text-accent mb-6 group-hover:scale-110 transition-transform">
                <Briefcase size={28} />
              </div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-4">Project Focus</h3>
              <p className="text-slate-600 leading-relaxed">
                Dedicated management from consultation to final walkthrough for a smooth, predictable process.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 md:px-8 max-w-5xl">
          <div className="text-center mb-16">
            <span className="text-accent font-black tracking-widest uppercase text-xs block mb-2">Our Method</span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight uppercase mb-4">How We Work</h2>
          </div>
          <div className="relative">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -translate-y-1/2 hidden md:block" />
            <div className="grid md:grid-cols-3 gap-12 relative z-10">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-slate-900 text-white rounded-full flex items-center justify-center mx-auto text-xl font-black border-4 border-white shadow-xl">1</div>
                <h3 className="text-lg font-black text-slate-900 uppercase">Consultation</h3>
                <p className="text-slate-500 text-sm">We walk your property to understand your vision and provide an expert assessment.</p>
              </div>
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-slate-900 text-white rounded-full flex items-center justify-center mx-auto text-xl font-black border-4 border-white shadow-xl">2</div>
                <h3 className="text-lg font-black text-slate-900 uppercase">Design & Scope</h3>
                <h4 className="text-slate-500 text-sm">A clear, detailed proposal with materials and timelines tailored to your needs.</h4>
              </div>
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-accent text-white rounded-full flex items-center justify-center mx-auto text-xl font-black border-4 border-white shadow-xl">3</div>
                <h3 className="text-lg font-black text-slate-900 uppercase">Build & Transform</h3>
                <p className="text-slate-500 text-sm">Precise execution and clean jobsite etiquette until the final result is achieved.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-slate-900">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter mb-8">Ready to transform your yard?</h2>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-3 bg-accent text-white px-10 py-5 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-green-600 transition-all shadow-2xl shadow-accent/20 active:scale-95 group"
          >
            Start Your Project
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      <Footer onGetQuote={() => setIsModalOpen(true)} />
      <QuoteModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <BackToTop />
    </main>
  );
}
