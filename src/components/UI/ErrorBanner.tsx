import React from 'react';
import { AlertTriangle, RefreshCw, SlidersHorizontal } from 'lucide-react';

interface ErrorBannerProps {
  error: string | null;
  isRetrying: boolean;
  onRetry: () => void;
  useNormalizedUrl: boolean;
  onToggleNormalizedUrl: () => void;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  error,
  isRetrying,
  onRetry,
  useNormalizedUrl,
  onToggleNormalizedUrl,
}) => {
  if (!error) return null;

  return (
    <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 w-full max-w-lg px-4 pointer-events-auto animate-in slide-in-from-top duration-300">
      <div className="bg-red-950/90 backdrop-blur-md border border-red-500/60 rounded-xl p-4 shadow-2xl text-slate-100 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-red-900/60 border border-red-500/50 flex items-center justify-center shrink-0 mt-0.5">
          <AlertTriangle className="w-4 h-4 text-red-400" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-mono-sci font-bold text-xs text-red-200 uppercase tracking-wider mb-1">
            NASA Trek WMTS Stream Advisory
          </div>
          <p className="text-xs text-red-300/90 leading-relaxed mb-3 font-sans">
            {error || 'Unable to stream Mars surface imagery from NASA Trek WMTS. Check your internet connectivity or proxy configuration.'}
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onRetry}
              disabled={isRetrying}
              className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-mono-sci text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-md"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
              <span>{isRetrying ? 'Connecting to NASA...' : 'Retry Stream'}</span>
            </button>

            <button
              onClick={onToggleNormalizedUrl}
              className="px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-300 font-mono-sci text-xs flex items-center gap-1.5 transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-orange-400" />
              <span>Switch to {useNormalizedUrl ? 'Advertised (//)' : 'Normalized (/)'} URL</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

