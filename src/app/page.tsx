"use client";

import { useState, useEffect } from "react";
import dynamic from 'next/dynamic';
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import AboutSection from "@/components/sections/AboutSection";
import Footer from "@/components/Footer";
import BackToTop from "@/components/ui/BackToTop";

const QuoteModal = dynamic(
  () => import('@/components/ui/QuoteModal'),
  { 
    ssr: false,
    loading: () => <div className="hidden" />
  }
);

const Testimonials = dynamic(() => import("@/components/Testimonials"));
const ServiceArea = dynamic(() => import("@/components/ServiceArea"));
const LeadMagnet = dynamic(() => import("@/components/LeadMagnet"));

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<string | undefined>(undefined);

  const openModal = (service?: string) => {
    setSelectedService(service);
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (typeof document === 'undefined' || typeof localStorage === 'undefined') return;

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !localStorage.getItem("modalShown_v3")) {
        openModal();
        localStorage.setItem("modalShown_v3", "true");
      }
    };

    const timer = setTimeout(() => {
      if (!localStorage.getItem("modalShown_v3")) {
        openModal();
        localStorage.setItem("modalShown_v3", "true");
      }
    }, 45000);

    document.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      document.removeEventListener("mouseleave", handleMouseLeave);
      clearTimeout(timer);
    };
  }, []);

  return (
    <main className="min-h-screen w-full relative">
      <Navbar onGetQuote={() => openModal()} />
      
      <Hero onGetQuote={() => openModal()} />
      
      <Services onSelectService={(s: string) => openModal(s)} />
      
      <AboutSection onGetQuote={() => openModal()} />
      
      <ServiceArea onGetQuote={() => openModal()} />
      
      <Testimonials />
      
      <LeadMagnet onGetQuote={() => openModal()} />
      
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
