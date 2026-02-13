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
      <div className="flex-1 space-y-6 sm:space-y-8 md:space-y-12 font-sans">

    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 lg:gap-6">
     {stats.map((stat) => (
        <div key={stat.name} className="bg-white p-3 sm:p-4 md:p-5 lg:p-6 rounded-lg sm:rounded-xl md:rounded-2xl lg:rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all group">
            <div className="flex items-center justify-between mb-2 sm:mb-3 md:mb-4 lg:mb-5">
            <div className={`${stat.color} w-8 h-8 sm:w-10 sm:h-10 md:w-11 md:h-11 lg:w-12 lg:h-12 rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
             <stat.icon size={20} className="sm:w-6 sm:h-6 md:w-6 md:h-6 lg:w-6 lg:h-6" />
           </div>
           <ArrowUpRight className="text-slate-300 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
          </div>
          <h3 className="text-slate-500 text-[10px] sm:text-xs font-black uppercase tracking-wider sm:tracking-widest mb-0.5 sm:mb-1">{stat.name}</h3>
          <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-slate-900 tracking-tighter">{stat.value}</p>
        </div>
      ))}
    </div>
        <div className="grid lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
          <div className="lg:col-span-2 bg-white p-3 sm:p-4 md:p-5 lg:p-6 rounded-lg sm:rounded-xl md:rounded-2xl lg:rounded-[3rem] border border-slate-200 shadow-xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-3 sm:mb-4 md:mb-5 lg:mb-6">
             <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-black tracking-tighter uppercase">Recent Project Leads</h3>
             <Link href="/admin/leads" className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-accent border-b border-accent/20 pb-1 whitespace-nowrap">View Full CRM</Link>
           </div>
           <div className="space-y-2 sm:space-y-3 md:space-y-6">
             {leads.slice(0, 5).map((lead: Lead) => (
                <div key={lead.id} className="flex items-center justify-between p-2.5 sm:p-3 md:p-4 bg-slate-50 rounded-lg sm:rounded-xl md:rounded-2xl hover:bg-slate-100 transition-colors border border-slate-100 group">
                 <div className="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0 flex-1">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-white rounded-md sm:rounded-lg md:rounded-xl flex items-center justify-center font-black text-slate-300 group-hover:text-accent transition-colors shrink-0">
                       {lead.name?.charAt(0) || "?"}
                    </div>
                    <div className="min-w-0 flex-1">
                       <p className="font-black text-slate-900 text-sm sm:text-base md:text-lg leading-tight mb-0.5 sm:mb-1 truncate">{lead.name}</p>
                        <p className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider sm:tracking-widest truncate">{lead.email}</p>
                    </div>
                 </div>
                 <div className="text-right shrink-0 ml-2">
 <p className="text-[10px] sm:text-xs font-black uppercase tracking-wider sm:tracking-widest text-slate-900 mb-0.5 sm:mb-1 truncate max-w-[100px] sm:max-w-[140px]">{lead.service_interest || "Service Unknown"}</p>
                     <span className="px-1.5 sm:px-2 md:px-3 py-0.5 sm:py-1 bg-green-100 text-green-700 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider sm:tracking-widest">
                      {lead.status}
                    </span>
                 </div>
               </div>
             ))}
             {leads.length === 0 && (
                 <div className="text-center py-6 sm:py-8 md:py-12 bg-slate-50 rounded-xl sm:rounded-2xl md:rounded-3xl border-2 border-dashed border-slate-200">
                  <div className="mx-auto text-slate-200 mb-3 sm:mb-4">
                    <Users size={32} />
                  </div>
                  <p className="text-slate-400 font-black uppercase tracking-widest text-[10px] sm:text-xs md:text-sm">Awaiting Your First Lead</p>
                </div>
             )}
           </div>
         </div>

          <div className="bg-slate-900 p-3 sm:p-4 md:p-5 lg:p-6 rounded-lg sm:rounded-xl md:rounded-2xl lg:rounded-[3rem] flex flex-col text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 sm:w-48 sm:h-48 md:w-64 md:h-64 bg-accent/20 rounded-full blur-[60px] sm:blur-[80px] md:blur-[100px] -mr-16 -mt-16 sm:-mr-24 sm:-mt-24 md:-mr-32 md:-mt-32" />
            
            <div className="relative z-10 flex flex-col h-full">
               <Mail size={28} className="text-accent mb-2 sm:mb-3 md:mb-4 lg:mb-5 sm:w-8 sm:h-8 md:w-9 md:h-9" />
              <h3 className="text-lg sm:text-xl md:text-2xl font-black tracking-tighter uppercase mb-2 sm:mb-3 md:mb-4 leading-none">Ready to <br/> scale up?</h3>
               <p className="text-slate-400 font-medium leading-relaxed mb-3 sm:mb-4 md:mb-5 lg:mb-6 text-xs sm:text-sm md:text-base italic">
                Blast an offer to all your leads. High-impact email campaigns converted to projects.
              </p>
              
               <div className="mt-auto space-y-2 sm:space-y-3 md:space-y-4">
                 <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs md:text-sm font-bold text-slate-400 bg-white/5 p-2.5 sm:p-3 md:p-4 rounded-lg sm:rounded-xl md:rounded-2xl border border-white/10">
                   <CheckCircle2 size={14} className="sm:w-4 sm:h-4 md:w-5 md:h-5" />
                   No 3rd party costs
                 </div>
                 <Link href="/admin/campaigns" className="block w-full bg-accent text-white py-2.5 sm:py-3 md:py-4 lg:py-5 rounded-lg sm:rounded-xl md:rounded-2xl font-black uppercase tracking-wider sm:tracking-widest hover:bg-accent-dark transition-all shadow-xl shadow-accent/20 text-center text-[10px] sm:text-xs md:text-sm">
                   Start Campaign
                 </Link>
               </div>
             </div>
          </div>
        </div>
        
      </div>
    );
  }
