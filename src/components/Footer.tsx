"use client";

import Link from "next/link";
import { Phone, Mail, Instagram, Facebook, Star, ArrowUpRight, MapPin } from "lucide-react";
import { locationsData } from "@/lib/locations-data";

interface FooterProps {
  onGetQuote: () => void;
}

export default function Footer({ onGetQuote }: FooterProps) {
  const topLocations = Object.values(locationsData).slice(0, 6);

  return (
    <footer className="bg-slate-900 text-white pt-12 md:pt-16 pb-8 relative overflow-hidden border-t border-white/5">
      <div className="container mx-auto px-6 md:px-12 relative z-10 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10 lg:gap-12 mb-12">
          
          {/* Brand Column */}
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-3">
                <img
                     src="/imgs/Imgs_WEBP/logo.webp"
                     alt="SocialBluePro Logo"
                     width={40}
                     height={40}
                     className="h-10 w-10 object-contain"
                   />
               <span className="text-xl font-black tracking-tighter">SOCIALBLUEPRO</span>
             </Link>
            <p className="text-slate-400 leading-relaxed font-medium text-sm">
               Expert one-time landscaping, sod installation, decorative rock, mulch, hardscaping, and snow removal services since 2020.
             </p>
            <div className="flex gap-3">
               <Link href="https://www.instagram.com/socialbluepro/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center hover:bg-accent hover:border-accent transition-all duration-300 group">
                  <Instagram size={18} className="group-hover:scale-110 transition-transform" />
               </Link>
               <Link href="https://www.facebook.com/socialbluepro/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center hover:bg-accent hover:border-accent transition-all duration-300 group">
                  <Facebook size={18} className="group-hover:scale-110 transition-transform" />
               </Link>
             </div>
          </div> 

          {/* Service Areas */}
          <div>
            <h4 className="text-[10px] uppercase tracking-[0.3em] font-black text-accent mb-6">Service Areas</h4>
            <ul className="space-y-3">
              {topLocations.map((loc) => (
                <li key={loc.slug}>
                  <Link 
                    href={`/locations/${loc.slug}`} 
                    className="text-slate-400 hover:text-white transition-colors text-[10px] uppercase tracking-widest font-bold flex items-center gap-2 group"
                  >
                     <MapPin size={10} className="text-accent/50 group-hover:text-accent" />
                     {loc.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-[10px] uppercase tracking-[0.3em] font-black text-accent mb-6">Navigation</h4>
            <ul className="space-y-4 text-slate-400 font-bold uppercase text-[10px] tracking-widest">
               <li><Link href="/services" className="hover:text-white transition-colors flex items-center gap-2 group">Our Expertise <ArrowUpRight size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" /></Link></li> 
               <li><Link href="/about" className="hover:text-white transition-colors flex items-center gap-2 group">About Us <ArrowUpRight size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" /></Link></li>
               <li><Link href="/contact" className="hover:text-white transition-colors flex items-center gap-2 group">Contact Us <ArrowUpRight size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" /></Link></li>
               <li><Link href="/faq" className="hover:text-white transition-colors flex items-center gap-2 group">Common FAQ <ArrowUpRight size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" /></Link></li>
               <li><button onClick={onGetQuote} className="hover:text-white transition-colors flex items-center gap-2 group w-full text-left uppercase">Get Quote <ArrowUpRight size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" /></button></li>
             </ul>
          </div> 

          {/* Contact Details */}
          <div>
            <h4 className="text-[10px] uppercase tracking-[0.3em] font-black text-accent mb-6">Get In Touch</h4>
            <ul className="space-y-6">
              <li className="flex items-start gap-4 group">
                <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-accent/20 transition-colors">
                  <Phone size={16} className="text-accent" />
                </div>
                <div>
                   <p className="text-[9px] text-slate-500 uppercase tracking-widest font-black mb-1">Direct Line</p>
                   <a href="tel:7207374607" className="text-white hover:text-accent transition-colors font-black text-sm">(720) 737-4607</a>
                </div>
              </li>
              <li className="flex items-start gap-4 group">
                <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-accent/20 transition-colors">
                  <Mail size={16} className="text-accent" />
                </div>
                <div>
                   <p className="text-[9px] text-slate-500 uppercase tracking-widest font-black mb-1">Email Support</p>
                    <a href="mailto:contact@socialbluepro.com" className="text-white hover:text-accent transition-colors font-black text-sm">contact@socialbluepro.com</a>
                </div>
              </li>
            </ul>
          </div> 

          {/* Trust Badge */}
          <div className="bg-white/5 p-6 rounded-2xl border border-white/10 flex flex-col items-center justify-center text-center h-full">
              <div className="flex gap-1 text-accent mb-3">
                 {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
              </div>
              <h4 className="text-base font-black mb-2 italic">Five Star Service by Google reviews</h4>
          </div>
        </div> 

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-[9px] font-black text-slate-600 uppercase tracking-widest">
          <p className="text-center md:text-left">© {new Date().getFullYear()} SocialBluePro Services. All Rights Reserved.</p>
          <div className="flex gap-8">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
