"use client";

import { useState } from "react";
import { AlertTriangle, X, ShieldAlert, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

interface DefaultPasswordWarningProps {
  userId: string;
}

export function DefaultPasswordWarning({ userId }: DefaultPasswordWarningProps) {
  const [isVisible, setIsVisible] = useState(true);
  const router = useRouter();

  const handleUpdatePassword = () => {
    console.log('[DefaultPasswordWarning] Update password clicked, userId:', userId);
    console.log('[DefaultPasswordWarning] Navigating to:', `/admin/settings?changePasswordFor=${userId}`);
    router.push(`/admin/settings?changePasswordFor=${userId}`);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-4 left-4 right-4 z-[100] md:left-auto md:right-4 md:w-96"
      >
        <div className="bg-white border-2 border-amber-100 shadow-2xl rounded-3xl overflow-hidden">
          <div className="bg-amber-50 px-6 py-4 border-b border-amber-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-700">
              <ShieldAlert size={20} className="animate-pulse" />
              <span className="text-xs font-black uppercase tracking-widest">Security Alert</span>
            </div>
            <button 
              onClick={() => setIsVisible(false)}
              className="p-1 hover:bg-amber-100 rounded-full transition-colors text-amber-400"
            >
              <X size={18} />
            </button>
          </div>
          
          <div className="p-6">
            <h3 className="text-slate-900 font-black text-lg leading-tight mb-2">
              Default Password Detected
            </h3>
            <p className="text-slate-500 text-sm font-medium mb-6 leading-relaxed">
              You are currently using a default system password. For your security, please update it immediately to protect your administrative access.
            </p>
            
            <button 
              onClick={handleUpdatePassword}
              className="group w-full bg-slate-900 text-white font-black py-4 px-6 rounded-2xl flex items-center justify-between hover:bg-slate-800 transition-all text-xs uppercase tracking-widest"
            >
              <span>Update Password</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
