import { Info } from "lucide-react";
import { t } from "../i18n";
import type { Locale } from "../types";

interface MedicalDisclaimerProps {
  locale: Locale;
  /** "inline" = texto discreto; "card" = caixa destacada com ícone. */
  variant?: "inline" | "card";
  className?: string;
}

export default function MedicalDisclaimer({
  locale,
  variant = "inline",
  className = "",
}: MedicalDisclaimerProps) {
  if (variant === "card") {
    return (
      <div
        className={`flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-[11px] leading-relaxed font-medium ${className}`}
        role="note"
      >
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <span>{t(locale, "medicalDisclaimer")}</span>
      </div>
    );
  }

  return (
    <p
      className={`text-[11px] leading-relaxed text-stone-400 text-center ${className}`}
      role="note"
    >
      {t(locale, "medicalDisclaimer")}
    </p>
  );
}
