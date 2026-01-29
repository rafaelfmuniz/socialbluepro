"use client";

import { FileText, CheckCircle, Scale, AlertTriangle } from "lucide-react";
import SimpleFooter from "@/components/SimpleFooter";
import NavbarLayout from "@/components/NavbarLayout";

export default function TermsPage() {
  return (
    <NavbarLayout>
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 md:px-8 py-16 md:py-24 w-full max-w-3xl pt-32 md:pt-40">
          <div className="mb-12">
            <span className="text-accent font-black tracking-widest uppercase text-[10px] block">Terms of Service</span>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none mt-4 mb-8 uppercase">
              Terms of<br />
              <span className="text-accent italic">Service.</span>
            </h1>
            <p className="text-slate-600 mb-8 text-lg leading-relaxed">
              By using SocialBluePro services, you agree to these terms and conditions. Please read them carefully.
            </p>
          </div>

          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                <FileText className="text-accent" size={20} />
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Services</h2>
            </div>
            <div className="bg-slate-50 rounded-xl p-6 md:p-8 border border-slate-200">
              <p className="text-slate-700 mb-4 leading-relaxed">
                SocialBluePro provides professional landscaping services including sod installation, decorative rock, mulch, hardscaping, and snow removal. All services are subject to availability and local conditions.
              </p>
              <ul className="space-y-3 list-disc list-inside text-slate-700 ml-6">
                <li>One-time landscaping services</li>
                <li>Seasonal snow removal</li>
                <li>Outdoor maintenance solutions</li>
              </ul>
            </div>
          </div>

          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                <CheckCircle className="text-accent" size={20} />
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Booking & Payment</h2>
            </div>
            <div className="bg-slate-50 rounded-xl p-6 md:p-8 border border-slate-200">
              <p className="text-slate-700 mb-4 leading-relaxed">
                All service bookings require a deposit or full payment as agreed upon. Final payment is due upon completion of services unless otherwise arranged.
              </p>
              <div className="bg-white p-4 rounded-lg border border-slate-100 mt-6">
                <p className="text-slate-900 font-medium leading-relaxed">
                  <strong className="text-accent">Note:</strong> Cancellations must be made at least 48 hours before scheduled service to avoid cancellation fees.
                </p>
              </div>
            </div>
          </div>

          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                <Scale className="text-accent" size={20} />
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Liability & Warranty</h2>
            </div>
            <div className="bg-slate-50 rounded-xl p-6 md:p-8 border border-slate-200">
              <p className="text-slate-700 mb-4 leading-relaxed">
                SocialBluePro is not liable for damages beyond our control including weather conditions, underground utilities, or pre-existing property conditions. We stand behind our work with a satisfaction guarantee for specified services.
              </p>
            </div>
          </div>

          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                <AlertTriangle className="text-accent" size={20} />
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Property Access</h2>
            </div>
            <div className="bg-slate-50 rounded-xl p-6 md:p-8 border border-slate-200">
              <p className="text-slate-700 mb-4 leading-relaxed">
                Clients must provide safe and reasonable access to the property for service completion. This includes accessible parking areas, clear pathways, and utility locations.
              </p>
            </div>
          </div>

          <p className="text-slate-500 text-xs font-medium text-center mt-6">
            These terms were last updated on {new Date().toLocaleDateString()} and may be revised from time to time.
          </p>
        </div>

        <SimpleFooter />
      </div>
    </NavbarLayout>
  );
}