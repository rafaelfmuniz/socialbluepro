"use client";

import { VersionBadgeSimple } from "@/components/ui/VersionBadge";

export function AdminFooter() {
  return (
    <footer className="mt-auto pt-4 sm:pt-5 md:pt-6 border-t border-slate-200 pb-4 sm:pb-5 md:pb-6">
      <div className="flex flex-col items-center justify-center gap-1">
        <p className="text-[10px] sm:text-xs text-slate-400 text-center font-medium">
          SocialBluePro Landscaping
        </p>
        <VersionBadgeSimple />
      </div>
    </footer>
  );
}
