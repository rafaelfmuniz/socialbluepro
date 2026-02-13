"use client";

import { useState } from "react";
import dynamic from 'next/dynamic';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackToTop from "@/components/ui/BackToTop";
import { 
  Sprout, 
  Mountain, 
  Snowflake, 
  Hammer, 
  Leaf, 
  Trees,
  Scissors,
  Wrench,
  Building,
  ArrowRight,
  AlertCircle
} from "lucide-react";
import { IMAGES } from "@/lib/constants";
import Image from "next/image";
import Link from "next/link";

const QuoteModal = dynamic(
  () => import('@/components/ui/QuoteModal'),
  { ssr: false }
);

const services = [
  {
    title: "Sod Installation",
    slug: "sod-installation",
    description: "Premium, fresh-cut Colorado sod for an instant, lush green lawn that thrives in Denver's climate.",
    icon: Sprout,
    image: IMAGES.sod
  },
  {
    title: "Hardscaping",
    slug: "hardscaping",
    description: "Structural beauty through stone patios, retaining walls, and custom outdoor living spaces.",
    icon: Hammer,
    image: IMAGES.hardscaping
  },
  {
    title: "Snow Removal",
    slug: "snow-removal",
    description: "Reliable residential snow clearing and professional de-icing to keep your Denver property safe.",
    icon: Snowflake,
    image: IMAGES.snow
  },
  {
    title: "Decorative Rock",
    slug: "decorative-rock",
    description: "Low-maintenance landscape elegance using premium river rocks and decorative stones.",
    icon: Mountain,
    image: IMAGES.rock
  },
  {
    title: "Mulch Installation",
    slug: "mulch-installation",
    description: "Professional soil protection and aesthetic enhancement with high-quality organic mulch.",
    icon: Leaf,
    image: IMAGES.mulch
  },
  {
    title: "Spring/Fall Clean Up",
    slug: "spring-fall-clean-up",
    description: "Seasonal restoration, leaf removal, and property preparation for the Colorado elements.",
    icon: Trees,
    image: IMAGES.cleanup
  },
  {
    title: "One-Time Weed Pulling",
    slug: "one-time-weed-pulling",
    description: "Deep, manual removal of invasive growth to restore your garden beds to their original state.",
    icon: Scissors,
    iconColor: "text-red-500",
    image: IMAGES.weed
  },
  {
    title: "Custom Landscaping",
    slug: "custom-landscaping",
    description: "Full-scale property transformation from ground prep to final planting for your dream yard.",
    icon: Wrench,
    image: IMAGES.custom
  },
  {
    title: "Commercial Landscaping",
    slug: "commercial-landscaping",
    description: "One reliable team for commercial property care: routine landscaping, snow/ice management, and more.",
    icon: Building,
    image: IMAGES.commercial
  }
];

export default function ServicesPageClient() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<string | undefined>(undefined);

  const openModal = (service?: string) => {
    setSelectedService(service);
    setIsModalOpen(true);
  };

  return (
    <main className="min-h-screen w-full relative bg-slate-50">
      <Navbar onGetQuote={() => openModal()} />
      
      <section className="pt-32 pb-20 bg-slate-900">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter mb-4">
            Our <span className="text-accent italic">Services.</span>
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto font-medium">
            Professional landscape solutions designed specifically for Denver's unique high-altitude climate.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4 md:px-8 w-full max-w-7xl">
          
          {/* Important Policy Banner */}
          <div className="mb-16 max-w-3xl mx-auto">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 flex items-start gap-4 shadow-sm border-l-8 border-l-accent">
              <div className="shrink-0 mt-1 text-accent">
                <AlertCircle size={24} />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-1">Service Policy</h3>
                <p className="text-slate-600 text-sm md:text-base font-medium leading-relaxed">
                  We specialize in <span className="text-slate-900 font-bold">one-time residential transformations</span>. 
                  Recurring maintenance is available exclusively through our <span className="text-accent font-bold">Commercial Maintenance Contracts</span>.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service) => (
              <div
                key={service.title}
                className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-slate-100 flex flex-col"
              >
                <Link href={`/services/${service.slug}`} className="relative h-56 overflow-hidden block">
                  <Image 
                    src={service.image}
                    alt={service.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700 filter brightness-[0.85] contrast-[1.1]"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-60" />
                  <div className="absolute top-6 left-6">
                    <div className="w-12 h-12 bg-white/95 backdrop-blur rounded-xl flex items-center justify-center text-accent shadow-xl group-hover:bg-accent group-hover:text-white transition-all duration-300">
                      <service.icon size={24} />
                    </div>
                  </div>
                </Link>
                
                <div className="p-8 flex flex-col flex-1">
                  <Link href={`/services/${service.slug}`}>
                    <h3 className="text-xl font-black text-slate-900 mb-3 tracking-tight uppercase group-hover:text-accent transition-colors">
                      {service.title}
                    </h3>
                  </Link>
                  <p className="text-slate-500 text-sm leading-relaxed mb-8 flex-1 font-medium">
                    {service.description}
                  </p>
                  <div className="flex items-center justify-between mt-auto">
                    <Link 
                      href={`/services/${service.slug}`}
                      className="text-slate-900 font-black text-xs uppercase tracking-widest hover:text-accent transition-colors flex items-center gap-2 group/link"
                    >
                      Details <ArrowRight size={14} className="group-hover/link:translate-x-1 transition-transform" />
                    </Link>
                    <button 
                      onClick={() => openModal(service.title)}
                      className="bg-slate-50 hover:bg-accent hover:text-white text-slate-900 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                      Get Quote
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 bg-white border-y border-slate-100">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-8">Not sure what you need?</h2>
          <button 
            onClick={() => openModal()}
            className="inline-flex items-center gap-3 bg-accent text-white px-10 py-5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-green-600 transition-all shadow-xl active:scale-95 group"
          >
            Schedule a Free Consultation
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      <Footer onGetQuote={() => openModal()} />
      <QuoteModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        initialService={selectedService}
      />
      <BackToTop />
    </main>
  );
}
