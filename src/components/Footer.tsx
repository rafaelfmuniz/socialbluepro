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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-6 mb-8">
          
          {/* Brand Column - Centralizado em todos os breakpoints */}
          <div className="lg:col-span-3 space-y-4 flex flex-col items-center text-center md:items-start md:text-left">
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
            <div className="flex gap-2 justify-center md:justify-start">
              <Link href="https://www.instagram.com/socialbluepro/" target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center hover:bg-accent hover:border-accent transition-all duration-300 group">
                <Instagram size={16} className="group-hover:scale-110 transition-transform" />
              </Link>
              <Link href="https://www.facebook.com/socialbluepro/" target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center hover:bg-accent hover:border-accent transition-all duration-300 group">
                <Facebook size={16} className="group-hover:scale-110 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Service Areas */}
          <div className="lg:col-span-4">
            <h4 className="text-xs uppercase tracking-[0.25em] font-black text-accent mb-4 text-center md:text-left">Service Areas</h4>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-2 justify-items-center md:justify-items-start">
              {allLocations.map((loc) => (
                <li key={loc.slug} className="w-full">
                  <Link 
                    href={`/locations/${loc.slug}`} 
                    className="text-slate-400 hover:text-white transition-colors text-xs uppercase tracking-wider font-semibold flex items-center justify-center md:justify-start gap-1.5 group"
                  >
                    <MapPin size={12} className="text-accent/60 group-hover:text-accent shrink-0 hidden md:block" />
                    <span className="truncate">{loc.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Navigation */}
          <div className="lg:col-span-2">
            <h4 className="text-xs uppercase tracking-[0.25em] font-black text-accent mb-4 text-center md:text-left">Navigation</h4>
            <ul className="flex flex-col gap-1 text-slate-400 font-semibold uppercase tracking-wider text-center md:text-left">
              <li>
                <Link href="/services" className="hover:text-white transition-colors flex items-center justify-center md:justify-start gap-1.5 group py-1.5">
                  <span>Services</span> <ArrowUpRight size={10} className="opacity-0 group-hover:opacity-100 transition-opacity hidden md:inline" />
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition-colors flex items-center justify-center md:justify-start gap-1.5 group py-1.5">
                  <span>About</span> <ArrowUpRight size={10} className="opacity-0 group-hover:opacity-100 transition-opacity hidden md:inline" />
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors flex items-center justify-center md:justify-start gap-1.5 group py-1.5">
                  <span>Contact</span> <ArrowUpRight size={10} className="opacity-0 group-hover:opacity-100 transition-opacity hidden md:inline" />
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-white transition-colors flex items-center justify-center md:justify-start gap-1.5 group py-1.5">
                  <span>FAQ</span> <ArrowUpRight size={10} className="opacity-0 group-hover:opacity-100 transition-opacity hidden md:inline" />
                </Link>
              </li>
              <li>
                <button onClick={onGetQuote} className="hover:text-white transition-colors flex items-center justify-center md:justify-start gap-1.5 group w-full py-1.5">
                  <span>Get Quote</span> <ArrowUpRight size={10} className="opacity-0 group-hover:opacity-100 transition-opacity hidden md:inline" />
                </button>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-xs uppercase tracking-[0.25em] font-black text-accent mb-4 text-center md:text-left">Contact</h4>
            <div className="flex flex-col gap-1 items-center md:items-start">
              <a href="tel:7207374607" className="flex items-center justify-center md:justify-start gap-2 group w-full py-1.5">
                <div className="w-7 h-7 bg-white/5 rounded-lg flex items-center justify-center group-hover:bg-accent/20 transition-colors shrink-0">
                  <Phone size={14} className="text-accent" />
                </div>
                <span className="text-white font-semibold text-sm">(720) 737-4607</span>
              </a>
              <a href="mailto:contact@socialbluepro.com" className="flex items-center justify-center md:justify-start gap-2 group w-full py-1.5">
                <div className="w-7 h-7 bg-white/5 rounded-lg flex items-center justify-center group-hover:bg-accent/20 transition-colors shrink-0">
                  <Mail size={14} className="text-accent" />
                </div>
                <span className="text-white font-semibold text-sm">contact@socialbluepro.com</span>
              </a>
            </div>
            
            {/* Trust Badge */}
            <div className="flex items-center justify-center md:justify-start gap-2 mt-4 pt-4 border-t border-white/5 w-full">
              <div className="flex gap-0.5 text-accent">
                {[...Array(5)].map((_, i) => <Star key={i} size={12} fill="currentColor" />)}
              </div>
              <span className="text-xs font-semibold italic text-slate-300">5-Star Google Reviews</span>
            </div>
          </div>
        </div>

        {/* Copyright Bar */}
        <div className="pt-6 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-medium text-slate-500 uppercase tracking-wider">
          <p className="text-center md:text-left leading-relaxed">© {new Date().getFullYear()} SocialBluePro. All Rights Reserved.</p>
          <div className="flex gap-6 flex-wrap justify-center">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
