"use client";

import { useState, useEffect } from "react";
import { CheckCircle, X, AlertCircle, AlertTriangle, Info } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastProps {
  id?: string;
  message: string;
  type?: ToastType;
  duration?: number;
  onClose?: () => void;
}

const toastConfig = {
  success: {
    bg: "bg-gradient-to-r from-green-50 to-emerald-50",
    border: "border-green-200",
    text: "text-green-800",
    icon: <CheckCircle className="w-5 h-5 text-green-600" />
  },
  error: {
    bg: "bg-gradient-to-r from-red-50 to-rose-50",
    border: "border-red-200",
    text: "text-red-800",
    icon: <X className="w-5 h-5 text-red-600" />
  },
  warning: {
    bg: "bg-gradient-to-r from-amber-50 to-yellow-50",
    border: "border-amber-200",
    text: "text-amber-800",
    icon: <AlertTriangle className="w-5 h-5 text-amber-600" />
  },
  info: {
    bg: "bg-gradient-to-r from-blue-50 to-sky-50",
    border: "border-blue-200",
    text: "text-blue-800",
    icon: <Info className="w-5 h-5 text-blue-600" />
  }
};

export default function Toast({
  id: _id,
  message,
  type = "info",
  duration = 5000,
  onClose
}: ToastProps) {
  void _id;
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    setIsVisible(true);

    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => onClose?.(), 300);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  if (!isVisible) return null;

  const config = toastConfig[type];

  return (
    <div
      className={`fixed top-4 right-4 z-[9999] transition-all duration-300 ease-in-out ${
        isExiting ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'
      }`}
    >
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg max-w-md ${config.bg} ${config.border} border`}>
        <div className="flex-shrink-0 animate-in fade-in slide-in-from-left-2 duration-300">
          {config.icon}
        </div>
        <div className={`flex-1 font-bold text-sm ${config.text} animate-in fade-in slide-in-from-left-3 duration-300 delay-75`}>
          {message}
        </div>
        {onClose && (
          <button
            onClick={() => {
              setIsExiting(true);
              setTimeout(() => onClose(), 300);
            }}
            className="flex-shrink-0 ml-2 text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Dismiss notification"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
