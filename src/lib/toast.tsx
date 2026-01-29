"use client";

import React, { useState } from "react";
import { CheckCircle, X, AlertTriangle, Info } from "lucide-react";

export interface ToastItem {
  id: string;
  message: string;
  type: "success" | "error" | "warning" | "info";
  duration?: number;
}

export interface ToastContextType {
  toasts: ToastItem[];
  addToast: (message: string, type?: ToastItem["type"], duration?: number) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export interface ToastProviderProps {
  children: React.ReactNode;
  maxToasts?: number;
}

const toastConfig = {
  success: {
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
    title: "Success",
    titleColor: "text-green-700"
  },
  error: {
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
    title: "Error",
    titleColor: "text-red-700"
  },
  warning: {
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    title: "Warning",
    titleColor: "text-amber-700"
  },
  info: {
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    title: "Info",
    titleColor: "text-blue-700"
  }
};

function ToastItem({ toast, onRemove }: { toast: ToastItem; onRemove: (id: string) => void }) {
  const [isExiting, setIsExiting] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onRemove(toast.id), 300);
    }, toast.duration || 5000);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  const config = toastConfig[toast.type];
  const IconComponent = toast.type === 'success' ? CheckCircle : 
                       toast.type === 'error' ? X :
                       toast.type === 'warning' ? AlertTriangle : Info;

  return (
    <div
      className={`fixed top-4 right-4 z-[9999] transition-all duration-300 ease-in-out ${
        isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'
      }`}
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden max-w-sm w-full animate-slide-up">
        <div className="p-5">
          <div className="flex items-start gap-4">
            <div className={`flex-shrink-0 w-12 h-12 rounded-2xl ${config.iconBg} ${config.iconColor} flex items-center justify-center`}>
              <IconComponent size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className={`text-xs font-black uppercase tracking-widest mb-1 ${config.titleColor}`}>
                {config.title}
              </h4>
              <p className="text-sm font-bold text-slate-700 leading-snug break-words">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => {
                setIsExiting(true);
                setTimeout(() => onRemove(toast.id), 300);
              }}
              className="flex-shrink-0 p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Dismiss notification"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ToastProvider({ children, maxToasts = 3 }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const clearToasts = () => {
    setToasts([]);
  };

  const addToast = (message: string, type: ToastItem["type"] = "info", duration = 5000) => {
    const id = Date.now().toString(36) + Math.random().toString(36).substring(2);
    const newToast: ToastItem = { id, message, type, duration };

    setToasts(prev => {
      const updated = [...prev, newToast];
      if (updated.length > maxToasts) {
        return updated.slice(-maxToasts);
      }
      return updated;
    });

    return id;
  };

  const providerValue: ToastContextType = {
    toasts,
    addToast,
    removeToast,
    clearToasts
  };

  return (
    <>
      <ToastContext.Provider value={providerValue}>
        {children}
      </ToastContext.Provider>
      <div className="fixed top-0 right-0 p-4 z-[9999] pointer-events-none">
        <div className="flex flex-col gap-3 pointer-events-auto">
          {toasts.map(toast => (
            <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
          ))}
        </div>
      </div>
      <style jsx global>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
