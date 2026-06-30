import { Lock, Zap, X } from "lucide-react";
import { t } from "../i18n";
import type { Locale } from "../types";

interface PaywallOverlayProps {
  featureName: string;
  locale: Locale;
  onSubscribe: () => void;
  onClose: () => void;
}

export default function PaywallOverlay({ featureName, locale, onSubscribe, onClose }: PaywallOverlayProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-stone-900/50 backdrop-blur-sm p-4">
      <div className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-pink-100 p-6 flex flex-col gap-5 animate-fade-in-up">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-2 rounded-full hover:bg-stone-50 text-stone-400 hover:text-stone-600 transition-colors touch-target"
          aria-label="Fechar"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-14 h-14 bg-gradient-to-tr from-pink-400 to-purple-400 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-pink-200">
            <Lock className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-extrabold text-stone-800 font-heading">
              {t(locale, "paywallTitle", { feature: featureName })}
            </h3>
            <p className="text-xs text-stone-500 leading-relaxed max-w-xs mx-auto">
              {t(locale, "paywallDescription", { feature: featureName })}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <button
            onClick={onSubscribe}
            className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-500 hover:opacity-95 text-white font-extrabold text-xs rounded-2xl shadow-md shadow-pink-100 btn-interactive flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4" />
            {t(locale, "viewPlans")}
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 border border-stone-200 hover:bg-stone-50 text-stone-500 font-bold text-xs rounded-2xl transition-all"
          >
            {t(locale, "maybeLater")}
          </button>
        </div>
      </div>
    </div>
  );
}
