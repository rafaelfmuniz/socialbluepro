"use client";

import { cn } from "@/lib/utils";

interface SourceBadgeProps {
  source?: string | null;
  medium?: string | null;
}

export function SourceBadge({ source, medium }: SourceBadgeProps) {
  if (!source) {
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-500 border border-slate-200">
        Direct
      </span>
    );
  }

  const sourceLower = source.toLowerCase();

  // Define badge styles based on source
  const getBadgeStyle = () => {
    // Physical/Offline sources
    if (sourceLower === 'panfleto' || sourceLower === 'flyer' || sourceLower === 'offline') {
      return {
        bg: 'bg-purple-50',
        text: 'text-purple-700',
        border: 'border-purple-100',
        icon: '🟣'
      };
    }

    // Google Ads
    if (sourceLower.includes('google')) {
      return {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-100',
        icon: '🔵'
      };
    }

    // Facebook/Instagram
    if (sourceLower.includes('facebook') || sourceLower.includes('fb')) {
      return {
        bg: 'bg-indigo-50',
        text: 'text-indigo-700',
        border: 'border-indigo-100',
        icon: '🟦'
      };
    }

    if (sourceLower.includes('instagram') || sourceLower.includes('ig')) {
      return {
        bg: 'bg-pink-50',
        text: 'text-pink-700',
        border: 'border-pink-100',
        icon: '🩷'
      };
    }

    // Email
    if (sourceLower.includes('email') || sourceLower.includes('newsletter')) {
      return {
        bg: 'bg-yellow-50',
        text: 'text-yellow-700',
        border: 'border-yellow-100',
        icon: '📧'
      };
    }

    // Referral
    if (sourceLower.includes('referral') || sourceLower.includes('indicacao')) {
      return {
        bg: 'bg-green-50',
        text: 'text-green-700',
        border: 'border-green-100',
        icon: '🟢'
      };
    }

    // Default
    return {
      bg: 'bg-slate-50',
      text: 'text-slate-700',
      border: 'border-slate-200',
      icon: '⚪'
    };
  };

  const style = getBadgeStyle();

  // Format display name
  const formatSourceName = (src: string) => {
    const nameMap: Record<string, string> = {
      'panfleto': 'Panfleto',
      'flyer': 'Flyer',
      'offline': 'Offline',
      'google': 'Google',
      'google_ads': 'Google Ads',
      'facebook': 'Facebook',
      'facebook_ads': 'Facebook Ads',
      'instagram': 'Instagram',
      'instagram_ads': 'Instagram Ads',
      'email': 'Email',
      'newsletter': 'Newsletter',
      'referral': 'Referral',
      'indicacao': 'Indicação'
    };

    return nameMap[sourceLower] || src.charAt(0).toUpperCase() + src.slice(1);
  };

  return (
    <div className="flex flex-col gap-1">
      <span className={cn(
        "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border inline-flex items-center gap-1 w-fit",
        style.bg,
        style.text,
        style.border
      )}>
        {formatSourceName(source)}
      </span>
      {medium && (
        <span className="text-[9px] text-slate-400 font-medium">
          {medium}
        </span>
      )}
    </div>
  );
}
