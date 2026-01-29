"use client"

import { getLeads } from "@/actions/leads"
import { getCampaigns } from "@/actions/campaigns"
import { Users, Mail, TrendingUp, Clock, ArrowUpRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface Lead {
  id: string;
  name: string;
  email: string;
  status: string;
  service_interest: string;
  created_at: string;
}

interface Campaign {
  id: string;
  subject: string;
  sent_at: string;
  open_rate: number;
}

export default function AdminDashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const leadsResult = await getLeads({ limit: 10 });
      if (leadsResult.success) {
        setLeads(leadsResult.data || []);
      }

      const campaignsData = await getCampaigns(10);
      setCampaigns(campaignsData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }

  const yesterday = new Date();
  yesterday.setHours(yesterday.getHours() - 24);

  const stats = [
    {
      name: "Lead Database",
      value: leads.length,
      icon: Users,
      color: "text-blue-600 bg-blue-50",
    },
    {
      name: "Active Leads (24h)",
      value: leads.filter((l: Lead) => new Date(l.created_at) > yesterday).length,
      icon: Clock,
      color: "text-green-600 bg-green-50",
    },
    {
      name: "Email Campaigns",
      value: campaigns.length,
      icon: Mail,
      color: "text-purple-600 bg-purple-50",
    },
    {
      name: "Capture Rate",
      value: "100%",
      icon: TrendingUp,
      color: "text-orange-600 bg-orange-50",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
          <p className="mt-4 text-slate-500 font-medium text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

   return (
     <div className="space-y-8 sm:space-y-12 font-sans">
       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
         {stats.map((stat) => (
           <div key={stat.name} className="bg-white p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl md:rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all group">
             <div className="flex items-center justify-between mb-4 sm:mb-6 md:mb-8">
               <div className={`${stat.color} w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl sm:rounded-xl md:rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                 <stat.icon size={20} className="sm:hidden" />
                 <stat.icon size={24} className="hidden sm:block md:hidden" />
                 <stat.icon size={28} className="hidden md:block" />
               </div>
               <ArrowUpRight className="text-slate-300" size={16} className="sm:hidden" />
               <ArrowUpRight className="text-slate-300 hidden sm:block md:hidden" size={18} />
               <ArrowUpRight className="text-slate-300 hidden md:block" size={20} />
             </div>
             <h3 className="text-slate-500 text-[10px] sm:text-xs font-black uppercase tracking-widest mb-1">{stat.name}</h3>
             <p className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tighter">{stat.value}</p>
           </div>
         ))}
       </div>

      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
        <div className="lg:col-span-2 bg-white p-4 sm:p-6 md:p-10 rounded-xl sm:rounded-2xl md:rounded-[3rem] border border-slate-200 shadow-xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8 md:mb-10">
            <h3 className="text-lg sm:text-xl md:text-2xl font-black tracking-tighter uppercase">Recent Project Leads</h3>
            <Link href="/admin/leads" className="text-xs font-black uppercase tracking-widest text-accent border-b border-accent/20 pb-1 whitespace-nowrap">View Full CRM</Link>
          </div>
          <div className="space-y-3 sm:space-y-6">
            {leads.slice(0, 5).map((lead: Lead) => (
              <div key={lead.id} className="flex items-center justify-between p-4 sm:p-6 bg-slate-50 rounded-xl sm:rounded-2xl hover:bg-slate-100 transition-colors border border-slate-100 group">
                <div className="flex items-center gap-3 sm:gap-4">
                   <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-lg sm:rounded-xl flex items-center justify-center font-black text-slate-300 group-hover:text-accent transition-colors">
                      {lead.name?.charAt(0) || "?"}
                   </div>
                   <div>
                      <p className="font-black text-slate-900 text-base sm:text-lg leading-tight mb-1">{lead.name}</p>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest hidden sm:block">{lead.email}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest sm:hidden">{lead.email}</p>
                   </div>
                </div>
                <div className="text-right">
                   <p className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-900 mb-1">{lead.service_interest || "Service Unknown"}</p>
                   <span className="px-2 sm:px-3 py-1 bg-green-100 text-green-700 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest">
                     {lead.status}
                   </span>
                </div>
              </div>
            ))}
            {leads.length === 0 && (
               <div className="text-center py-12 sm:py-20 bg-slate-50 rounded-2xl sm:rounded-3xl border-2 border-dashed border-slate-200">
                 <Users className="mx-auto text-slate-200 mb-4" size={36} className="sm:hidden" />
                 <Users className="mx-auto text-slate-200 mb-4 hidden sm:block md:hidden" size={42} />
                 <Users className="mx-auto text-slate-200 mb-4 hidden md:block" size={48} />
                 <p className="text-slate-400 font-black uppercase tracking-widest text-xs sm:text-sm">Awaiting Your First Lead</p>
               </div>
            )}
          </div>
        </div>

        <div className="bg-slate-900 p-4 sm:p-6 md:p-10 rounded-xl sm:rounded-2xl md:rounded-[3rem] flex flex-col text-white shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 w-48 h-48 sm:w-64 sm:h-64 bg-accent/20 rounded-full blur-[100px] -mr-24 -mt-24 sm:-mr-32 sm:-mt-32" />
           
           <div className="relative z-10 flex flex-col h-full">
             <Mail size={36} className="text-accent mb-4 sm:mb-6 md:mb-8" />
             <h3 className="text-2xl sm:text-3xl font-black tracking-tighter uppercase mb-3 sm:mb-4 leading-none">Ready to <br/> scale up?</h3>
             <p className="text-slate-400 font-medium leading-relaxed mb-6 sm:mb-8 md:mb-10 text-sm sm:text-base italic">
               Blast an offer to all your leads. High-impact email campaigns converted to projects.
             </p>
             
             <div className="mt-auto space-y-3 sm:space-y-4">
               <div className="flex items-center gap-3 text-xs sm:text-sm font-bold text-slate-400 bg-white/5 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-white/10">
                 <CheckCircle2 size={16} className="sm:hidden" />
                 <CheckCircle2 size={18} className="hidden sm:block" />
                 No 3rd party costs
               </div>
               <Link href="/admin/campaigns" className="block w-full bg-accent text-white py-3 sm:py-5 rounded-xl sm:rounded-2xl font-black uppercase tracking-widest hover:bg-accent-dark transition-all shadow-xl shadow-accent/20 text-center text-xs sm:text-sm">
                 Start Campaign
               </Link>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
