"use client";

import { getAllAnalytics, CampaignAnalytics } from "@/actions/campaign-analytics";
import { getCampaigns, Campaign } from "@/actions/campaigns";
import { useToast } from "@/lib/toast";
import { useState, useEffect } from "react";
import { useRealTimePoll } from "@/lib/hooks/useRealTimePoll";
import { LiveIndicator } from "@/components/ui/LiveIndicator";
import {
  Mail, Eye, MousePointer, AlertCircle, CheckCircle,
  Filter, Download, TrendingUp, Smartphone, X
} from "lucide-react";

export default function AnalyticsDashboard() {
  const { addToast } = useToast();
  const [analytics, setAnalytics] = useState<CampaignAnalytics[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [campaignError, setCampaignError] = useState<string | null>(null);
  const [manualRefreshing, setManualRefreshing] = useState(false);
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

  const { loading, lastUpdate, refetch, isPolling } = useRealTimePoll<{
    analytics: CampaignAnalytics[];
    campaigns: Campaign[];
  }>({
    fetchFunction: async () => {
      const data = await getAllAnalytics(500);
      setAnalytics(data);

      const campaignData = await getCampaigns(50);
      setCampaigns(campaignData);
      setCampaignError(null);

      return { analytics: data, campaigns: campaignData };
    },
    interval: 30000,
    enabled: true,
    onSuccess: (data) => {
      setAnalytics(data.analytics);
      setCampaigns(data.campaigns);
    },
    onError: (err) => {
      console.error("[ANALYTICS] Error fetching:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setCampaignError(errorMessage);
    }
  });

  const handleManualRefresh = async () => {
    setManualRefreshing(true);
    await refetch();
    setManualRefreshing(false);
  };

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
    ].map((row: string[]) => row.join(",")).join("\n");

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
    <div className="space-y-8">
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
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 text-center">
          <Mail className="w-12 h-12 text-blue-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-blue-900 mb-2">No analytics data yet</h3>
          <p className="text-sm text-blue-700">Send a campaign to start tracking email performance</p>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-slate-900">
            Email Analytics
          </h1>
          <p className="text-slate-500 font-medium text-sm">
            Monitor email performance and engagement
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            <Filter size={16} />
            Filters
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {/* Live Indicator */}
      <div className="flex justify-end">
        <LiveIndicator
          isPolling={isPolling}
          lastUpdate={lastUpdate}
          onRefresh={handleManualRefresh}
          refreshLoading={manualRefreshing}
          showLabel={true}
        />
      </div>

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

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl p-3 sm:p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-500 font-medium">Emails Sent</p>
              <p className="text-xl sm:text-2xl font-black text-slate-900">{stats.sent}</p>
            </div>
            <Mail className="w-8 h-8 sm:w-10 sm:h-10 text-accent" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 sm:p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-500 font-medium">Opened</p>
              <p className="text-xl sm:text-2xl font-black text-slate-900">{stats.opened}</p>
            </div>
            <Eye className="w-8 h-8 sm:w-10 sm:h-10 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 sm:p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-500 font-medium">Clicked</p>
              <p className="text-xl sm:text-2xl font-black text-slate-900">{stats.clicked}</p>
            </div>
            <MousePointer className="w-8 h-8 sm:w-10 sm:h-10 text-purple-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 sm:p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-500 font-medium">Open Rate</p>
              <p className="text-xl sm:text-2xl font-black text-accent-accessible">
                {stats.openRate}%
              </p>
            </div>
            <TrendingUp className="w-8 h-8 sm:w-10 sm:h-10 text-accent-accessible" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 sm:p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-500 font-medium">Click Rate</p>
              <p className="text-xl sm:text-2xl font-black text-purple-600">
                {stats.clickRate}%
              </p>
            </div>
            <MousePointer className="w-8 h-8 sm:w-10 sm:h-10 text-purple-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 sm:p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-500 font-medium">Bounced</p>
              <p className="text-xl sm:text-2xl font-black text-red-600">{stats.bounced}</p>
            </div>
            <AlertCircle className="w-8 h-8 sm:w-10 sm:h-10 text-red-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 shadow-sm">
        <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-3 sm:mb-4">
          Engagement Overview
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg">
            <p className="text-2xl sm:text-3xl font-black text-accent-accessible">{stats.openRate.toFixed(1)}%</p>
            <p className="text-xs sm:text-sm text-gray-600">Open Rate</p>
          </div>
          <div className="text-center p-3 sm:p-4 bg-purple-50 rounded-lg">
            <p className="text-2xl sm:text-3xl font-black text-purple-600">{stats.clickRate.toFixed(1)}%</p>
            <p className="text-xs sm:text-sm text-gray-600">Click Rate</p>
          </div>
          <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl sm:text-3xl font-black text-blue-600">{stats.opened}</p>
            <p className="text-xs sm:text-sm text-gray-600">Total Opens</p>
          </div>
        </div>
      </div>

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
      <div className="lg:hidden space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-900">
            Email Details ({filteredAnalytics.length})
          </h2>
        </div>
        
        {filteredAnalytics.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
            <p className="text-gray-500 text-sm">No analytics data available</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAnalytics.map((item) => (
              <div key={item.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600 rounded-lg flex items-center justify-center">
                      <Mail size={18} className="text-gray-500" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{item.recipient_email}</h3>
                      <p className="text-xs text-gray-500">Campaign: {item.campaign_id || 'N/A'}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                    item.delivery_status === 'delivered' ? 'bg-green-100 text-green-700' :
                    item.delivery_status === 'bounced' ? 'bg-red-100 text-red-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {item.delivery_status === 'delivered' && <CheckCircle size={12} />}
                    {item.delivery_status === 'bounced' && <AlertCircle size={12} />}
                    {item.delivery_status}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Sent At</p>
                    <p className="text-sm font-medium text-slate-900">{new Date(item.sent_at).toLocaleDateString()}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Device</p>
                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                      {item.device_type === 'mobile' && <Smartphone size={14} />}
                      <span>{item.device_type || '-'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className={`p-3 rounded-lg border ${
                    item.opened_at ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-100'
                  }`}>
                    <div className="flex items-center gap-2">
                      <Eye size={14} className={item.opened_at ? 'text-accent-accessible' : 'text-gray-400'} />
                      <div>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Opened</p>
                        <p className={`text-sm font-medium ${item.opened_at ? 'text-green-700' : 'text-gray-500'}`}>
                          {item.opened_at ? new Date(item.opened_at).toLocaleTimeString() : 'Not opened'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg border ${
                    item.clicked_at ? 'bg-purple-50 border-purple-100' : 'bg-gray-50 border-gray-100'
                  }`}>
                    <div className="flex items-center gap-2">
                      <MousePointer size={14} className={item.clicked_at ? 'text-purple-600' : 'text-gray-400'} />
                      <div>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Clicked</p>
                        <p className={`text-sm font-medium ${item.clicked_at ? 'text-purple-700' : 'text-gray-500'}`}>
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
    </div>
  );
}

