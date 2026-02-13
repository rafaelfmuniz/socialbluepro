"use client";

import { getAllAnalytics, CampaignAnalytics } from "@/actions/campaign-analytics";
import { getCampaigns, Campaign } from "@/actions/campaigns";
import { getMarketingAnalytics, MarketingAnalytics } from "@/actions/marketing-analytics";
import { useToast } from "@/lib/toast";
import { useState, useEffect } from "react";
import { useRealTimePoll } from "@/lib/hooks/useRealTimePoll";
import { PageContainer, PageHeader } from "@/components/ui/PageContainer";
import {
  Mail, Eye, MousePointer, AlertCircle, CheckCircle,
  Filter, Download, TrendingUp, Smartphone, X, Link2, Users, Target, Globe
} from "lucide-react";
import { AdminFooter } from "@/components/admin/AdminFooter";

const SOURCE_COLORS: Record<string, string> = {
  direct: "bg-slate-100 text-slate-700",
  organic: "bg-slate-100 text-slate-700",
  google: "bg-blue-100 text-blue-700",
  google_ads: "bg-blue-100 text-blue-700",
  facebook: "bg-indigo-100 text-indigo-700",
  facebook_ads: "bg-indigo-100 text-indigo-700",
  instagram: "bg-pink-100 text-pink-700",
  instagram_ads: "bg-pink-100 text-pink-700",
  email: "bg-purple-100 text-purple-700",
  panfleto: "bg-orange-100 text-orange-700",
  referral: "bg-green-100 text-green-700",
};

export default function AnalyticsDashboard() {
  const { addToast } = useToast();
  const [analytics, setAnalytics] = useState<CampaignAnalytics[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [marketingAnalytics, setMarketingAnalytics] = useState<MarketingAnalytics | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [campaignError, setCampaignError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    sent: 0,
    opened: 0,
    clicked: 0,
    openRate: 0,
    clickRate: 0,
    delivered: 0,
    bounced: 0
  });

  useEffect(() => {
    calculateStats();
  }, [analytics]);

  const { loading, refetch } = useRealTimePoll<{
    analytics: CampaignAnalytics[];
    campaigns: Campaign[];
    marketing: MarketingAnalytics;
  }>({
    fetchFunction: async () => {
      const data = await getAllAnalytics(500);
      setAnalytics(data);

      const campaignData = await getCampaigns(50);
      setCampaigns(campaignData);
      setCampaignError(null);

      const marketingData = await getMarketingAnalytics();
      setMarketingAnalytics(marketingData);

      return { analytics: data, campaigns: campaignData, marketing: marketingData };
    },
    interval: 30000,
    enabled: true,
    onSuccess: (data) => {
      setAnalytics(data.analytics);
      setCampaigns(data.campaigns);
      setMarketingAnalytics(data.marketing);
    },
    onError: (err) => {
      console.error("[ANALYTICS] Error fetching:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setCampaignError(errorMessage);
    }
  });



  function calculateStats() {
    try {
      if (!analytics || analytics.length === 0) {
        setStats({
          sent: 0,
          opened: 0,
          clicked: 0,
          openRate: 0,
          clickRate: 0,
          delivered: 0,
          bounced: 0
        });
        return;
      }

      const sent = analytics.length;
      const opened = analytics.filter((a: CampaignAnalytics) => a?.opened_at).length;
      const clicked = analytics.filter((a: CampaignAnalytics) => a?.clicked_at).length;
      const delivered = analytics.filter((a: CampaignAnalytics) => a?.delivery_status === 'delivered').length;
      const bounced = analytics.filter((a: CampaignAnalytics) => a?.delivery_status === 'bounced').length;

      const openRate = delivered > 0 ? (opened / delivered) * 100 : 0;
      const clickRate = opened > 0 ? (clicked / opened) * 100 : 0;

      setStats({
        sent,
        opened,
        clicked,
        openRate: parseFloat(openRate.toFixed(1)),
        clickRate: parseFloat(clickRate.toFixed(1)),
        delivered,
        bounced
      });
    } catch (error) {
      console.error("[ANALYTICS] Error calculating stats:", error);
      setStats({
        sent: 0,
        opened: 0,
        clicked: 0,
        openRate: 0,
        clickRate: 0,
        delivered: 0,
        bounced: 0
      });
    }
  }

  function getFilteredAnalytics() {
    if (!analytics || analytics.length === 0) {
      return [];
    }

    return analytics.filter((item: CampaignAnalytics) => {
      if (!item) return false;
      if (selectedCampaign !== "all" && item.campaign_id !== selectedCampaign) return false;
      if (selectedStatus !== "all" && item.delivery_status !== selectedStatus) return false;
      return true;
    });
  }

  function handleExport() {
    const filtered = getFilteredAnalytics();
    const csv = [
      ["Campaign ID", "Email", "Subject", "Sent At", "Opened", "Clicked", "Status"],
      ...filtered.map((a: CampaignAnalytics) => [
        a.campaign_id || "N/A",
        a.recipient_email,
        a.subject,
        a.sent_at,
        a.opened_at ? "Yes" : "No",
        a.clicked_at ? "Yes" : "No",
        a.delivery_status
      ])
    ].map((row) => row.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `analytics_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    addToast("Analytics exported to CSV", "success");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
          <p className="mt-4 text-gray-500 font-medium text-sm">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const filteredAnalytics = getFilteredAnalytics();

    return (
      <PageContainer className="space-y-3 sm:space-y-4 md:space-y-5">
        <PageHeader
          title="Email Analytics"
          description="Monitor email performance and engagement"
           actions={
            <>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 sm:gap-2 border px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl font-bold text-[10px] sm:text-xs uppercase tracking-widest transition-all shadow-sm active:scale-95 min-h-[40px] sm:min-h-[44px] ${
                  showFilters
                    ? 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Filter size={14} className="sm:w-4 sm:h-4" /> <span className="whitespace-nowrap">{showFilters ? 'Hide' : 'Filter'}</span>
              </button>
              <button
                onClick={handleExport}
                className="flex-1 md:flex-none flex items-center justify-center gap-1.5 sm:gap-2 bg-accent text-white px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl font-bold text-[10px] sm:text-xs uppercase tracking-widest hover:bg-green-600 transition-all shadow-lg shadow-accent/20 active:scale-95 min-h-[40px] sm:min-h-[44px]"
              >
                <Download size={14} className="sm:w-4 sm:h-4" /> <span className="whitespace-nowrap">Export</span>
              </button>
            </>
          }
        />



         {/* Error Display */}
         {campaignError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <div>
              <p className="text-sm font-bold text-red-900">Error loading campaigns</p>
              <p className="text-sm text-red-700">{campaignError}</p>
            </div>
            <button
              onClick={() => setCampaignError(null)}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* No Data Display */}
        {!campaignError && filteredAnalytics.length === 0 && !loading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 text-center mt-3 sm:mt-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-blue-500 mx-auto mb-2 sm:mb-3">
              <Mail size={28} className="sm:w-9 sm:h-9 md:w-10 md:h-10" />
            </div>
            <h3 className="text-sm sm:text-base md:text-lg font-bold text-blue-900 mb-1 sm:mb-2">No analytics data yet</h3>
            <p className="text-xs sm:text-sm text-blue-700">Send a campaign to start tracking email performance</p>
          </div>
        )}

       {showFilters && (
         <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">Campaign</label>
               <select
                 value={selectedCampaign}
                 onChange={(e) => setSelectedCampaign(e.target.value)}
                 className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
               >
                 <option value="all">All Campaigns</option>
                 {campaigns.map(camp => (
                    <option key={camp.id} value={camp.id}>{camp.subject}</option>
                 ))}
               </select>
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
               <select
                 value={selectedStatus}
                 onChange={(e) => setSelectedStatus(e.target.value)}
                 className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
               >
                 <option value="all">All Status</option>
                 <option value="sent">Sent</option>
                 <option value="delivered">Delivered</option>
                 <option value="bounced">Bounced</option>
               </select>
             </div>
           </div>
         </div>
       )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
          <div className="bg-white rounded-lg sm:rounded-xl p-2.5 sm:p-3 md:p-5 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs md:text-sm text-gray-500 font-medium">Emails Sent</p>
                <p className="text-lg sm:text-xl md:text-2xl font-black text-slate-900">{stats.sent}</p>
              </div>
              <Mail className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-accent" />
            </div>
          </div>

          <div className="bg-white rounded-lg sm:rounded-xl p-2 sm:p-2.5 md:p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs text-gray-500 font-medium">Opened</p>
                <p className="text-base sm:text-lg md:text-xl font-black text-slate-900">{stats.opened}</p>
              </div>
              <Eye className="w-6 h-6 sm:w-7 sm:h-7 md:w-9 md:h-9 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg sm:rounded-xl p-2 sm:p-2.5 md:p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs text-gray-500 font-medium">Clicked</p>
                <p className="text-base sm:text-lg md:text-xl font-black text-slate-900">{stats.clicked}</p>
              </div>
              <MousePointer className="w-6 h-6 sm:w-7 sm:h-7 md:w-9 md:h-9 text-purple-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg sm:rounded-xl p-2 sm:p-2.5 md:p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs text-gray-500 font-medium">Open Rate</p>
                <p className="text-base sm:text-lg md:text-xl font-black text-accent-accessible">
                  {stats.openRate}%
                </p>
              </div>
              <TrendingUp className="w-6 h-6 sm:w-7 sm:h-7 md:w-9 md:h-9 text-accent-accessible" />
            </div>
          </div>

          <div className="bg-white rounded-lg sm:rounded-xl p-2 sm:p-2.5 md:p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs text-gray-500 font-medium">Click Rate</p>
                <p className="text-base sm:text-lg md:text-xl font-black text-purple-600">
                  {stats.clickRate}%
                </p>
              </div>
              <MousePointer className="w-6 h-6 sm:w-7 sm:h-7 md:w-9 md:h-9 text-purple-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg sm:rounded-xl p-2 sm:p-2.5 md:p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs text-gray-500 font-medium">Bounced</p>
                <p className="text-base sm:text-lg md:text-xl font-black text-red-600">{stats.bounced}</p>
              </div>
              <AlertCircle className="w-6 h-6 sm:w-7 sm:h-7 md:w-9 md:h-9 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg sm:rounded-xl p-2.5 sm:p-3 md:p-5 border border-gray-200 shadow-sm">
          <h2 className="text-xs sm:text-sm md:text-base font-bold text-slate-900 mb-1.5 sm:mb-2 md:mb-3">
            Engagement Overview
          </h2>
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2 md:gap-3 lg:gap-4">
            <div className="text-center p-2 sm:p-2.5 md:p-3 bg-green-50 rounded-md sm:rounded-lg">
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-black text-accent-accessible">{stats.openRate.toFixed(1)}%</p>
              <p className="text-[10px] sm:text-xs text-gray-600">Open Rate</p>
            </div>
            <div className="text-center p-2 sm:p-2.5 md:p-3 bg-purple-50 rounded-md sm:rounded-lg">
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-black text-purple-600">{stats.clickRate.toFixed(1)}%</p>
              <p className="text-[10px] sm:text-xs text-gray-600">Click Rate</p>
            </div>
            <div className="text-center p-2 sm:p-2.5 md:p-3 bg-blue-50 rounded-md sm:rounded-lg">
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-black text-blue-600">{stats.opened}</p>
              <p className="text-[10px] sm:text-xs text-gray-600">Total Opens</p>
            </div>
          </div>
        </div>

        {/* Marketing Sources Section */}
        {marketingAnalytics && (
          <div className="space-y-4">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-2">
              <Globe size={20} className="text-accent" />
              Marketing Sources
            </h2>

            <div className="grid md:grid-cols-3 gap-4">
              {/* Leads by Source */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Users size={16} />
                  Leads by Source
                </h3>
                {marketingAnalytics.sourceStats.length === 0 ? (
                  <p className="text-sm text-slate-400">No UTM data yet</p>
                ) : (
                  <div className="space-y-2">
                    {marketingAnalytics.sourceStats.slice(0, 6).map((stat) => (
                      <div key={stat.source} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${SOURCE_COLORS[stat.source] || 'bg-slate-100 text-slate-700'}`}>
                            {stat.source}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{stat.count}</span>
                          <span className="text-xs text-slate-400">{stat.percentage}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Leads by Medium */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Target size={16} />
                  Leads by Medium
                </h3>
                {marketingAnalytics.mediumStats.length === 0 ? (
                  <p className="text-sm text-slate-400">No UTM data yet</p>
                ) : (
                  <div className="space-y-2">
                    {marketingAnalytics.mediumStats.slice(0, 6).map((stat) => (
                      <div key={stat.medium} className="flex items-center justify-between">
                        <span className="text-sm text-slate-700">{stat.medium}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{stat.count}</span>
                          <span className="text-xs text-slate-400">{stat.percentage}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Short Links Performance */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Link2 size={16} />
                  Short Links
                </h3>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-slate-50 p-3 rounded-lg text-center">
                    <p className="text-2xl font-black text-slate-900">{marketingAnalytics.shortLinkStats.totalLinks}</p>
                    <p className="text-xs text-slate-500">Total Links</p>
                  </div>
                  <div className="bg-accent/10 p-3 rounded-lg text-center">
                    <p className="text-2xl font-black text-accent">{marketingAnalytics.shortLinkStats.totalClicks}</p>
                    <p className="text-xs text-slate-500">Total Clicks</p>
                  </div>
                </div>
                {marketingAnalytics.shortLinkStats.topLinks.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-400 uppercase">Top Links</p>
                    {marketingAnalytics.shortLinkStats.topLinks.slice(0, 3).map((link) => (
                      <div key={link.slug} className="flex items-center justify-between text-sm">
                        <span className="text-accent font-medium">/r/{link.slug}</span>
                        <span className="font-bold text-slate-700">{link.clicks} clicks</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Summary Stats */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-4 sm:p-5 text-white">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-2xl sm:text-3xl font-black">{marketingAnalytics.totalLeads}</p>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Total Leads</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-black text-accent">{marketingAnalytics.leadsWithSource}</p>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">With UTM Data</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-black">{marketingAnalytics.shortLinkStats.activeLinks}</p>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Active Links</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-black text-purple-400">{stats.sent}</p>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Emails Sent</p>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Desktop Table - Hidden on mobile */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hidden lg:block">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-bold text-slate-900">
            Email Details ({filteredAnalytics.length})
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider min-w-[160px]">
                  Recipient
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider min-w-[120px]">
                  Campaign
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider min-w-[100px]">
                  Sent At
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider min-w-[100px]">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider min-w-[100px]">
                  Opened
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider min-w-[100px]">
                  Clicked
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider min-w-[100px]">
                  Device
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAnalytics.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 min-w-[160px]">
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-gray-400" />
                      <span className="text-sm text-slate-900">{item.recipient_email}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700 min-w-[120px]">
                    {item.campaign_id || 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700 min-w-[100px]">
                    {new Date(item.sent_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 min-w-[100px]">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
                      item.delivery_status === 'delivered' ? 'bg-green-100 text-green-700' :
                      item.delivery_status === 'bounced' ? 'bg-red-100 text-red-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {item.delivery_status === 'delivered' && <CheckCircle size={12} />}
                      {item.delivery_status === 'bounced' && <AlertCircle size={12} />}
                      {item.delivery_status}
                    </span>
                  </td>
                  <td className="px-4 py-3 min-w-[100px]">
                    {item.opened_at ? (
                      <span className="inline-flex items-center gap-1 text-xs text-accent-accessible">
                        <Eye size={12} /> {new Date(item.opened_at).toLocaleTimeString()}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 min-w-[100px]">
                    {item.clicked_at ? (
                      <span className="inline-flex items-center gap-1 text-xs text-purple-600">
                        <MousePointer size={12} /> {new Date(item.clicked_at).toLocaleTimeString()}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 min-w-[100px]">
                    <span className="inline-flex items-center gap-1 text-xs text-gray-600">
                      {item.device_type === 'mobile' && <Smartphone size={12} />}
                      {item.device_type || '-'}
                    </span>
                  </td>
                </tr>
              ))}              
              {filteredAnalytics.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500 text-sm">
                    No analytics data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card Layout - Shows on mobile */}
      <div className="lg:hidden space-y-3 sm:space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-sm sm:text-base md:text-lg font-bold text-slate-900">
            Email Details ({filteredAnalytics.length})
          </h2>
        </div>
        
        {filteredAnalytics.length === 0 ? (
          <div className="bg-white rounded-lg sm:rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6 md:p-8 text-center">
            <p className="text-gray-500 text-xs sm:text-sm">No analytics data available</p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {filteredAnalytics.map((item) => (
              <div key={item.id} className="bg-white rounded-lg sm:rounded-xl border border-gray-200 shadow-sm p-3 sm:p-4 md:p-5 space-y-3 sm:space-y-4">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600 rounded-md sm:rounded-lg flex items-center justify-center shrink-0">
                      <Mail size={16} className="text-gray-500 sm:w-[18px] sm:h-[18px]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-slate-900 text-xs sm:text-sm truncate">{item.recipient_email}</h3>
                      <p className="text-[10px] sm:text-xs text-gray-500 truncate">Campaign: {item.campaign_id || 'N/A'}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold shrink-0 ${
                    item.delivery_status === 'delivered' ? 'bg-green-100 text-green-700' :
                    item.delivery_status === 'bounced' ? 'bg-red-100 text-red-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {item.delivery_status === 'delivered' && <CheckCircle size={10} className="sm:w-3 sm:h-3" />}
                    {item.delivery_status === 'bounced' && <AlertCircle size={10} className="sm:w-3 sm:h-3" />}
                    {item.delivery_status}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <div className="bg-gray-50 p-2 sm:p-3 rounded-md sm:rounded-lg border border-gray-100">
                    <p className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider mb-0.5 sm:mb-1">Sent At</p>
                    <p className="text-xs sm:text-sm font-medium text-slate-900">{new Date(item.sent_at).toLocaleDateString()}</p>
                  </div>
                  <div className="bg-gray-50 p-2 sm:p-3 rounded-md sm:rounded-lg border border-gray-100">
                    <p className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider mb-0.5 sm:mb-1">Device</p>
                    <div className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm text-gray-600">
                      {item.device_type === 'mobile' && <Smartphone size={12} className="sm:w-3.5 sm:h-3.5" />}
                      <span>{item.device_type || '-'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <div className={`p-2 sm:p-3 rounded-md sm:rounded-lg border ${
                    item.opened_at ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-100'
                  }`}>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <Eye size={12} className={`${item.opened_at ? 'text-accent-accessible' : 'text-gray-400'} sm:w-3.5 sm:h-3.5`} />
                      <div>
                        <p className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">Opened</p>
                        <p className={`text-xs sm:text-sm font-medium ${item.opened_at ? 'text-green-700' : 'text-gray-500'}`}>
                          {item.opened_at ? new Date(item.opened_at).toLocaleTimeString() : 'Not opened'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className={`p-2 sm:p-3 rounded-md sm:rounded-lg border ${
                    item.clicked_at ? 'bg-purple-50 border-purple-100' : 'bg-gray-50 border-gray-100'
                  }`}>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <MousePointer size={12} className={`${item.clicked_at ? 'text-purple-600' : 'text-gray-400'} sm:w-3.5 sm:h-3.5`} />
                      <div>
                        <p className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">Clicked</p>
                        <p className={`text-xs sm:text-sm font-medium ${item.clicked_at ? 'text-purple-700' : 'text-gray-500'}`}>
                          {item.clicked_at ? new Date(item.clicked_at).toLocaleTimeString() : 'Not clicked'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <AdminFooter />
    </PageContainer>
  );
}

