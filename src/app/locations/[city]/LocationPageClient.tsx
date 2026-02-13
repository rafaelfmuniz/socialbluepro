"use client";

import { useState } from "react";
import dynamic from 'next/dynamic';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackToTop from "@/components/ui/BackToTop";
import { LocationData } from "@/lib/locations-data";
import { ArrowRight, MapPin, CheckCircle, Shield } from "lucide-react";

const QuoteModal = dynamic(
  () => import('@/components/ui/QuoteModal'),
  { ssr: false }
);

interface Props {
  location: LocationData;
}

export default function LocationPageClient({ location }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <main className="min-h-screen w-full relative bg-slate-50">
      <Navbar onGetQuote={() => setIsModalOpen(true)} />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-slate-900">
        <div className="container mx-auto px-4 text-center">
          <span className="text-accent font-black tracking-widest uppercase text-xs mb-4 block flex items-center justify-center gap-2">
            <MapPin size={14} /> Serving {location.name}, CO
          </span>
          <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter mb-6 leading-tight">
            {location.h1.split(' in ')[0]} <br />
            <span className="text-accent italic">in {location.name}.</span>
          </h1>
          <p className="text-slate-400 max-w-3xl mx-auto font-medium text-lg">
            {location.intro}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20">
        <div className="container mx-auto px-4 md:px-8 max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight mb-6">Local Landscaping Experts</h2>
                <div className="space-y-4">
                  {location.highlights.map((highlight, i) => (
                    <div key={i} className="flex gap-4 items-start bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                      <div className="text-accent shrink-0 mt-1">
                        <CheckCircle size={20} />
                      </div>
                      <p className="font-bold text-slate-700">{highlight}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-4">Areas We Serve Near {location.name}</h3>
                <div className="flex flex-wrap gap-2">
                  {location.nearbyAreas.map((area) => (
                    <span key={area} className="px-4 py-2 bg-slate-200/50 rounded-lg text-sm font-bold text-slate-600">
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 text-center">
                <Shield className="mx-auto text-accent mb-6" size={48} />
                <h3 className="text-2xl font-black text-slate-900 uppercase mb-4">Request a Local Estimate</h3>
                <p className="text-slate-500 mb-8 font-medium">
                  We're ready to transform your {location.name} property. Get your free, no-obligation quote today.
                </p>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="w-full bg-accent text-white py-5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-green-600 transition-all shadow-xl shadow-accent/20 active:scale-95 group flex items-center justify-center gap-3"
                >
                  Get Started in {location.name}
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              <div className="h-[300px] rounded-3xl overflow-hidden shadow-lg border-4 border-white grayscale hover:grayscale-0 transition-all duration-700">
                <iframe 
                  src={location.mapEmbed}
                  width="100%" 
                  height="100%" 
                  style={{ border: 0 }} 
                  allowFullScreen 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </div>
            </div>

          </div>
        </div>
      </section>

      <Footer onGetQuote={() => setIsModalOpen(true)} />
      <QuoteModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <BackToTop />
    </main>
  );
}
