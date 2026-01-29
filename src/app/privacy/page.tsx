"use client";

import { Shield, FileText, Lock, CheckCircle, Eye, AlertCircle, Mail, Phone } from "lucide-react";
import SimpleFooter from "@/components/SimpleFooter";
import NavbarLayout from "@/components/NavbarLayout";

export default function PrivacyPage() {
  return (
    <NavbarLayout>
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 md:px-8 py-16 md:py-24 w-full max-w-3xl pt-32 md:pt-40">
          <div className="mb-12">
            <span className="text-accent font-black tracking-widest uppercase text-[10px] block">Privacy Policy</span>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none mt-4 mb-8 uppercase">
              Privacy <br />
              <span className="text-accent italic">Policy.</span>
            </h1>
            <p className="text-slate-600 mb-8 text-lg leading-relaxed">
              At SocialBluePro, we are committed to protecting your privacy and ensuring transparency in how we handle your information.
            </p>
          </div>

          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                <Shield className="text-accent" size={20} />
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">What Information We Collect</h2>
            </div>
            <div className="bg-slate-50 rounded-xl p-6 md:p-8 border border-slate-200">
              <p className="text-slate-700 mb-4 leading-relaxed">
                We collect information you provide directly to us when you request our services, subscribe to newsletters, or contact us. This includes:
              </p>
              <ul className="space-y-3 list-disc list-inside text-slate-700 ml-6">
                <li>Name and contact information</li>
                <li>Project details - service type, property size, specific requirements</li>
                <li>Preferences - communication preferences and scheduling needs</li>
              </ul>
            </div>
          </div>

          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                <FileText className="text-accent" size={20} />
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">How We Use Your Information</h2>
            </div>
            <div className="bg-slate-50 rounded-xl p-6 md:p-8 border border-slate-200">
              <p className="text-slate-700 mb-4 leading-relaxed">
                We use your information to provide requested services, communicate about your projects, and improve our offerings. We do not sell or share your personal information with third parties for marketing purposes.
              </p>
              <div className="bg-white p-4 rounded-lg border border-slate-100 mt-6">
                <p className="text-slate-900 font-medium leading-relaxed">
                  <strong className="text-accent">Important:</strong> Your information is used solely for service delivery and customer support.
                </p>
              </div>
            </div>
          </div>

          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                <Lock className="text-accent" size={20} />
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Data Security</h2>
            </div>
            <div className="bg-slate-50 rounded-xl p-6 md:p-8 border border-slate-200">
              <p className="text-slate-700 mb-4 leading-relaxed">
                We implement reasonable security measures to protect your personal information. This includes encryption, secure servers, and access controls.
              </p>
              <div className="grid md:grid-cols-2 gap-4 mt-6">
                <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-slate-100">
                  <CheckCircle className="text-accent shrink-0" size={18} />
                  <div>
                    <p className="font-black text-slate-900 text-sm">SSL Encryption</p>
                    <p className="text-slate-600 text-xs">Secure data transmission</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-slate-100">
                  <CheckCircle className="text-accent shrink-0" size={18} />
                  <div>
                    <p className="font-black text-slate-900 text-sm">Secure Servers</p>
                    <p className="text-slate-600 text-xs">Protected infrastructure</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                <Eye className="text-accent" size={20} />
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Your Rights</h2>
            </div>
            <div className="bg-slate-50 rounded-xl p-6 md:p-8 border border-slate-200">
              <p className="text-slate-700 mb-4 leading-relaxed">
                You have right to access, correct, or delete your personal information at any time. Contact us at <strong className="text-accent">contact@socialbluepro.com</strong> for any privacy-related requests.
              </p>
            </div>
          </div>

          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                <AlertCircle className="text-accent" size={20} />
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Cookies</h2>
            </div>
            <div className="bg-slate-50 rounded-xl p-6 md:p-8 border border-slate-200">
              <p className="text-slate-700 mb-4 leading-relaxed">
                We use cookies to enhance your browsing experience and analyze site traffic. You may disable cookies through your browser settings, but this may limit some functionality.
              </p>
            </div>
          </div>

          <div className="mb-12">
            <div className="text-center mb-6">
              <p className="text-slate-900 text-lg font-medium mb-2">
                Have questions about this privacy policy or our data practices?
              </p>
              <p className="text-slate-500 text-sm mb-6">
                Contact us at any time and we'll be happy to help.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
              <a href="mailto:contact@socialbluepro.com" className="flex items-center gap-3 bg-slate-50 text-slate-900 rounded-xl p-4 hover:bg-accent/10 hover:border-accent/30 transition-all group border border-slate-200">
                <Mail className="text-accent group-hover:scale-110 transition-transform" size={20} />
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Email</p>
                  <p className="text-slate-900 font-black text-sm">contact@socialbluepro.com</p>
                </div>
              </a>
              <a href="tel:7207374607" className="flex items-center gap-3 bg-slate-50 text-slate-900 rounded-xl p-4 hover:bg-accent/10 hover:border-accent/30 transition-all group border border-slate-200">
                <Phone className="text-accent group-hover:scale-110 transition-transform" size={20} />
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Phone</p>
                  <p className="text-slate-900 font-black text-sm">(720) 737-4607</p>
                </div>
              </a>
            </div>
          </div>

          <p className="text-slate-500 text-xs font-medium text-center mt-6">
            This policy was last updated on {new Date().toLocaleDateString()} and may be revised from time to time.
          </p>
        </div>

        <SimpleFooter />
      </div>
    </NavbarLayout>
  );
}