"use client";

import { useState } from "react";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ServiceData } from "@/lib/services-data";
import { CheckCircle2, ArrowRight, HelpCircle, ChevronDown, ChevronUp } from "lucide-react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import BackToTop from "@/components/ui/BackToTop";

const QuoteModal = dynamic(
  () => import('@/components/ui/QuoteModal'),
  { ssr: false }
);

interface ServicePageClientProps {
  service: ServiceData;
}

export default function ServicePageClient({ service }: ServicePageClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  // Structured Data (JSON-LD) for SEO
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": service.faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  const businessSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": service.title,
    "provider": {
      "@type": "LocalBusiness",
      "name": "SocialBluePro",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Denver",
        "addressRegion": "CO"
      }
    },
    "description": service.metaDescription,
    "image": service.image
  };

  return (
    <main className="min-h-screen bg-white">
      {/* Schema Injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(businessSchema) }}
      />

      <Navbar onGetQuote={() => setIsModalOpen(true)} />

      {/* Hero Section */}
      <section className="relative h-[60vh] md:h-[70vh] flex items-center justify-center overflow-hidden">
        <Image
          src={service.image}
          alt={service.title}
          fill
          className="object-cover"
          priority
          quality={90}
        />
        <div className="absolute inset-0 bg-slate-900/60" />
        <div className="container mx-auto px-6 relative z-10 text-center">
          <div className="max-w-3xl mx-auto">
            <span className="text-accent font-black tracking-widest uppercase text-xs mb-4 block animate-fade-in">
              Professional {service.title}
            </span>
            <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tighter leading-tight">
              {service.heroHeadline}
            </h1>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-accent hover:bg-green-600 text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest text-sm transition-all shadow-xl shadow-accent/20 active:scale-95"
            >
              Get a Free Estimate
            </button>
          </div>
        </div>
      </section>

      {/* Overview Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-6 tracking-tight">
                Transforming Your <span className="text-accent italic">Colorado Property.</span>
              </h2>
              <p className="text-slate-600 leading-relaxed mb-8 text-lg">
                {service.description}
              </p>
              
              <div className="space-y-4">
                {service.benefits.map((benefit, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <CheckCircle2 className="text-accent shrink-0 mt-1" size={20} />
                    <span className="text-slate-700 font-medium">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 shadow-sm sticky top-32">
              <h3 className="text-xl font-black text-slate-900 mb-6 uppercase tracking-wider">
                Our Professional Process
              </h3>
              <div className="space-y-8">
                {service.process.map((step, idx) => (
                  <div key={idx} className="relative flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 bg-accent text-white rounded-full flex items-center justify-center font-black text-xs shrink-0 z-10">
                        {idx + 1}
                      </div>
                      {idx !== service.process.length - 1 && (
                        <div className="w-px h-full bg-slate-200 absolute top-8 bottom-0" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 mb-1 uppercase text-sm tracking-tight">
                        {step.title}
                      </h4>
                      <p className="text-slate-500 text-sm leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-24 bg-slate-50">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 tracking-tight">
              Common <span className="text-accent">Questions.</span>
            </h2>
            <p className="text-slate-500 font-medium">
              Everything you need to know about our {service.title.toLowerCase()} services.
            </p>
          </div>

          <div className="space-y-4">
            {service.faqs.map((faq, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden transition-all"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-6 text-left flex justify-between items-center hover:bg-slate-50 transition-colors"
                >
                  <span className="font-bold text-slate-900 pr-8">{faq.question}</span>
                  {openFaq === idx ? (
                    <ChevronUp className="text-accent shrink-0" size={20} />
                  ) : (
                    <ChevronDown className="text-slate-400 shrink-0" size={20} />
                  )}
                </button>
                <div
                  className={cn(
                    "px-6 transition-all duration-300 ease-in-out",
                    openFaq === idx ? "pb-6 max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                  )}
                >
                  <p className="text-slate-600 leading-relaxed">{faq.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-accent" />
        <div className="container mx-auto px-6 text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-black mb-8 tracking-tighter">
            Ready for a <span className="text-accent italic">Total Transformation?</span>
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto mb-10 text-lg">
            Join hundreds of satisfied Denver homeowners. Get your professional estimate and start your project today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-accent hover:bg-green-600 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-xl shadow-accent/20 active:scale-95 flex items-center justify-center gap-2"
            >
              Request Free Quote <ArrowRight size={18} />
            </button>
            <a
              href="tel:7207374607"
              className="bg-white/10 hover:bg-white/20 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-sm transition-all border border-white/10 active:scale-95"
            >
              Call (720) 737-4607
            </a>
          </div>
        </div>
      </section>

      <Footer onGetQuote={() => setIsModalOpen(true)} />

      <QuoteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialService={service.title}
      />

      <BackToTop />
    </main>
  );
}
