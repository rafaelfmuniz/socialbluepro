"use client";

import Link from "next/link";
import { Phone, Mail, Instagram, Facebook, Star, ArrowUpRight, MapPin } from "lucide-react";
import { locationsData } from "@/lib/locations-data";

interface FooterProps {
  onGetQuote: () => void;
}

export default function Footer({ onGetQuote }: FooterProps) {
  const allLocations = Object.values(locationsData).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  return (
    <footer className="bg-slate-900 text-white pt-10 md:pt-12 pb-6 relative overflow-hidden border-t border-white/5">
      <div className="container mx-auto px-4 md:px-8 relative z-10 max-w-7xl">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-6 mb-8 text-center md:text-left">
          
          {/* Brand Column */}
          <div className="lg:col-span-3 space-y-4 flex flex-col items-center md:items-start">
            <Link href="/" className="flex items-center gap-2.5">
              <img
                src="/imgs/Imgs_WEBP/logo.webp"
                alt="SocialBluePro Logo"
                width={32}
                height={32}
                className="h-8 w-8 object-contain"
              />
              <span className="text-lg font-black tracking-tighter">SOCIALBLUEPRO</span>
            </Link>
            <p className="text-slate-400 leading-relaxed text-xs max-w-xs">
              Expert one-time landscaping, sod installation, decorative rock, mulch, hardscaping, and snow removal services since 2020.
            </p>
            <div className="flex gap-2">
              <Link href="https://www.instagram.com/socialbluepro/" target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center hover:bg-accent hover:border-accent transition-all duration-300 group">
                <Instagram size={16} className="group-hover:scale-110 transition-transform" />
              </Link>
              <Link href="https://www.facebook.com/socialbluepro/" target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center hover:bg-accent hover:border-accent transition-all duration-300 group">
                <Facebook size={16} className="group-hover:scale-110 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Service Areas */}
          <div className="lg:col-span-4 flex flex-col items-center md:items-start">
            <h4 className="text-[10px] uppercase tracking-[0.25em] font-black text-accent mb-4">Service Areas</h4>
            <ul className="grid grid-cols-2 gap-x-6 gap-y-2 text-left">
              {allLocations.map((loc) => (
                <li key={loc.slug}>
                  <Link 
                    href={`/locations/${loc.slug}`} 
                    className="text-slate-400 hover:text-white transition-colors text-[10px] uppercase tracking-wider font-semibold flex items-center gap-1.5 group"
                  >
                    <MapPin size={9} className="text-accent/60 group-hover:text-accent shrink-0" />
                    <span className="truncate">{loc.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Navigation */}
          <div className="lg:col-span-2 flex flex-col items-center md:items-start">
            <h4 className="text-[10px] uppercase tracking-[0.25em] font-black text-accent mb-4">Navigation</h4>
            <ul className="space-y-2 text-slate-400 font-semibold uppercase text-[10px] tracking-wider flex flex-col items-center md:items-start">
              <li>
                <Link href="/services" className="hover:text-white transition-colors flex items-center gap-1.5 group">
                  Services <ArrowUpRight size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition-colors flex items-center gap-1.5 group">
                  About <ArrowUpRight size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors flex items-center gap-1.5 group">
                  Contact <ArrowUpRight size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-white transition-colors flex items-center gap-1.5 group">
                  FAQ <ArrowUpRight size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
              <li>
                <button onClick={onGetQuote} className="hover:text-white transition-colors flex items-center gap-1.5 group text-left">
                  Get Quote <ArrowUpRight size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </li>
            </ul>
          </div>

          {/* Contact + Trust Badge Combined */}
          <div className="lg:col-span-3 space-y-4 flex flex-col items-center md:items-start">
            <h4 className="text-[10px] uppercase tracking-[0.25em] font-black text-accent mb-4">Contact</h4>
            <div className="space-y-3 flex flex-col items-center md:items-start">
              <a href="tel:7207374607" className="flex items-center gap-3 group">
                <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                  <Phone size={14} className="text-accent" />
                </div>
                <div>
                  <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Phone</p>
                  <span className="text-white font-bold text-sm">(720) 737-4607</span>
                </div>
              </a>
              <a href="mailto:contact@socialbluepro.com" className="flex items-center gap-3 group">
                <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                  <Mail size={14} className="text-accent" />
                </div>
                <div>
                  <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Email</p>
                  <span className="text-white font-bold text-sm">contact@socialbluepro.com</span>
                </div>
              </a>
            </div>
            
            {/* Trust Badge - Compact */}
            <div className="flex items-center justify-center md:justify-start gap-2 mt-4 pt-4 border-t border-white/5 w-full">
              <div className="flex gap-0.5 text-accent">
                {[...Array(5)].map((_, i) => <Star key={i} size={12} fill="currentColor" />)}
              </div>
              <span className="text-xs font-bold italic text-slate-300">5-Star Google Reviews</span>
            </div>
          </div>
        </div>

        {/* Copyright Bar */}
        <div className="pt-6 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
          <p className="text-center md:text-left">© {new Date().getFullYear()} SocialBluePro. All Rights Reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
