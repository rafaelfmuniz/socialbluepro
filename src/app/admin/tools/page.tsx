"use client";

import { useState, useEffect } from "react";
import { 
  Link2, QrCode, ExternalLink, Copy, Trash2, Plus, Eye, 
  Download, Loader2, Settings, Globe, Share2
} from "lucide-react";
import { createShortLink, getShortLinks, deleteShortLink, toggleShortLink, ShortLink } from "@/actions/shortlinks";
import { useToast } from "@/lib/toast";


const COMMON_SOURCES = [
  { value: "flyer", label: "Flyer (Offline)" },
  { value: "google_ads", label: "Google Ads" },
  { value: "facebook", label: "Facebook Ads" },
  { value: "instagram", label: "Instagram Ads" },
  { value: "email", label: "Email Marketing" },
  { value: "referral", label: "Referral" },
];

const COMMON_MEDIUMS = [
  { value: "cpc", label: "CPC (Paid)" },
  { value: "offline", label: "Offline (Physical)" },
  { value: "email", label: "Email" },
  { value: "social", label: "Social Media" },
  { value: "referral", label: "Referral" },
];

export default function MarketingToolsPage() {
  const { addToast } = useToast();
  const [links, setLinks] = useState<ShortLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [activeTab, setActiveTab] = useState<"builder" | "links">("builder");
  
  // URL Builder State
  const [baseUrl, setBaseUrl] = useState("/request");
  const [utmSource, setUtmSource] = useState("");
  const [utmMedium, setUtmMedium] = useState("");
  const [utmCampaign, setUtmCampaign] = useState("");
  const [utmTerm, setUtmTerm] = useState("");
  const [utmContent, setUtmContent] = useState("");
  
  // Results State
  const [generatedUrl, setGeneratedUrl] = useState("");
  const [shortLink, setShortLink] = useState<ShortLink | null>(null); // Store current session short link
  const [slug, setSlug] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    setLoading(true);
    const result = await getShortLinks();
    if (result.success && result.data) {
      setLinks(result.data);
    }
    setLoading(false);
  };

  const generateUrl = () => {
    if (!utmSource || !utmMedium || !utmCampaign) {
      addToast("Please fill in Source, Medium and Campaign", "error");
      return;
    }

    const params = new URLSearchParams();
    if (utmSource) params.append("utm_source", utmSource);
    if (utmMedium) params.append("utm_medium", utmMedium);
    if (utmCampaign) params.append("utm_campaign", utmCampaign);
    if (utmTerm) params.append("utm_term", utmTerm);
    if (utmContent) params.append("utm_content", utmContent);

    const queryString = params.toString();
    const fullUrl = queryString ? `${baseUrl}?${queryString}` : baseUrl;
    setGeneratedUrl(fullUrl);
    
    // Reset short link state when regenerating long URL
    setShortLink(null);
    setSlug("");
    
    // Generate QR code for LONG URL initially
    const fullDomainUrl = `https://socialbluepro.com${fullUrl}`;
    setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(fullDomainUrl)}`);
  };

  const handleCreateShortLink = async () => {
    if (!slug || !generatedUrl) {
      addToast("Please enter a slug first", "error");
      return;
    }

    setCreating(true);
    const fullDestination = `https://socialbluepro.com${generatedUrl}`;
    
    const result = await createShortLink({
      slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
      destination: fullDestination,
      utm_source: utmSource || undefined,
      utm_medium: utmMedium || undefined,
      utm_campaign: utmCampaign || undefined,
      utm_term: utmTerm || undefined,
      utm_content: utmContent || undefined,
    });

    if (result.success && result.data) {
      addToast("✅ Short link created successfully!", "success");
      setSlug("");
      fetchLinks();
      
      // Update local state to show SHORT LINK
      setShortLink(result.data);
      
      // Update QR Code to point to SHORT LINK
      const shortUrl = `https://socialbluepro.com/r/${result.data.slug}`;
      setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(shortUrl)}`);
    } else {
      addToast(result.error || "Error creating link", "error");
    }
    setCreating(false);
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    addToast("✅ URL copied!", "success");
  };

  const handleDeleteLink = async (id: string) => {
    const result = await deleteShortLink(id);
    if (result.success) {
      addToast("✅ Link removed", "success");
      fetchLinks();
    } else {
      addToast("Error removing link", "error");
    }
  };

  const handleToggleLink = async (id: string) => {
    const result = await toggleShortLink(id);
    if (result.success) {
      addToast("✅ Status updated", "success");
      fetchLinks();
    } else {
      addToast("Error updating status", "error");
    }
  };

  const downloadQR = () => {
    const link = document.createElement("a");
    link.href = qrCodeUrl;
    link.download = `qr-${shortLink ? shortLink.slug : "tracking"}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 space-y-6 pb-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tighter uppercase text-slate-900">Marketing Tools</h1>
          <p className="text-slate-500 text-sm">URL Builder, Link Shortener & QR Generator</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("builder")}
          className={`px-4 py-2 font-bold text-sm uppercase tracking-wider border-b-2 transition-colors ${
            activeTab === "builder" 
              ? "border-accent text-accent" 
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Settings size={16} className="inline mr-2" />
          URL Builder
        </button>
        <button
          onClick={() => setActiveTab("links")}
          className={`px-4 py-2 font-bold text-sm uppercase tracking-wider border-b-2 transition-colors ${
            activeTab === "links" 
              ? "border-accent text-accent" 
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Link2 size={16} className="inline mr-2" />
          My Links ({links.length})
        </button>
      </div>

      {/* URL Builder Tab */}
      {activeTab === "builder" && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Builder Form */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 h-fit">
            <h2 className="text-lg font-black uppercase tracking-tighter text-slate-900 flex items-center gap-2">
              <Globe size={20} />
              URL Builder
            </h2>

            {/* Base URL */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500">Destination Page</label>
              <select
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
              >
                <option value="/request">/request (Main Form)</option>
                <option value="/">/ (Homepage)</option>
              </select>
            </div>

            {/* UTM Source */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500">UTM Source</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={utmSource}
                  onChange={(e) => setUtmSource(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                >
                  <option value="">Select or type</option>
                  {COMMON_SOURCES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={utmSource}
                  onChange={(e) => setUtmSource(e.target.value)}
                  placeholder="Or type..."
                  className="flex-1 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                />
              </div>
            </div>

            {/* UTM Medium */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500">UTM Medium</label>
              <select
                value={utmMedium}
                onChange={(e) => setUtmMedium(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
              >
                <option value="">Select</option>
                {COMMON_MEDIUMS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>

            {/* UTM Campaign */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500">UTM Campaign</label>
              <input
                type="text"
                value={utmCampaign}
                onChange={(e) => setUtmCampaign(e.target.value)}
                placeholder="e.g. summer2026, neighborhood_flyer"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
              />
            </div>

            {/* Optional Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-500">UTM Term (Optional)</label>
                <input
                  type="text"
                  value={utmTerm}
                  onChange={(e) => setUtmTerm(e.target.value)}
                  placeholder="keyword"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-500">UTM Content (Optional)</label>
                <input
                  type="text"
                  value={utmContent}
                  onChange={(e) => setUtmContent(e.target.value)}
                  placeholder="variant"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                />
              </div>
            </div>

            <button
              onClick={generateUrl}
              className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 active:scale-95 flex items-center justify-center gap-2"
            >
              <Settings size={18} /> Generate Tracking URL
            </button>
          </div>

          {/* Generated URL & QR */}
          <div className="space-y-6 w-full min-w-0">
            {/* Generated URL Results */}
            {generatedUrl && (
              <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 space-y-6 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                   <div className={`p-2 rounded-lg ${shortLink ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-600'}`}>
                    {shortLink ? <Link2 size={24} /> : <Share2 size={24} />}
                   </div>
                   <div>
                      <h2 className="text-lg font-black uppercase tracking-tighter text-slate-900 leading-tight">
                        {shortLink ? "Short Link Ready" : "Tracking URL Ready"}
                      </h2>
                      <p className="text-xs text-slate-500 font-medium">
                        {shortLink ? "Use this short link for your campaigns" : "Long URL generated with UTM parameters"}
                      </p>
                   </div>
                </div>
                
                {/* Active URL Display */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {shortLink ? "Active Short Link" : "Long Tracking URL"}
                  </label>
                  <div className={`p-4 rounded-xl border text-sm font-mono break-all whitespace-normal ${
                    shortLink 
                      ? "bg-green-50 border-green-200 text-green-800" 
                      : "bg-slate-50 border-slate-200 text-slate-700"
                  }`}>
                    {shortLink 
                      ? `socialbluepro.com/r/${shortLink.slug}`
                      : `socialbluepro.com${generatedUrl}`
                    }
                  </div>
                  
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => handleCopyUrl(shortLink ? `https://socialbluepro.com/r/${shortLink.slug}` : `https://socialbluepro.com${generatedUrl}`)}
                      className="flex-1 flex items-center justify-center gap-2 bg-slate-900 text-white px-4 py-3 rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10 active:scale-95"
                    >
                      <Copy size={16} />
                      {shortLink ? "Copy Short Link" : "Copy Long URL"}
                    </button>
                  </div>
                </div>

                {/* Create Short Link Section - Only show if NO short link yet */}
                {!shortLink && (
                  <div className="pt-6 border-t border-slate-100 space-y-4 animate-in fade-in slide-in-from-top-4">
                    <div className="flex items-center gap-2 text-accent">
                      <Plus size={16} className="shrink-0" />
                      <h3 className="font-black uppercase tracking-widest text-xs">Create Short Link (Recommended)</h3>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <div className="flex items-center bg-slate-50 px-4 py-3 rounded-xl border border-slate-200 text-slate-500 text-sm whitespace-nowrap">
                          socialbluepro.com/r/
                        </div>
                        <input
                          type="text"
                          value={slug}
                          onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                          placeholder="my-custom-link"
                          className="flex-1 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all min-w-0"
                        />
                      </div>
                      <button
                        onClick={handleCreateShortLink}
                        disabled={creating}
                        className="w-full bg-accent text-white font-bold py-3 rounded-xl uppercase tracking-wider hover:bg-green-600 transition-colors disabled:opacity-50 shadow-lg shadow-green-500/20 active:scale-95"
                      >
                        {creating ? <Loader2 className="animate-spin inline mr-2" size={16} /> : <Plus size={16} className="inline mr-2" />}
                        Generate Short Link & QR
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium text-center">
                      This will also update the QR code below
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* QR Code Card */}
            {qrCodeUrl && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm h-fit">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-4 mb-2">
                   <QrCode size={20} className="text-slate-900" />
                   <h2 className="text-lg font-black uppercase tracking-tighter text-slate-900">
                     QR Code
                   </h2>
                   {shortLink && (
                     <span className="ml-auto bg-green-100 text-green-700 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full">
                       Short Link
                     </span>
                   )}
                </div>
                
                <div className="flex justify-center bg-white p-4 rounded-xl border-2 border-slate-100">
                  <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48 sm:w-56 sm:h-56 object-contain" />
                </div>
                
                <p className="text-center text-xs font-bold text-slate-500">
                  Points to: <span className="text-slate-900">{shortLink ? "Short Link" : "Long URL"}</span>
                </p>

                <button
                  onClick={downloadQR}
                  className="w-full flex items-center justify-center gap-2 bg-slate-100 text-slate-700 px-4 py-3 rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-slate-200 transition-colors active:scale-95"
                >
                  <Download size={16} />
                  Download PNG
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Links List Tab */}
      {activeTab === "links" && (
        <div className="space-y-4">
          {/* Desktop Table */}
          <div className="hidden lg:block bg-white rounded-2xl border border-slate-200 overflow-hidden">
            {loading ? (
              <div className="p-12 text-center">
                <Loader2 className="animate-spin mx-auto text-accent" size={32} />
              </div>
            ) : links.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <Link2 size={48} className="mx-auto mb-4 opacity-50" />
                <p className="font-bold">No links created yet</p>
                <p className="text-sm">Use the URL Builder to create your first link</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-slate-500">Short Link</th>
                    <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-slate-500">Destination</th>
                    <th className="px-6 py-4 text-center text-xs font-black uppercase tracking-widest text-slate-500">Clicks</th>
                    <th className="px-6 py-4 text-center text-xs font-black uppercase tracking-widest text-slate-500">Status</th>
                    <th className="px-6 py-4 text-center text-xs font-black uppercase tracking-widest text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {links.map((link) => (
                    <tr key={link.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <a 
                            href={`https://socialbluepro.com/r/${link.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-bold text-accent hover:underline"
                          >
                            /r/{link.slug}
                          </a>
                          <ExternalLink size={14} className="text-slate-400" />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-600 truncate max-w-[300px]" title={link.destination}>
                          {link.destination.replace("https://socialbluepro.com", "")}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-bold text-slate-700">{link.clicks}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          link.active 
                            ? "bg-green-50 text-green-700" 
                            : "bg-slate-100 text-slate-500"
                        }`}>
                          {link.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleCopyUrl(`https://socialbluepro.com/r/${link.slug}`)}
                            className="p-2 text-slate-500 hover:text-accent hover:bg-slate-100 rounded-lg transition-colors"
                            title="Copy link"
                          >
                            <Copy size={16} />
                          </button>
                          <button
                            onClick={() => handleToggleLink(link.id)}
                            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title={link.active ? "Deactivate" : "Activate"}
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteLink(link.id)}
                            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
            {loading ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
                <Loader2 className="animate-spin mx-auto text-accent" size={32} />
              </div>
            ) : links.length === 0 ? (
              <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
                <Link2 size={48} className="mx-auto mb-4 opacity-50" />
                <p className="font-bold">No links created yet</p>
                <p className="text-sm">Use the URL Builder to create your first link</p>
              </div>
            ) : (
              links.map((link) => (
                <div key={link.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <a 
                        href={`https://socialbluepro.com/r/${link.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-black text-accent text-lg flex items-center gap-2 hover:underline"
                      >
                        /r/{link.slug}
                        <ExternalLink size={14} className="text-slate-400" />
                      </a>
                      <p className="text-xs text-slate-500 truncate max-w-[200px] mt-1">
                        {link.destination.replace("https://socialbluepro.com", "")}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      link.active 
                        ? "bg-green-50 text-green-700" 
                        : "bg-slate-100 text-slate-500"
                    }`}>
                      {link.active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 py-2 border-y border-slate-100">
                    <div className="flex-1 text-center border-r border-slate-100">
                      <span className="block text-[10px] uppercase tracking-widest text-slate-400 font-bold">Clicks</span>
                      <span className="block text-lg font-black text-slate-900">{link.clicks}</span>
                    </div>
                    <div className="flex-1 flex justify-around">
                      <button
                        onClick={() => handleCopyUrl(`https://socialbluepro.com/r/${link.slug}`)}
                        className="p-2 text-slate-400 hover:text-accent bg-slate-50 rounded-lg transition-all"
                      >
                        <Copy size={18} />
                      </button>
                      <button
                        onClick={() => handleToggleLink(link.id)}
                        className="p-2 text-slate-400 hover:text-blue-600 bg-slate-50 rounded-lg transition-all"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteLink(link.id)}
                        className="p-2 text-slate-400 hover:text-red-600 bg-slate-50 rounded-lg transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}


    </div>
  );
}