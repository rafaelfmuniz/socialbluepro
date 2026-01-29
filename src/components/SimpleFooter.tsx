"use client";

import Link from "next/link";

export default function SimpleFooter() {
  return (
    <div className="bg-slate-50 border-t border-slate-200 py-8">
      <div className="container mx-auto px-4 md:px-8 w-full max-w-7xl">
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-accent font-bold transition-colors text-sm uppercase tracking-widest"
        >
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}
