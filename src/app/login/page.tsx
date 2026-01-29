"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, User, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { IMAGES } from "@/lib/constants";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const [lockedUntil, setLockedUntil] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        if (data.warning) {
          setWarning(data.warning);
        }
        router.push("/admin");
        router.refresh();
      } else {
        setError(data.error || "Invalid credentials or account locked.");
        setAttemptsRemaining(data.attemptsRemaining || null);
        setLockedUntil(data.lockedUntil || null);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute inset-0 z-0 opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500 blur-[120px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white p-8 md:p-12 relative z-10 border border-slate-100 rounded-[2.5rem] shadow-2xl"
      >
        <div className="text-center mb-10">
          <div className="inline-flex p-4 mb-4 bg-slate-50 rounded-2xl">
             <img 
               src={IMAGES.logoColor || "/imgs/Imgs_WEBP/logo.webp"}
               alt="SocialBluePro" 
               width={48}
               height={48}
               className="h-12 w-auto"
               onError={(e) => {
                 (e.target as HTMLImageElement).src = "/imgs/Imgs_WEBP/logo.webp";
               }}
             />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase mb-1">Admin Access</h1>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">SocialBluePro Portal</p>
        </div>

        {lockedUntil && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-50 text-red-600 p-4 rounded-2xl mb-8 text-xs font-bold text-center border border-red-100 flex items-center gap-2"
          >
            <Lock size={14} /> Account locked. Try again later or reset password.
          </motion.div>
        )}

        {warning && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-amber-50 text-amber-700 p-4 rounded-2xl mb-8 text-xs font-bold text-center border border-amber-100 flex items-center gap-2"
          >
            <AlertTriangle size={14} /> {warning}
          </motion.div>
        )}

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-50 text-red-600 p-4 rounded-2xl mb-8 text-xs font-bold text-center border border-red-100 flex items-center justify-center gap-2"
          >
            <Lock size={14} /> {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="relative group">
              <label className="text-[10px] uppercase tracking-widest font-black text-slate-400 mb-2 block ml-1">Email Address</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-accent transition-colors" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-12 pr-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all text-slate-900 font-bold text-sm"
                  placeholder="user@domain.com"
                />
              </div>
            </div>

            <div className="relative group">
              <label className="text-[10px] uppercase tracking-widest font-black text-slate-400 mb-2 block ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-accent transition-colors" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-12 pr-12 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all text-slate-900 font-bold text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          {attemptsRemaining !== null && attemptsRemaining > 0 && !error && (
            <p className="text-xs text-amber-600 font-medium text-center mt-4">
              {attemptsRemaining} attempt{attemptsRemaining !== 1 ? 's' : ''} remaining
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !!lockedUntil}
            className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 hover:bg-slate-800 transition-all text-xs shadow-xl disabled:opacity-50 disabled:cursor-not-allowed mt-4 uppercase tracking-[0.2em] active:scale-[0.98]"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : "Unlock Dashboard"}
          </button>
        </form>

        {!showForgotPassword ? (
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setShowForgotPassword(true);
                setError("");
                setAttemptsRemaining(null);
                setLockedUntil(null);
              }}
              className="text-xs text-slate-500 hover:text-accent font-medium transition-colors"
            >
              Forgot Password?
            </button>
          </div>
        ) : (
          <div className="mt-6 p-6 bg-slate-50 rounded-2xl border border-slate-200">
            <h4 className="text-sm font-black text-slate-900 mb-4">Reset Password</h4>
            <div className="space-y-4">
              <input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              />
              <button
                onClick={async () => {
                  if (!resetEmail.trim() || !resetEmail.includes('@')) {
                    setError("Please enter a valid email");
                    return;
                  }
                  setResetLoading(true);
                  try {
                    const response = await fetch("/api/login", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ email: resetEmail, password: "dummy", action: "reset" }),
                    });
                    const data = await response.json();
                    if (data.success) {
                      setResetSuccess(true);
                      setError("");
                    } else {
                      setError(data.error || "Failed to send reset email");
                    }
                  } catch (err) {
                    setError("An error occurred. Please try again.");
                  } finally {
                    setResetLoading(false);
                  }
                }}
                disabled={resetLoading}
                className="w-full bg-accent text-white font-black py-3 rounded-xl text-xs uppercase tracking-widest hover:bg-green-600 disabled:opacity-50"
              >
                {resetLoading ? <Loader2 className="animate-spin mx-auto" size={16} /> : resetSuccess ? "Email Sent!" : "Send Reset Link"}
              </button>
              {resetSuccess && (
                <p className="text-xs text-green-600 text-center">
                  Check your inbox for temporary password
                </p>
              )}
              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(false);
                  setResetEmail("");
                  setResetSuccess(false);
                }}
                className="w-full text-xs text-slate-500 hover:text-slate-700 font-medium"
              >
                Back to Login
              </button>
            </div>
          </div>
        )}

        <div className="mt-10 pt-8 border-t border-slate-50">
          <p className="text-center text-[9px] text-slate-300 font-bold uppercase tracking-[0.2em]">
            &copy; {new Date().getFullYear()} SocialBluePro Landscaping
          </p>
        </div>
      </motion.div>
    </div>
  );
}
