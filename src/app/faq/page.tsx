"use client";

import { useState } from "react";
import dynamic from 'next/dynamic';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackToTop from "@/components/ui/BackToTop";
import { ChevronDown, HelpCircle } from "lucide-react";
import { IMAGES } from "@/lib/constants";

const QuoteModal = dynamic(
  () => import('@/components/ui/QuoteModal'),
  { ssr: false }
);

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  category: string;
  items: FAQItem[];
}

const faqData: FAQCategory[] = [
  {
    category: "General",
    items: [
      {
        question: "Do you offer financing?",
        answer: "Yes, we offer flexible financing options through third-party partners to make your landscaping project more affordable. We work with leading financing companies to provide competitive rates and terms. Contact us for more details."
      },
      {
        question: "What is your service area?",
        answer: "We proudly serve the entire Denver Metro area, including Denver, Aurora, Centennial, Parker, Littleton, Highlands Ranch, Lakewood, Wheat Ridge, Golden, and Arvada. We also cover surrounding cities within a 30-mile radius."
      },
      {
        question: "Do you provide free estimates?",
        answer: "Absolutely! We offer completely free, no-obligation estimates for all projects. Our team will visit your property, assess the scope, and provide a detailed written estimate within 24-48 hours."
      },
      {
        question: "Are you licensed and insured?",
        answer: "Yes, SocialBluePro is fully licensed and carries comprehensive liability insurance. We prioritize safety and professionalism on every job site, giving you complete peace of mind."
      },
      {
        question: "How long have you been in business?",
        answer: "SocialBluePro was established in 2020 and has since completed over 500 landscaping projects across the Denver Metro area. Our 5-star rating reflects our commitment to quality and customer satisfaction."
      }
    ]
  },
  {
    category: "Sod Installation",
    items: [
      {
        question: "When is the best time to lay sod in Colorado?",
        answer: "The optimal times for sod installation in Colorado are early spring (March-April) and early fall (September-October). These seasons provide ideal temperatures and moisture levels for root establishment. We also install sod during summer with proper irrigation, but extra care is required."
      },
      {
        question: "How long does it take for sod to root?",
        answer: "Sod typically begins rooting within 7-14 days. Full root establishment usually occurs within 4-6 weeks. During the first two weeks, frequent light watering is crucial, followed by deeper, less frequent watering to encourage deep root growth."
      },
      {
        question: "Do I need to prepare my lawn before sod installation?",
        answer: "Proper site preparation is essential for successful sod. Our team handles all preparation: we remove existing weeds and dead grass, grade the area for proper drainage, till the soil to a depth of 4-6 inches, add topsoil if needed, and apply starter fertilizer. We'll let you know if any specific preparation is needed on your end."
      },
      {
        question: "How often should I water new sod?",
        answer: "For the first week: water 2-3 times daily for 10-15 minutes to keep the sod moist but not saturated. After week one: reduce to once daily for 15-20 minutes. Weeks 2-4: water every 2-3 days for deeper penetration. After one month: transition to normal lawn watering schedule (1-2 inches per week). Avoid watering in the evening to prevent fungal growth."
      },
      {
        question: "Is sod better than seed for Colorado lawns?",
        answer: "Sod provides an instant, mature lawn and is ideal for homeowners who want immediate results. It's also more resistant to erosion, weeds, and drought once established. Seeding is more economical but takes 6-12 months to achieve full coverage and requires more patience. For Colorado's harsh climate, sod offers faster establishment and higher success rates, especially in high-traffic areas."
      }
    ]
  },
  {
    category: "Hardscaping",
    items: [
      {
        question: "What types of hardscaping do you offer?",
        answer: "We specialize in a wide range of hardscaping services including paver patios, walkways, retaining walls, fire pits, outdoor kitchens, retaining walls, decorative stone installations, and gravel driveways. Our design team works with you to create functional, beautiful outdoor living spaces that complement your home."
      },
      {
        question: "How long does a typical hardscaping project take?",
        answer: "Project timelines vary based on scope. A small patio or walkway can take 2-3 days, while larger projects like multi-level patios with retaining walls and fire features may take 1-2 weeks. We provide a detailed timeline during the consultation and keep you updated throughout construction."
      },
      {
        question: "Do you obtain permits for hardscaping projects?",
        answer: "For most residential hardscaping projects under 200 sq ft, permits are not required. However, larger projects, retaining walls over 4 feet, or structures in certain municipalities may require permits. We handle all permit acquisition and ensure compliance with local building codes as part of our service."
      },
      {
        question: "What materials do you use for pavers and walls?",
        answer: "We work with premium material suppliers to offer a wide selection of pavers, natural stone, and concrete blocks. Our options include concrete pavers (various colors and textures), natural stone (limestone, sandstone), and segmental retaining wall systems. We help you choose materials that fit your budget, style, and Colorado's freeze-thaw climate."
      },
      {
        question: "Do you design hardscaping projects?",
        answer: "Yes! Our team includes experienced designers who create custom hardscaping layouts tailored to your property, needs, and aesthetic preferences. We provide 2D plans and can also generate 3D renderings (when requested) so you can visualize the final result before construction begins. Our design process is collaborative and we incorporate your feedback at every step."
      }
    ]
  },
  {
    category: "Maintenance",
    items: [
      {
        question: "Do you offer ongoing lawn and landscape maintenance?",
        answer: "Yes, we provide comprehensive maintenance packages tailored to your landscape's needs. Services include lawn mowing, trimming, edging, spring/fall cleanups, mulching, planting bed maintenance, irrigation system checks, and snow removal. We offer weekly, bi-weekly, or monthly plans to fit your schedule."
      },
      {
        question: "What does your basic maintenance service include?",
        answer: "Our standard maintenance package includes weekly lawn mowing, string trimming, edging of hardscape borders, removal of lawn clippings, and debris blowing. Optional add-ons include fertilization, weed control, aeration, shrub pruning, and seasonal color changes. We customize each plan based on your property size and specific needs."
      },
      {
        question: "How often should I schedule landscape maintenance?",
        answer: "During the growing season (April-October), we recommend weekly lawn mowing to maintain lawn health and appearance. For planting beds and shrubs, bi-weekly or monthly maintenance is typical. Spring and fall require special cleanups. We'll assess your property and recommend an optimal schedule during our consultation."
      },
      {
        question: "Can I cancel the maintenance service anytime?",
        answer: "Yes, our maintenance services are month-to-month with no long-term contracts. You can cancel anytime with 7 days' notice. We also offer seasonal adjustments—you can pause service during winter months if desired. Our goal is to provide flexible, reliable care that fits your lifestyle."
      },
      {
        question: "Do you handle seasonal cleanups and snow removal?",
        answer: "Definitely! We offer comprehensive spring cleanups (thatch removal, bed shaping, mulch installation) and fall cleanups (leaf removal, pruning, winter preparation). Our snow removal services include driveway and walkway clearing for residential properties. Snow removal can be added to your maintenance plan or scheduled per-event."
      }
    ]
  },
  {
    category: "Warranty & Support",
    items: [
      {
        question: "What warranty do you offer on sod installation?",
        answer: "We provide a 30-day replacement warranty on all sod installation work, provided you follow our recommended watering and care guidelines during the establishment period. If any sod fails to root due to installation issues, we'll replace it at no cost. Sod damaged by pets, pests, or improper watering is not covered."
      },
      {
        question: "What is your warranty on plants and landscaping?",
        answer: "All plants installed by SocialBluePro come with a 1-year warranty when enrolled in our maintenance program (or if you follow our care instructions). This includes replacement of plants that fail due to pre-existing conditions or improper installation. Annuals and perennials have a 90-day warranty. We stand behind the quality of our work and materials."
      },
      {
        question: "Are your hardscaping projects guaranteed?",
        answer: "Yes, we offer a 3-year workmanship warranty on all hardscaping projects, including pavers, retaining walls, and masonry work. This covers any settling, shifting, or structural issues due to installation errors. Materials themselves are covered by manufacturer warranties (typically 10-30 years). We ensure proper base preparation to prevent long-term issues."
      },
      {
        question: "What does your warranty NOT cover?",
        answer: "Our warranties do not cover damage from extreme weather events (hail, floods), improper homeowner maintenance, intentional damage, or Acts of God. They also exclude normal wear and tear, settling due to soil conditions beyond our control, and issues arising from alterations made after project completion. We'll clearly outline warranty terms in your contract."
      },
      {
        question: "How do I make a warranty claim?",
        answer: "If you experience an issue covered by our warranty, simply contact us by phone or email with photos and a description of the problem. We'll assess the situation within 48 hours and schedule repairs if the claim is valid. Warranty service is provided at no additional charge. Keep your original contract and receipts for any maintenance services to ensure coverage."
      }
    ]
  }
];

export default function FAQPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [openQuestion, setOpenQuestion] = useState<{category: string; question: string} | null>(null);

  const toggleCategory = (category: string) => {
    setOpenCategory(openCategory === category ? null : category);
    if (openQuestion?.category === category) {
      setOpenQuestion(null);
    }
  };

  const toggleQuestion = (category: string, question: string) => {
    if (openQuestion?.category === category && openQuestion?.question === question) {
      setOpenQuestion(null);
    } else {
      setOpenQuestion({ category, question });
      setOpenCategory(category);
    }
  };

  return (
    <main className="min-h-screen w-full relative bg-slate-50">
      <Navbar onGetQuote={() => setIsModalOpen(true)} />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 bg-slate-900 overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-40">
          <img
            src={IMAGES.hero}
            alt="Denver Landscaping FAQ"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900/60 to-slate-900" />
        </div>

        <div className="container mx-auto px-4 md:px-8 relative z-10 text-center">
          <span className="text-accent font-black tracking-widest uppercase text-xs mb-4 block">FAQ</span>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white tracking-tighter leading-[1.1] uppercase mb-6">
            Frequently <br />
            <span className="text-accent italic">Asked Questions.</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto font-medium leading-relaxed mb-10">
            Find answers to common questions about our landscaping services, warranties, and processes. Can't find what you need? Contact us directly.
          </p>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 md:px-8 max-w-4xl">
          <div className="space-y-6">
            {faqData.map((categoryData) => (
              <div key={categoryData.category} className="border-b border-slate-200 last:border-b-0">
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(categoryData.category)}
                  className="w-full flex items-center justify-between py-6 text-left"
                  aria-expanded={openCategory === categoryData.category}
                >
                  <h2 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight">
                    {categoryData.category}
                  </h2>
                  <ChevronDown
                    size={24}
                    className={`text-accent transition-transform duration-300 ${
                      openCategory === categoryData.category ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Questions List */}
                {openCategory === categoryData.category && (
                  <div className="space-y-4 pb-8">
                    {categoryData.items.map((item, index) => {
                      const isOpen = openQuestion?.category === categoryData.category && openQuestion?.question === item.question;
                      return (
                        <div
                          key={`${categoryData.category}-${index}`}
                          className="border border-slate-200 rounded-xl overflow-hidden transition-all"
                        >
                          <button
                            onClick={() => toggleQuestion(categoryData.category, item.question)}
                            className="w-full flex items-center justify-between p-5 text-left bg-slate-50 hover:bg-slate-100 transition-colors"
                            aria-expanded={isOpen}
                          >
                            <span className="font-bold text-slate-900 pr-4">{item.question}</span>
                            <ChevronDown
                              size={18}
                              className={`text-accent shrink-0 transition-transform duration-300 ${
                                isOpen ? 'rotate-180' : ''
                              }`}
                            />
                          </button>
                          {isOpen && (
                            <div className="p-5 bg-white border-t border-slate-200">
                              <p className="text-slate-600 leading-relaxed">{item.answer}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-slate-900">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <HelpCircle size={48} className="text-accent mx-auto mb-6" />
            <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter mb-8">
              Still Have Questions?
            </h2>
            <p className="text-slate-300 text-lg mb-10 leading-relaxed">
              Our team is ready to help you plan your perfect outdoor space. Get in touch for personalized advice and a free estimate.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-3 bg-accent text-white px-10 py-5 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-green-600 transition-all shadow-2xl shadow-accent/20 active:scale-95 group"
            >
              Get Your Free Quote
            </button>
          </div>
        </div>
      </section>

      <Footer onGetQuote={() => setIsModalOpen(true)} />
      <QuoteModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <BackToTop />

      {/* FAQPage Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": faqData.flatMap(category =>
              category.items.map(item => ({
                "@type": "Question",
                "name": item.question,
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": item.answer
                }
              }))
            )
          })
        }}
      />
    </main>
  );
}
