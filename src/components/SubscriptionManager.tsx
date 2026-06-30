import { Crown, Calendar, AlertTriangle, Zap } from "lucide-react";
import { t } from "../i18n";
import type { Locale } from "../types";

interface SubscriptionManagerProps {
  status: string;
  trialEndsAt: string | null;
  plan: string | null;
  locale: Locale;
  onOpenPlans: () => void;
}

export default function SubscriptionManager({ status, trialEndsAt, plan, locale, onOpenPlans }: SubscriptionManagerProps) {
  const daysLeft = trialEndsAt
    ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  const isTrial = status === "trial";
  const isActive = status === "active";
  const isExpired = status === "trial_expired";
  const isFree = status === "free" || (!isTrial && !isActive && !isExpired);

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-pink-100 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-tr from-pink-500 to-purple-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-pink-100">
          <Crown className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-extrabold text-stone-800 font-heading">
            {t(locale, "manageSubscription")}
          </h3>
          <p className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider">
            PersonalDiet Premium
          </p>
        </div>
      </div>

      {isTrial && (
        <div className="p-3 bg-pink-50 border border-pink-100 rounded-2xl text-pink-800 text-xs font-medium flex items-center gap-2">
          <Calendar className="w-4 h-4 shrink-0" />
          {t(locale, "trialEndsIn", { days: daysLeft })}
        </div>
      )}

      {isActive && (
        <div className="p-3 bg-green-50 border border-green-100 rounded-2xl text-green-800 text-xs font-medium flex items-center gap-2">
          <Crown className="w-4 h-4 shrink-0" />
          {t(locale, "premiumActive", { plan: plan === "annual" ? t(locale, "annualPlan") : t(locale, "monthlyPlan") })}
        </div>
      )}

      {(isExpired || isFree) && (
        <div className="p-3 bg-amber-50 border border-amber-100 rounded-2xl text-amber-800 text-xs font-medium flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {isExpired ? t(locale, "subscriptionTrialExpired") : t(locale, "activatePremium")}
        </div>
      )}

      <button
        onClick={onOpenPlans}
        className="w-full py-2.5 bg-gradient-to-r from-pink-500 to-purple-500 hover:opacity-95 text-white font-bold text-xs rounded-2xl shadow-sm shadow-pink-100 btn-interactive flex items-center justify-center gap-2"
      >
        <Zap className="w-4 h-4" />
        {isActive ? t(locale, "changePlan") : t(locale, "activatePremium")}
      </button>
    </div>
  );
}
