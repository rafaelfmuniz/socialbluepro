"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { IMAGES } from "@/lib/constants";
import { useState, useEffect } from "react";
import { useToast } from "@/lib/toast";
import { Menu, X, LayoutDashboard, Users, Mail, Settings, LogOut, ChevronRight, Bell, BarChart2, Target, ArrowUp } from "lucide-react";

const navItems = [
   { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
   { name: "Leads", href: "/admin/leads", icon: Users },
   { name: "Campaigns", href: "/admin/campaigns", icon: Mail },
   { name: "Remarketing", href: "/admin/remarketing", icon: Target },
   { name: "Analytics", href: "/admin/analytics", icon: BarChart2 },
   { name: "Settings", href: "/admin/settings", icon: Settings },
 ]; 

interface AdminNavigationProps {
  children: React.ReactNode;
  user?: {
    id?: string;
    name?: string | null;
    email?: string | null;
    role?: string | null;
    isDefaultPassword?: boolean;
  };
}

export default function AdminNavigation({ children, user }: AdminNavigationProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const { addToast } = useToast();
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
      const handleScroll = () => {
        setShowScrollTop(window.scrollY > 300);
      };
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSignOut = async () => {
      // Clear session storage
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('admin_user')
      }
      router.push("/login");
    };
 
   return (
     <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans overflow-x-hidden">
       {/* Mobile Backdrop */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-slate-900/60 z-[60] lg:hidden backdrop-blur-sm transition-all animate-fade-in"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
 
        {/* Sidebar */}
        <aside className={cn(
          "fixed inset-y-0 left-0 z-[70] w-64 sm:w-72 bg-white flex flex-col border-r border-slate-200 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="p-4 sm:p-6 lg:p-8 border-b border-slate-100 flex items-center justify-between">
            <Link href="/admin" className="flex items-center gap-2 sm:gap-3">
              <img 
                src={IMAGES.logoColor}
                alt="Logo" 
                className="h-6 sm:h-8 w-auto object-contain"
              />
              <span className="text-lg sm:text-xl font-black tracking-tighter uppercase">Admin Panel</span>
            </Link>
            <button 
              className="lg:hidden p-2 text-slate-400 hover:text-green-600"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X size={24} />
            </button>
          </div>
         
          <nav className="flex-1 p-4 sm:p-6 space-y-2 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsSidebarOpen(false)}
                    className={cn(
                      "flex items-center justify-between group px-3 sm:px-4 py-3 sm:py-4 rounded-xl sm:rounded-2xl transition-all font-bold",
                      isActive 
                        ? "bg-slate-900 text-white shadow-lg" 
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    )}
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="sm:hidden">
                      <item.icon size={18} />
                    </div>
                    <div className="hidden sm:block">
                      <item.icon size={20} />
                    </div>
                    <span className="text-xs sm:text-sm uppercase tracking-widest">{item.name}</span>
                  </div>
                  <div className="sm:hidden">
                    <ChevronRight size={12} />
                  </div>
                  <div className="hidden sm:block">
                    <ChevronRight size={14} />
                  </div>
                </Link>
              );
            })}
          </nav>
 
          <div className="p-4 sm:p-6 border-t border-slate-100">
            <div className="flex flex-col items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
              <div className="w-10 h-10 bg-accent text-white rounded-full flex items-center justify-center font-black shrink-0">{(user?.name || 'A').charAt(0).toUpperCase()}</div>
              <div className="overflow-hidden text-center sm:text-left">
                <p className="text-xs font-black uppercase text-slate-900 truncate">{user?.name || 'Administrator'}</p>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest truncate">{user?.role || 'Admin'}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center justify-center sm:justify-start gap-2 sm:gap-3 w-full px-4 py-3 rounded-xl bg-white text-red-500 hover:bg-red-50 transition-all border border-slate-100 text-xs font-black uppercase tracking-widest"
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
       </aside>
 
         {/* Main Content */}
         <div className="flex-1 flex flex-col min-w-0">
              <header className="bg-white border-b border-slate-200 h-16 sm:h-20 md:h-24 flex items-center justify-between px-4 sm:px-6 lg:px-8 xl:px-12 sticky lg:relative top-0 z-50">
               <div className="flex items-center gap-3 sm:gap-4">
                 <button 
                   className="lg:hidden p-3 sm:p-3 text-slate-400 hover:text-slate-900 active:scale-95 transition-transform min-h-[44px] min-w-[44px] flex items-center justify-center"
                   onClick={() => setIsSidebarOpen(true)}
                   aria-label="Open menu"
                 >
                   <Menu size={28} className="sm:w-6 sm:h-6" />
                 </button>
                  <div className="hidden sm:block">
                     <h2 className="flex flex-col items-start">
                         <span className="text-lg sm:text-xl md:text-2xl font-black tracking-tighter text-slate-900">SOCIALBLUEPRO</span>
                         <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.3em] font-black text-accent">LANDSCAPING</span>
                       </h2>
                  </div>
                   <Link href="/admin" className="sm:hidden flex items-center gap-2">
                     <img 
                       src={IMAGES.logoColor}
                       alt="Logo" 
                       className="h-6 w-auto object-contain"
                     />
                     <span className="text-base font-black text-slate-900 tracking-tighter uppercase truncate max-w-[140px]">
                       Admin Panel
                     </span>
                   </Link>
               </div>
              
              <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                 <button 
                   onClick={() => addToast("No new notifications", "info")}
                   className="p-3 sm:p-3 bg-slate-50 rounded-xl sm:rounded-2xl text-slate-400 hover:text-accent transition-colors relative min-h-[44px] min-w-[44px] flex items-center justify-center"
                 >
                   <div className="sm:hidden">
                     <Bell size={22} />
                   </div>
                   <div className="hidden sm:block">
                     <Bell size={24} />
                   </div>
                   <span className="absolute top-3 right-3 sm:top-3 sm:right-3 w-2 h-2 bg-accent rounded-full border-2 border-white"></span>
                 </button>
                <div className="h-8 sm:h-10 w-px bg-slate-200 mx-1 hidden md:block" />
                 <div className="hidden md:flex flex-col items-end">
                    <span className="text-sm font-black text-slate-900 uppercase tracking-tighter">SocialBluePro</span>
                   <span className="text-xs text-accent font-bold uppercase tracking-widest">Authorized</span>
                 </div>
              </div>
           </header>
 
             <main className="flex-1 flex flex-col p-3 sm:p-4 md:p-6 lg:p-8 animate-fade-up">
             {children}
           </main>

          {/* Scroll to Top Button */}
          {showScrollTop && (
            <button 
              onClick={scrollToTop} 
              className="fixed bottom-6 right-6 p-3 bg-slate-900 text-white rounded-full shadow-xl z-50 animate-fade-in hover:bg-slate-700 transition-colors lg:hidden"
            >
              <ArrowUp size={20} />
            </button>
          )}
       </div>
     </div>
   );
 }
