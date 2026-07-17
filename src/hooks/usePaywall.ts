import { useState, useEffect } from "react";
import { getSubscriptionStatus } from "../dataHooks";

export interface PaywallState {
  isPremium: boolean;
  isTrial: boolean;
  status: string;
  showPaywall: boolean;
  trialEndsAt: string | null;
  plan: string | null;
}

export function usePaywall(userId: string): PaywallState {
  const [state, setState] = useState<PaywallState>({
    isPremium: false,
    isTrial: false,
    status: "free",
    showPaywall: false,
    trialEndsAt: null,
    plan: null,
  });

  const refresh = (uid: string) => {
    getSubscriptionStatus(uid).then((data) => {
      const isActive = data.status === "active" || data.status === "trial";
      const isTrial = data.status === "trial";
      setState({
        isPremium: isActive,
        isTrial,
        status: data.status,
        showPaywall: !isActive,
        trialEndsAt: data.trialEndsAt ?? null,
        plan: data.plan ?? null,
      });
    });
  };

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    // Initial fetch
    refresh(userId);

    // Re-check status when the tab becomes visible again (user returning from MP checkout)
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && !cancelled) {
        refresh(userId);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    // Also re-check on window focus (covers some mobile browsers)
    const handleFocus = () => {
      if (!cancelled) refresh(userId);
    };
    window.addEventListener("focus", handleFocus);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleFocus);
    };
  }, [userId]);

  return state;
}
