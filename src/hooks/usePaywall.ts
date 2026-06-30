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

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    getSubscriptionStatus(userId).then((data) => {
      if (cancelled) return;
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

    return () => { cancelled = true; };
  }, [userId]);

  return state;
}
