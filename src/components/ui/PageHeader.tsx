import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ title, description, actions, className = '' }: PageHeaderProps) {
  return (
    <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-3 sm:gap-4 md:gap-6 ${className}`}>
      <div className="min-w-0 flex-1">
        <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-black tracking-tighter uppercase text-slate-900 truncate">{title}</h1>
        {description && (
          <p className="text-slate-500 font-medium text-[11px] sm:text-xs md:text-sm mt-0.5 sm:mt-1">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex gap-2 sm:gap-3 w-full md:w-auto flex-wrap">
          {actions}
        </div>
      )}
    </div>
  );
}
