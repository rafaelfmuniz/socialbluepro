"use client";

import { Bell, Loader2, Mail, Users } from "lucide-react";
import { useRealTimePoll } from "@/lib/hooks/useRealTimePoll";
import { getNotificationCounts, type NotificationCounts } from "@/actions/notifications";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export function NotificationsBell() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: counts, loading, refetch } = useRealTimePoll<NotificationCounts | undefined>({
    fetchFunction: async () => {
      const result = await getNotificationCounts();
      return result.success ? result.data : undefined;
    },
    interval: 10000,
    enabled: true
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNavigate = (path: string) => {
    setIsOpen(false);
    router.push(path);
  };

  const hasNotifications = counts && counts.total > 0;

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "p-3 sm:p-3 rounded-xl sm:rounded-2xl transition-all relative min-h-[44px] min-w-[44px] flex items-center justify-center group",
          isOpen ? "bg-slate-100 text-slate-900" : "bg-slate-50 text-slate-400 hover:text-accent"
        )}
        aria-label="Notifications"
      >
        <div className="sm:hidden">
          <Bell size={22} className={cn(hasNotifications && "animate-pulse-slow")} />
        </div>
        <div className="hidden sm:block">
          <Bell size={24} className={cn(hasNotifications && "animate-pulse-slow")} />
        </div>
        
        {hasNotifications && (
          <span className="absolute top-1.5 right-1.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white shadow-sm animate-in zoom-in-50 duration-300">
            {counts!.total > 99 ? '99+' : counts!.total}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 animate-fade-up overflow-hidden">
          <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Notifications</h3>
            {loading && <Loader2 size={12} className="animate-spin text-slate-400" />}
          </div>
          
          <div className="p-2 space-y-1">
            {!counts || counts.total === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <Bell size={32} className="mx-auto mb-3 opacity-20" />
                <p className="text-xs font-bold">No new notifications</p>
              </div>
            ) : (
              <>
                <button 
                  onClick={() => handleNavigate("/admin/leads")}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                      <Users size={18} />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-slate-900">New Leads</p>
                      <p className="text-xs text-slate-500">Requires attention</p>
                    </div>
                  </div>
                  {counts.newLeads > 0 && (
                    <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-full min-w-[24px]">
                      {counts.newLeads}
                    </span>
                  )}
                </button>

                <button 
                  onClick={() => handleNavigate("/admin/messages")}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent/10 text-accent flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                      <Mail size={18} />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-slate-900">New Messages</p>
                      <p className="text-xs text-slate-500">Unread inquiries</p>
                    </div>
                  </div>
                  {counts.unreadMessages > 0 && (
                    <span className="bg-accent text-white text-[10px] font-bold px-2 py-1 rounded-full min-w-[24px]">
                      {counts.unreadMessages}
                    </span>
                  )}
                </button>
              </>
            )}
          </div>
          
          {hasNotifications && (
            <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
              <button 
                onClick={() => refetch()} 
                className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-accent transition-colors"
              >
                Refresh Status
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
