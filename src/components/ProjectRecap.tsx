"use client";

import { motion } from "framer-motion";
import { MapPin, ArrowRight, DollarSign, Clock } from "lucide-react";
import { IMAGES } from "@/lib/constants";

const projects = [
  {
    title: "Luxury Patio & Sod Renovation",
    location: "Cherry Creek, CO",
    cost: "$15k - $25k",
    time: "2 Weeks",
    image: IMAGES.hardscaping,
    category: "Hardscaping & Sod"
  },
  {
    title: "Full Backyard Transformation",
    location: "Highlands Ranch, CO",
    cost: "$30k - $45k",
    time: "4 Weeks",
    image: IMAGES.custom,
    category: "Full Landscape"
  },
  {
    title: "Mountain Rock & Path Design",
    location: "Castle Rock, CO",
    cost: "$12k - $18k",
    time: "10 Days",
    image: IMAGES.rock,
    category: "Decorative Rock"
  },
];


interface ProjectRecapProps {
  onGetQuote: () => void;
}

export default function ProjectRecap({ onGetQuote }: ProjectRecapProps) {
  return (
    <section id="projects" className="py-16 md:py-24 bg-white border-t border-slate-100">
      <div className="container mx-auto px-4 md:px-8 w-full max-w-7xl">
        <div className="flex flex-col lg:flex-row justify-between items-center mb-12 gap-8 text-center lg:text-left">
          <div>
            <span className="text-accent font-black tracking-widest uppercase text-[10px] mb-3 block">Portfolio</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none uppercase">
              Real Work, <br />
              <span className="text-accent italic">Real Results.</span>
            </h2>
          </div>
          <button 
            onClick={onGetQuote}
            className="flex items-center gap-3 bg-slate-900 text-white px-8 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl group active:scale-95"
          >
            Get Project Quote
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform text-accent" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, index) => (
            <motion.div
              key={project.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-slate-50 rounded-2xl overflow-hidden group shadow-sm hover:shadow-xl transition-all border border-slate-100 flex flex-col h-full"
            >
              <div className="relative h-56 overflow-hidden">
                    <img
                     src={project.image}
                     alt={project.title}
                     width={400}
                     height={224}
                     className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 filter brightness-[0.95]"
                     loading="lazy"
                     decoding="async"
                   />
                <div className="absolute top-3 left-3">
                  <span className="bg-white/95 backdrop-blur-md text-slate-900 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg">
                    {project.category}
                  </span>
                </div>
              </div>
              
              <div className="p-5 flex flex-col flex-1">
                <div className="flex items-center gap-2 text-accent mb-2">
                  <MapPin size={12} fill="currentColor" />
                  <span className="text-[9px] font-black uppercase tracking-widest leading-none">{project.location}</span>
                </div>
                
                <h3 className="text-lg font-black text-slate-900 mb-6 leading-tight flex-1 uppercase tracking-tight">{project.title}</h3>
                
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                  <div className="space-y-0.5">
                    <p className="text-[8px] uppercase tracking-widest font-black text-slate-400 flex items-center gap-1">
                       <DollarSign size={10} className="text-accent" /> Cost
                    </p>
                    <p className="font-black text-base text-slate-900 tracking-tight">{project.cost}</p>
                  </div>
                  <div className="space-y-0.5 text-right">
                    <p className="text-[8px] uppercase tracking-widest font-black text-slate-400 flex items-center justify-end gap-1">
                       <Clock size={10} className="text-accent" /> Time
                    </p>
                    <p className="font-black text-base text-slate-900 tracking-tight">{project.time}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
