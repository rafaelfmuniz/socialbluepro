"use client";

import { useState, useEffect } from "react";
import { 
  Link2, QrCode, ExternalLink, Copy, Trash2, Plus, Eye, 
  Download, Loader2, CheckCircle, Settings, Globe, Share2
} from "lucide-react";
import { createShortLink, getShortLinks, deleteShortLink, toggleShortLink, ShortLink } from "@/actions/shortlinks";
import { useToast } from "@/lib/toast";


const COMMON_SOURCES = [
  { value: "panfleto", label: "Panfleto (Offline)" },
  { value: "google_ads", label: "Google Ads" },
  { value: "facebook", label: "Facebook Ads" },
  { value: "instagram", label: "Instagram Ads" },
  { value: "email", label: "Email Marketing" },
  { value: "referral", label: "Indicação" },
];

const COMMON_MEDIUMS = [
  { value: "cpc", label: "CPC (Pago)" },
  { value: "offline", label: "Offline (Físico)" },
  { value: "email", label: "Email" },
  { value: "social", label: "Social Media" },
  { value: "referral", label: "Indicação" },
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
  const [generatedUrl, setGeneratedUrl] = useState("");
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
    const params = new URLSearchParams();
    if (utmSource) params.append("utm_source", utmSource);
    if (utmMedium) params.append("utm_medium", utmMedium);
    if (utmCampaign) params.append("utm_campaign", utmCampaign);
    if (utmTerm) params.append("utm_term", utmTerm);
    if (utmContent) params.append("utm_content", utmContent);

    const queryString = params.toString();
    const fullUrl = queryString ? `${baseUrl}?${queryString}` : baseUrl;
    setGeneratedUrl(fullUrl);
    
    // Generate QR code URL
    const fullDomainUrl = `https://socialbluepro.com${fullUrl}`;
    setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(fullDomainUrl)}`);
  };

  const handleCreateShortLink = async () => {
    if (!slug || !generatedUrl) {
      addToast("Preencha o slug e gere a URL primeiro", "error");
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

    if (result.success) {
      addToast("✅ Link curto criado com sucesso!", "success");
      setSlug("");
      fetchLinks();
    } else {
      addToast(result.error || "Erro ao criar link", "error");
    }
    setCreating(false);
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    addToast("✅ URL copiada!", "success");
  };

  const handleDeleteLink = async (id: string) => {
    const result = await deleteShortLink(id);
    if (result.success) {
      addToast("✅ Link removido", "success");
      fetchLinks();
    } else {
      addToast("Erro ao remover link", "error");
    }
  };

  const handleToggleLink = async (id: string) => {
    const result = await toggleShortLink(id);
    if (result.success) {
      addToast("✅ Status atualizado", "success");
      fetchLinks();
    } else {
      addToast("Erro ao atualizar status", "error");
    }
  };

  const downloadQR = () => {
    const link = document.createElement("a");
    link.href = qrCodeUrl;
    link.download = `qr-${slug || "link"}.png`;
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
          Meus Links ({links.length})
        </button>
      </div>

      {/* URL Builder Tab */}
      {activeTab === "builder" && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Builder Form */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
            <h2 className="text-lg font-black uppercase tracking-tighter text-slate-900 flex items-center gap-2">
              <Globe size={20} />
              URL Builder
            </h2>

            {/* Base URL */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500">Página de Destino</label>
              <select
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
              >
                <option value="/request">/request (Formulário Principal)</option>
                <option value="/">/ (Homepage)</option>
              </select>
            </div>

            {/* UTM Source */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500">UTM Source (Origem)</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={utmSource}
                  onChange={(e) => setUtmSource(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                >
                  <option value="">Selecione ou digite</option>
                  {COMMON_SOURCES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={utmSource}
                  onChange={(e) => setUtmSource(e.target.value)}
                  placeholder="Ou digite..."
                  className="flex-1 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                />
              </div>
            </div>

            {/* UTM Medium */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500">UTM Medium (Mídia)</label>
              <select
                value={utmMedium}
                onChange={(e) => setUtmMedium(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
              >
                <option value="">Selecione</option>
                {COMMON_MEDIUMS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>

            {/* UTM Campaign */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500">UTM Campaign (Campanha)</label>
              <input
                type="text"
                value={utmCampaign}
                onChange={(e) => setUtmCampaign(e.target.value)}
                placeholder="ex: verao2026, panfleto_bairro_x"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
              />
            </div>

            {/* Optional Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-500">UTM Term (Opcional)</label>
                <input
                  type="text"
                  value={utmTerm}
                  onChange={(e) => setUtmTerm(e.target.value)}
                  placeholder="palavra-chave"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-500">UTM Content (Opcional)</label>
                <input
                  type="text"
                  value={utmContent}
                  onChange={(e) => setUtmContent(e.target.value)}
                  placeholder="variante"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                />
              </div>
            </div>

            <button
              onClick={generateUrl}
              className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 active:scale-95 flex items-center justify-center gap-2"
            >
              <Settings size={18} /> Gerar URL Rastreável
            </button>
          </div>

          {/* Generated URL & QR */}
          <div className="space-y-6">
            {/* Generated URL */}
            {generatedUrl && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
                <h2 className="text-lg font-black uppercase tracking-tighter text-slate-900 flex items-center gap-2">
                  <Share2 size={20} />
                  URL Gerada
                </h2>
                
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <p className="text-sm font-mono text-slate-700 break-all">
                    socialbluepro.com{generatedUrl}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleCopyUrl(`https://socialbluepro.com${generatedUrl}`)}
                    className="flex-1 flex items-center justify-center gap-2 bg-slate-900 text-white px-4 py-3 rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-slate-800 transition-colors"
                  >
                    <Copy size={16} />
                    Copiar URL
                  </button>
                </div>

                {/* Short Link Creator */}
                <div className="pt-4 border-t border-slate-200 space-y-4">
                  <h3 className="font-black uppercase tracking-widest text-slate-500 text-xs">Criar Link Curto</h3>
                  <div className="flex gap-2">
                    <div className="flex items-center bg-slate-50 px-4 rounded-xl border border-slate-200 text-slate-500 text-sm">
                      socialbluepro.com/r/
                    </div>
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                      placeholder="meu-link"
                      className="flex-1 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900"
                    />
                  </div>
                  <button
                    onClick={handleCreateShortLink}
                    disabled={creating}
                    className="w-full bg-accent text-white font-bold py-3 rounded-xl uppercase tracking-wider hover:bg-green-600 transition-colors disabled:opacity-50"
                  >
                    {creating ? <Loader2 className="animate-spin inline mr-2" size={16} /> : <Plus size={16} className="inline mr-2" />}
                    Criar Link Curto
                  </button>
                </div>
              </div>
            )}

            {/* QR Code */}
            {qrCodeUrl && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
                <h2 className="text-lg font-black uppercase tracking-tighter text-slate-900 flex items-center gap-2">
                  <QrCode size={20} />
                  QR Code
                </h2>
                
                <div className="flex justify-center bg-white p-4 rounded-xl border border-slate-200">
                  <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
                </div>

                <button
                  onClick={downloadQR}
                  className="w-full flex items-center justify-center gap-2 bg-slate-100 text-slate-700 px-4 py-3 rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-slate-200 transition-colors"
                >
                  <Download size={16} />
                  Download QR Code (PNG)
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
                <p className="font-bold">Nenhum link criado ainda</p>
                <p className="text-sm">Use o URL Builder para criar seu primeiro link</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-slate-500">Link Curto</th>
                    <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-slate-500">Destino</th>
                    <th className="px-6 py-4 text-center text-xs font-black uppercase tracking-widest text-slate-500">Cliques</th>
                    <th className="px-6 py-4 text-center text-xs font-black uppercase tracking-widest text-slate-500">Status</th>
                    <th className="px-6 py-4 text-center text-xs font-black uppercase tracking-widest text-slate-500">Ações</th>
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
                          {link.active ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleCopyUrl(`https://socialbluepro.com/r/${link.slug}`)}
                            className="p-2 text-slate-500 hover:text-accent hover:bg-slate-100 rounded-lg transition-colors"
                            title="Copiar link"
                          >
                            <Copy size={16} />
                          </button>
                          <button
                            onClick={() => handleToggleLink(link.id)}
                            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title={link.active ? "Desativar" : "Ativar"}
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteLink(link.id)}
                            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Excluir"
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
                <p className="font-bold">Nenhum link criado ainda</p>
                <p className="text-sm">Use o URL Builder para criar seu primeiro link</p>
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
                      {link.active ? "Ativo" : "Inativo"}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 py-2 border-y border-slate-100">
                    <div className="flex-1 text-center border-r border-slate-100">
                      <span className="block text-[10px] uppercase tracking-widest text-slate-400 font-bold">Cliques</span>
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
