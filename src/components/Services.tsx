"use client";


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
    description: "One reliable team for commercial property care routine landscaping, snow/ice management, weed control, parking lot maintenance, and add-on services as needed.",
    icon: Building,
    image: IMAGES.commercial
  }
];

interface ServicesProps {
  onSelectService: (service: string) => void;
}

export default function Services({ onSelectService }: ServicesProps) {
  return (
    <section id="services" className="py-16 md:py-24 bg-slate-50 border-t border-slate-100">
      <div className="container mx-auto px-4 md:px-8 w-full max-w-7xl">
        
        {/* Exclusion Banner */}
        <div className="mb-12 md:mb-16 max-w-3xl mx-auto">
          <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-start gap-4 shadow-sm border-l-4 border-l-red-500">
            <div className="shrink-0 mt-0.5">
              <AlertCircle size={20} className="text-red-500" />
            </div>
            <div>
              <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1">Important Policy</h3>
               <p className="text-slate-600 text-xs md:text-sm font-medium leading-relaxed">
                 We specialize in <span className="text-slate-900 font-bold">one-time residential transformations</span>. Recurring maintenance is available through <span className="text-accent font-bold">commercial contracts</span>.
               </p>
            </div>
          </div>
        </div>

        <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
          <span className="text-accent font-black tracking-widest uppercase text-[10px] mb-3 block">Our Expertise</span>
           <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 mb-4 tracking-tighter leading-tight">
             High-Impact <br />
             <span className="text-accent italic">Landscaping.</span>
           </h2>
          <p className="text-sm md:text-base text-slate-500 font-medium leading-relaxed">
            Professional services delivered with surgical precision across the Denver Metro area.
          </p>
        </div>

         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-stagger">
          {services.map((service, index) => (
             <div
               key={service.title}
               className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 flex flex-col"
            >
                <Link href={`/services/${service.slug}`} className="relative h-48 overflow-hidden block">
                     <Image 
                       src={service.image}
                       alt={service.title}
                       width={400}
                       height={192}
                       className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 filter brightness-[0.9] contrast-[1.1]"
                       priority={false}
                         quality={40}
                        sizes="(max-width: 768px) 100vw, 400px"
                        placeholder="blur"
                        blurDataURL="data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A="
                     />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-60" />
                <div className="absolute top-4 left-4">
                   <div className="w-10 h-10 bg-white/90 backdrop-blur rounded-lg flex items-center justify-center text-accent shadow-lg group-hover:scale-110 transition-transform">
                      <service.icon size={20} />
                   </div>
                </div>
              </Link>
              
              <div className="p-6 flex flex-col flex-1">
                <Link href={`/services/${service.slug}`}>
                  <h3 className="text-lg font-black text-slate-900 mb-2 tracking-tight uppercase group-hover:text-accent transition-colors">
                    {service.title}
                  </h3>
                </Link>
                <p className="text-slate-500 text-xs md:text-sm leading-relaxed mb-6 flex-1 font-medium">
                  {service.description}
                </p>
                <button 
                  onClick={() => onSelectService(service.title)}
                  className="flex items-center gap-2 text-slate-900 font-black text-[10px] uppercase tracking-widest group/btn hover:text-accent transition-colors w-fit"
                >
                  Request Service <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
             </div>
          ))}
        </div>
      </div>
    </section>
  );
}
