"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Phone, Menu, X, ChevronRight, ChevronDown, MapPin } from "lucide-react";
import { IMAGES } from "@/lib/constants";
import { getAllLocations } from "@/lib/locations-data";
import ProgressiveImage from "@/components/ui/ProgressiveImage";

interface NavbarProps {
  onGetQuote: () => void;
}

export default function Navbar({ onGetQuote }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isServiceAreaOpen, setIsServiceAreaOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleClickOutside = (event: MouseEvent) => {
      const dropdown = document.getElementById('service-area-dropdown');
      if (dropdown && !dropdown.contains(event.target as Node)) {
        setIsServiceAreaOpen(false);
      }
    };

    if (isServiceAreaOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isServiceAreaOpen]);

  const locations = getAllLocations().slice().sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  return (
    <>
      <nav
        className={cn(
          "fixed top-0 w-full z-[100] transition-all duration-300 px-4 md:px-8",
          isScrolled ? "py-3 md:py-4" : "py-4 md:py-5"
        )}
      >
        <div className={cn(
          "container mx-auto flex justify-between items-center transition-all duration-300 rounded-xl px-4 md:px-6",
          isScrolled || isMobileMenuOpen ? "bg-slate-900/95 backdrop-blur-sm shadow-lg border border-slate-700/50 py-3 md:py-4" : "bg-slate-900/95 backdrop-blur-sm shadow-lg border border-slate-700/50 py-4 md:py-5"
        )}>
          {/* Logo & Brand Name */}
          <Link href="/" className="flex items-center gap-3 relative z-[120] group">
            <Image
              src={IMAGES.logoWhite}
              alt="SocialBluePro"
              width={32}
              height={32}
              className="h-8 md:h-9 w-auto object-contain transition-all duration-300"
              priority
            />
            <div className={cn(
              "flex flex-col transition-all duration-300",
              "opacity-100 translate-x-0"
            )}>
               <span className={cn(
                 "text-sm md:text-base font-black tracking-tighter leading-none transition-colors",
                 "text-white"
               )} style={{ textRendering: 'optimizeSpeed' }}>
                 SOCIALBLUEPRO
               </span>
              <span className={cn(
                "text-[9px] uppercase tracking-[0.3em] font-black mt-0.5 transition-colors block",
                 "text-accent-accessible"
              )}>
                Landscaping
              </span>
            </div>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center space-x-6">
            <div className="flex items-center space-x-5">
               {[
                 { label: "Services", href: "/services" },
                 { label: "About", href: "/about" },
                 { label: "Contact", href: "/contact" }
               ].map((item) => (
                 <Link
                   key={item.label}
                   href={item.href}
                   className={cn(
                     "text-[10px] uppercase tracking-[0.2em] font-bold transition-all hover:text-accent relative group",
                     "text-white/90"
                   )}
                 >
                   {item.label}
                   <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-accent transition-all duration-300 group-hover:w-full" />
                 </Link>
                ))}
               
               {/* Service Area Dropdown */}
               <div 
                 id="service-area-dropdown"
                 className="relative"
               >
                 <button
                   type="button"
                   className={cn(
                     "text-[10px] uppercase tracking-[0.2em] font-bold transition-all hover:text-accent relative group flex items-center gap-1",
                     "text-white/90"
                   )}
                   aria-expanded={isServiceAreaOpen}
                   aria-haspopup="true"
                   onClick={() => setIsServiceAreaOpen(!isServiceAreaOpen)}
                 >
                   Service Areas
                   <ChevronDown size={12} className={cn("transition-transform", isServiceAreaOpen && "rotate-180")} />
                   <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-accent transition-all duration-300 group-hover:w-full" />
                 </button>
                 
                  {isServiceAreaOpen && (
                    <div className="absolute top-full left-0 mt-2 w-[420px] bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-700/50 p-4 z-50">
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        {locations.map((location) => (
                          <Link
                            key={location.slug}
                            href={`/locations/${location.slug}`}
                            className="flex items-center gap-2 px-3 py-2 text-[10px] uppercase tracking-widest font-bold text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                            onClick={() => setIsServiceAreaOpen(false)}
                          >
                            <MapPin size={10} className="text-accent shrink-0" />
                            <span className="truncate">{location.name}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
               </div>
             </div>
             
            <div className="h-6 w-px bg-slate-600/30 mx-2" />

            <a
                href="tel:7207374607"
                className={cn(
                  "flex items-center gap-2 font-bold px-3 py-2 rounded-lg transition-all hover:opacity-80 bg-white/10 border border-white/10",
                  "text-white"
                )}
              >
                <Phone size={14} className="text-accent" />
                <span className="text-[10px] tracking-wide hidden xl:inline-block">Call Us</span>
              </a>

            <button
              onClick={onGetQuote}
              className="bg-accent text-white px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] hover:bg-green-600 transition-all shadow-lg shadow-accent/20 hover:-translate-y-0.5 active:translate-y-0"
            >
              Get Quote
            </button>
          </div>

          {/* Mobile Toggle */}
          <button
            className={cn(
              "lg:hidden p-2 rounded-xl transition-all z-[120] active:scale-95",
              "text-white bg-white/10 backdrop-blur-md border border-white/10"
            )}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-menu"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] lg:hidden transition-opacity duration-300",
          isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* Mobile Menu Drawer */}
      <div 
        id="mobile-menu"
        className={cn(
          "fixed top-0 right-0 h-full w-[85%] max-w-[360px] bg-white z-[110] shadow-2xl transition-transform duration-300 ease-out lg:hidden flex flex-col border-l border-slate-100",
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex flex-col h-full pt-28 px-8 pb-10">
           <div className="flex flex-col mb-8">
              <span className="text-2xl font-black text-slate-900 tracking-tighter leading-none">SOCIALBLUEPRO</span>
               <span className="text-xs uppercase tracking-[0.4em] font-black text-accent-accessible mt-1 block">Landscaping</span>
           </div>

              <div className="space-y-1 flex-1">
                 {[
                   { label: "Services", href: "/services" },
                   { label: "About", href: "/about" },
                   { label: "Contact", href: "/contact" },
                   { label: "FAQ", href: "/faq" }
                 ].map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="flex justify-between items-center text-xl font-bold text-slate-800 hover:text-accent transition-colors py-4 border-b border-slate-50 group"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.label}
                    <ChevronRight size={18} className="text-slate-300 group-hover:text-accent transition-colors" />
                  </Link>
                ))}
              </div>

           <div className="space-y-6">
             <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
               <a href="tel:7207374607" className="flex items-center gap-4 text-slate-900 group">
                 <div className="w-12 h-12 bg-accent text-white rounded-full flex items-center justify-center shadow-lg shadow-accent/20 group-hover:scale-110 transition-transform">
                   <Phone size={20} />
                 </div>
                 <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Call Us Now</span>
                    <span className="font-black text-xl tracking-tight leading-none group-hover:text-accent transition-colors">(720) 737-4607</span>
                 </div>
               </a>
             </div>
             
             <button
               onClick={() => { setIsMobileMenuOpen(false); onGetQuote(); }}
               className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl active:scale-95 transition-transform hover:bg-slate-800"
             >
               Get Free Estimate
             </button>
           </div>
        </div>
      </div>
    </>
  );
}
