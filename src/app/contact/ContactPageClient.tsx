"use client";

import { useState } from "react";
import dynamic from 'next/dynamic';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackToTop from "@/components/ui/BackToTop";
import { Mail, Phone, Clock, Send, Loader2 } from "lucide-react";
import { submitContactForm } from "@/actions/contact";
import { useToast } from "@/lib/toast";

const QuoteModal = dynamic(
  () => import('@/components/ui/QuoteModal'),
  { ssr: false }
);

export default function ContactPageClient() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useToast();
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const result = await submitContactForm(formData);
      if (result.success) {
        addToast(result.message || "Message sent successfully!", "success");
        setFormData({ name: "", email: "", phone: "", message: "" });
      } else {
        addToast(result.error || "Failed to send message.", "error");
      }
    } catch (error) {
      addToast("An unexpected error occurred.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen w-full relative bg-slate-50">
      <Navbar onGetQuote={() => setIsModalOpen(true)} />
      
      <section className="pt-32 pb-12 bg-slate-900">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter mb-4">
            Get in <span className="text-accent italic">Touch.</span>
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto font-medium">
            Have questions about a project or want to learn more about our services? We're here to help.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4 md:px-8 max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12">
            
            {/* Contact Info */}
            <div className="space-y-12">
              <div>
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-8">Contact Information</h2>
                <div className="space-y-6">
                  <a href="tel:7207374607" className="flex items-center gap-4 group">
                    <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-white transition-all">
                      <Phone size={20} />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Phone</span>
                      <span className="text-lg font-bold text-slate-900">(720) 737-4607</span>
                    </div>
                  </a>
                  <a href="mailto:contact@socialbluepro.com" className="flex items-center gap-4 group">
                    <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-white transition-all">
                      <Mail size={20} />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Email</span>
                      <span className="text-lg font-bold text-slate-900">contact@socialbluepro.com</span>
                    </div>
                  </a>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center text-accent">
                      <Clock size={20} />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Business Hours</span>
                      <span className="text-lg font-bold text-slate-900">Mon-Sat, 8am - 6pm</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-6">Service Areas</h2>
                <div className="flex flex-wrap gap-2">
                  {["Denver", "Aurora", "Centennial", "Parker", "Littleton", "Highlands Ranch", "Lakewood"].map((city) => (
                    <span key={city} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 shadow-sm">
                      {city}
                    </span>
                  ))}
                  <span className="px-4 py-2 bg-accent/10 border border-accent/20 rounded-lg text-sm font-bold text-accent">
                    & Surrounding Metro
                  </span>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-white p-8 md:p-10 rounded-3xl shadow-xl border border-slate-100">
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-8">Send a Message</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Name</label>
                    <input 
                      type="text" 
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Your Full Name"
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Phone</label>
                    <input 
                      type="tel" 
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="(720) 000-0000"
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all font-medium"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Email</label>
                  <input 
                    type="email" 
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="your@email.com"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Message</label>
                  <textarea 
                    rows={4}
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    placeholder="How can we help you?"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all font-medium resize-none"
                  ></textarea>
                </div>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-3 bg-slate-900 text-white py-5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  {isSubmitting ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>
                      Send Message
                      <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            </div>

          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="h-[400px] w-full bg-slate-200 relative grayscale hover:grayscale-0 transition-all duration-700">
         <iframe 
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d196235.8893922718!2d-105.10190505!3d39.7392358!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x876b80aa231f17cf%3A0x118ef4af2d49d0f!2sDenver%2C%20CO!5e0!3m2!1sen!2s!4v1700000000000!5m2!1sen!2s" 
          width="100%" 
          height="100%" 
          style={{ border: 0 }} 
          allowFullScreen 
          loading="lazy" 
          referrerPolicy="no-referrer-when-downgrade"
        ></iframe>
      </section>

      <Footer onGetQuote={() => setIsModalOpen(true)} />
      <QuoteModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <BackToTop />

      {/* LocalBusiness Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": "SocialBluePro Landscaping",
            "image": "https://socialbluepro.com/imgs/Imgs_WEBP/logo.webp",
            "telephone": "(720) 737-4607",
            "email": "contact@socialbluepro.com",
            "address": {
              "@type": "PostalAddress",
              "addressLocality": "Denver",
              "addressRegion": "CO",
              "addressCountry": "US"
            },
            "geo": {
              "@type": "GeoCoordinates",
              "latitude": 39.7392,
              "longitude": -104.9903
            },
            "url": "https://socialbluepro.com",
            "openingHoursSpecification": {
              "@type": "OpeningHoursSpecification",
              "dayOfWeek": [
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday"
              ],
              "opens": "08:00",
              "closes": "18:00"
            },
            "areaServed": "Denver Metro Area"
          })
        }}
      />
    </main>
  );
}
