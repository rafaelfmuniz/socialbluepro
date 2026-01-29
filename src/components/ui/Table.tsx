import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export interface TableProps {
  children: ReactNode;
  className?: string;
  border?: boolean;
  rounded?: "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
  shadow?: "none" | "sm" | "md" | "lg" | "xl" | "2xl";
}

export function Table({
  children,
  className,
  border = true,
  rounded = "xl",
  shadow = "none",
}: TableProps) {
  const roundedClasses = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    "2xl": "rounded-2xl",
    "3xl": "rounded-3xl",
  }[rounded];

  const shadowClasses = {
    none: "shadow-none",
    sm: "shadow-sm",
    md: "shadow-md",
    lg: "shadow-lg",
    xl: "shadow-xl",
    "2xl": "shadow-2xl",
  }[shadow];

  return (
    <div className={cn("overflow-hidden", roundedClasses, shadowClasses, className)}>
      <table className={cn(
        "w-full text-sm text-left",
        border && "border border-[var(--color-border-light)]"
      )}>
        {children}
      </table>
    </div>
  );
}

export interface TableHeaderProps {
  children: ReactNode;
  className?: string;
  backgroundColor?: "slate-50" | "white" | "transparent";
  textSize?: "xs" | "sm" | "base";
}

export function TableHeader({
  children,
  className,
  backgroundColor = "slate-50",
  textSize = "xs",
}: TableHeaderProps) {
  const bgClasses = {
    "slate-50": "bg-slate-50",
    white: "bg-white",
    transparent: "bg-transparent",
  }[backgroundColor];

  const textSizeClasses = {
    xs: "text-[10px]",
    sm: "text-xs",
    base: "text-sm",
  }[textSize];

  return (
    <thead className={cn(
      bgClasses,
      textSizeClasses,
      "text-slate-500 font-black uppercase tracking-widest",
      className
    )}>
      {children}
    </thead>
  );
}

export interface TableBodyProps {
  children: ReactNode;
  className?: string;
}

export function TableBody({ children, className }: TableBodyProps) {
  return (
    <tbody className={cn("divide-y divide-slate-100", className)}>
      {children}
    </tbody>
  );
}

export interface TableRowProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export function TableRow({ children, className, hover = true }: TableRowProps) {
  return (
    <tr className={cn(
      "transition-colors",
      hover && "hover:bg-slate-50/50",
      className
    )}>
      {children}
    </tr>
  );
}

export interface TableHeadProps {
  children: ReactNode;
  className?: string;
  minWidth?: string;
  padding?: "none" | "sm" | "md" | "lg";
}

export function TableHead({
  children,
  className,
  minWidth,
  padding = "md",
}: TableHeadProps) {
  const paddingClasses = {
    none: "p-0",
    sm: "p-2",
    md: "p-4",
    lg: "p-6",
  }[padding];

  return (
    <th
      className={cn(
        paddingClasses,
        "font-black",
        className
      )}
      style={minWidth ? { minWidth } : undefined}
    >
      {children}
    </th>
  );
}

export interface TableCellProps {
  children: ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
}

export function TableCell({
  children,
  className,
  padding = "md",
}: TableCellProps) {
  const paddingClasses = {
    none: "p-0",
    sm: "p-2",
    md: "p-4",
    lg: "p-6",
  }[padding];

  return (
    <td className={cn(paddingClasses, className)}>
      {children}
    </td>
  );
}