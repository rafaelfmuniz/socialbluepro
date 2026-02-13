"use client";

import { useState, useEffect } from "react";
import { AlertCircle, CheckCircle, RefreshCw } from "lucide-react";

interface VersionInfo {
  current: string;
  latest: string;
  upToDate: boolean;
  releaseUrl?: string;
}

export function VersionBadge() {
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const [loading, setLoading] = useState(false);

  const currentVersion = process.env.NEXT_PUBLIC_VERSION || "2.3.1";

  useEffect(() => {
    checkVersion();
  }, []);

  const checkVersion = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/version");
      if (response.ok) {
        const data = await response.json();
        setVersionInfo(data);
      }
    } catch (error) {
      console.error("[VERSION] Error checking version:", error);
    } finally {
      setLoading(false);
    }
  };

  const hasUpdate = versionInfo && !versionInfo.upToDate;

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-gray-400">
        v{currentVersion}
      </span>
      
      {hasUpdate && (
        <a
          href={versionInfo?.releaseUrl || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-full hover:bg-amber-500/30 transition-colors"
          title={`Nova versão disponível: v${versionInfo?.latest}`}
        >
          <AlertCircle className="w-3 h-3" />
          <span>v{versionInfo?.latest} disponível</span>
        </a>
      )}
      
      {versionInfo?.upToDate && (
        <span className="flex items-center gap-1 text-green-400">
          <CheckCircle className="w-3 h-3" />
          <span>Atualizado</span>
        </span>
      )}
      
      <button
        onClick={checkVersion}
        disabled={loading}
        className="p-1 hover:bg-gray-700 rounded transition-colors disabled:opacity-50"
        title="Verificar atualizações"
      >
        <RefreshCw className={`w-3 h-3 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
      </button>
    </div>
  );
}

export function VersionBadgeSimple() {
  const currentVersion = process.env.NEXT_PUBLIC_VERSION || "2.3.1";
  
  return (
    <span className="text-xs text-gray-500">
      v{currentVersion}
    </span>
  );
}
