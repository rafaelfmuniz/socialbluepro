import { RefreshCw, Wifi } from "lucide-react";

export interface LiveIndicatorProps {
  isPolling: boolean;
  lastUpdate: Date | null;
  onRefresh: () => void;
  refreshLoading?: boolean;
  showLabel?: boolean;
}

export function LiveIndicator({
  isPolling,
  lastUpdate,
  onRefresh,
  refreshLoading = false,
  showLabel = true
}: LiveIndicatorProps) {
  const formatLastUpdate = (date: Date | null): string => {
    if (!date) return "Never";
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);

    if (diffSecs < 5) return "Just now";
    if (diffSecs < 60) return `${diffSecs}s ago`;
    if (diffMins < 60) return `${diffMins}m ago`;
    return date.toLocaleTimeString();
  };

  return (
    <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
      {showLabel && (
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isPolling ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`} />
          <span className="text-xs font-black uppercase tracking-widest text-slate-600">
            {isPolling ? 'Live' : 'Offline'}
          </span>
        </div>
      )}

      <div className="h-4 w-px bg-slate-200" />

      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Wifi size={14} className={isPolling ? 'text-green-500' : 'text-slate-400'} />
        <span className="font-medium">Updated: {formatLastUpdate(lastUpdate)}</span>
      </div>

      <button
        onClick={onRefresh}
        disabled={refreshLoading}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        title="Refresh data"
      >
        <RefreshCw size={14} className={refreshLoading ? "animate-spin" : ""} />
        <span>Refresh</span>
      </button>
    </div>
  );
}
