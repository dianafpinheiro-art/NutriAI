import { useState, useRef, useEffect } from "react";
import { X, Star, Check, Zap } from "lucide-react";
import { toast } from "sonner";
import { authFetch } from "../authFetch";
import { startTrial } from "../dataHooks";
import { t } from "../i18n";
import type { Locale } from "../types";

interface SubscriptionPlansProps {
  userId: string;
  locale: Locale;
  onClose: () => void;
  currentStatus?: string; // 'free' | 'trial' | 'active' | 'trial_expired'
}

export default function SubscriptionPlans({ userId, locale, onClose, currentStatus }: SubscriptionPlansProps) {
  const [loading, setLoading] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);

  const isUrgent = currentStatus === "trial_expired";

  useEffect(() => {
    setTimeout(() => {
      firstFocusableRef.current?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "Tab" && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleStartTrial = async (plan: "monthly" | "annual") => {
    if (!userId) return;
    setLoading(true);
    try {
      await startTrial(userId);
      const res = await authFetch("/api/payments/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Nao foi possivel abrir o checkout.");
      }
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error("Checkout nao retornou link de pagamento.");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[SubscriptionPlans] trial start failed:", message);
      toast.error("Nao consegui abrir o checkout", {
        description: message,
      });
    } finally {
      setLoading(false);
    }
  };

  const features = [
    t(locale, "subscriptionFeatureMenu"),
    t(locale, "subscriptionFeaturePantry"),
    t(locale, "subscriptionFeatureSymptoms"),
    t(locale, "subscriptionFeaturePrescription"),
    t(locale, "subscriptionFeatureLabels"),
  ];

  const annualFeatures = [
    ...features,
    t(locale, "subscriptionFeatureNutritionist"),
  ];

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="subscription-title"
      ref={modalRef}
    >
      <div className="relative bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-pink-100 flex flex-col max-h-[92vh] overflow-hidden animate-fade-in-up">
        <div className="p-6 border-b border-stone-50 bg-gradient-to-r from-pink-500/5 to-purple-500/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-pink-500 to-purple-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-pink-100">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 id="subscription-title" className="text-lg font-extrabold tracking-tight text-stone-800 font-heading">
                {t(locale, "subscriptionTitle")}
              </h2>
              <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider">
                {t(locale, "subscriptionSubtitle")}
              </p>
            </div>
          </div>
          <button
            ref={firstFocusableRef}
            onClick={onClose}
            className="p-2 rounded-full hover:bg-stone-50 text-stone-400 hover:text-stone-600 transition-colors touch-target"
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isUrgent && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-xs font-bold text-center">
              {t(locale, "subscriptionTrialExpired")}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Monthly Plan */}
            <div className="flex flex-col gap-5 p-5 bg-white border border-stone-100 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
                  {t(locale, "monthlyPlan")}
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-extrabold text-stone-800 font-heading">R$ 19,90</span>
                  <span className="text-xs text-stone-400 font-semibold">/mês</span>
                </div>
                <p className="text-[11px] text-stone-500 font-medium">
                  {t(locale, "monthlyPlanDescription")}
                </p>
              </div>

              <ul className="flex flex-col gap-2.5">
                {features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-stone-600 font-medium">
                    <Check className="w-4 h-4 text-pink-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleStartTrial("monthly")}
                disabled={loading}
                className="w-full mt-auto py-3 bg-stone-800 hover:bg-stone-900 text-white font-extrabold text-xs rounded-2xl shadow-sm btn-interactive disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? t(locale, "loading") : t(locale, "startTrial")}
              </button>
            </div>

            {/* Annual Plan (recommended) */}
            <div className="relative flex flex-col gap-5 p-5 bg-white border-2 border-pink-300 rounded-3xl shadow-md hover:shadow-lg transition-shadow">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-[10px] font-extrabold uppercase tracking-wider rounded-full shadow-sm">
                  <Star className="w-3 h-3 fill-white" />
                  {t(locale, "annualBadge")}
                </span>
              </div>

              <div className="flex flex-col gap-1 pt-1">
                <span className="text-xs font-bold uppercase tracking-wider text-pink-500">
                  {t(locale, "annualPlan")}
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-extrabold text-stone-800 font-heading">R$ 149,90</span>
                  <span className="text-xs text-stone-400 font-semibold">/ano</span>
                </div>
                <p className="text-[11px] text-pink-600 font-medium">
                  {t(locale, "annualPlanDescription")}
                </p>
              </div>

              <ul className="flex flex-col gap-2.5">
                {annualFeatures.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-stone-600 font-medium">
                    <Check className="w-4 h-4 text-pink-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleStartTrial("annual")}
                disabled={loading}
                className="w-full mt-auto py-3 bg-gradient-to-r from-pink-500 to-purple-500 hover:opacity-95 text-white font-extrabold text-xs rounded-2xl shadow-md shadow-pink-100 btn-interactive disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? t(locale, "loading") : t(locale, "startTrial")}
              </button>
            </div>
          </div>

          {currentStatus === "free" && (
            <div className="text-center">
              <button
                onClick={onClose}
                className="text-xs text-stone-400 hover:text-stone-600 font-semibold underline"
              >
                {t(locale, "continueFree")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
