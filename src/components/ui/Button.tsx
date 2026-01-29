import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { ButtonHTMLAttributes, ReactNode } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "success";
  size?: "xs" | "sm" | "md" | "lg";
  loading?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
}

export default function Button({
  children,
  className,
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  icon,
  fullWidth = false,
  ...props
}: ButtonProps) {
  const variantClasses = {
    primary: "bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-dark)] shadow-lg shadow-[var(--color-accent)]/20",
    secondary: "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200",
    danger: "bg-[var(--color-error)] text-white hover:bg-[var(--color-error-dark)] shadow-lg shadow-[var(--color-error)]/20",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100 border border-transparent",
    success: "bg-[var(--color-success)] text-white hover:bg-[var(--color-success-dark)] shadow-lg shadow-[var(--color-success)]/20",
  }[variant];

  const sizeClasses = {
    xs: "px-3 py-1.5 text-[10px]",
    sm: "px-4 py-2 text-xs",
    md: "px-6 py-3 text-xs",
    lg: "px-8 py-4 text-sm",
  }[size];

  return (
    <button
      className={cn(
        "flex items-center gap-2 rounded-xl font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
        variantClasses,
        sizeClasses,
        fullWidth && "w-full justify-center",
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="animate-spin" size={size === "xs" ? 12 : size === "sm" ? 14 : 16} />}
      {!loading && icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
}