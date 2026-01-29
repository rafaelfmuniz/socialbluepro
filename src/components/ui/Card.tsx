import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg" | "xl";
  rounded?: "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "full";
  border?: boolean;
  shadow?: "none" | "sm" | "md" | "lg" | "xl" | "2xl";
  backgroundColor?: "white" | "slate-50" | "transparent";
}

export default function Card({
  children,
  className,
  padding = "md",
  rounded = "xl",
  border = true,
  shadow = "md",
  backgroundColor = "white",
}: CardProps) {
  const paddingClasses = {
    none: "p-0",
    sm: "p-3",
    md: "p-5",
    lg: "p-6",
    xl: "p-8",
  }[padding];

  const roundedClasses = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    "2xl": "rounded-2xl",
    "3xl": "rounded-3xl",
    full: "rounded-full",
  }[rounded];

  const shadowClasses = {
    none: "shadow-none",
    sm: "shadow-sm",
    md: "shadow-md",
    lg: "shadow-lg",
    xl: "shadow-xl",
    "2xl": "shadow-2xl",
  }[shadow];

  const backgroundColorClasses = {
    white: "bg-white",
    "slate-50": "bg-slate-50",
    transparent: "bg-transparent",
  }[backgroundColor];

  return (
    <div
      className={cn(
        backgroundColorClasses,
        paddingClasses,
        roundedClasses,
        border && "border border-[var(--color-border-light)]",
        shadowClasses,
        className
      )}
    >
      {children}
    </div>
  );
}