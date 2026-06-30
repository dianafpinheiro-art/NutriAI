import { useState, useEffect } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";

export default function InstallPwaBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches 
      || (window.navigator as any).standalone;

    if (isStandalone) return;

    const visits = localStorage.getItem("nutri_visit_count");
    const currentVisits = visits ? parseInt(visits, 10) : 0;
    const nextVisits = currentVisits + 1;
    localStorage.setItem("nutri_visit_count", nextVisits.toString());

    const dismissedUntil = localStorage.getItem("nutri_install_dismissed");
    const isDismissed = dismissedUntil && new Date().getTime() < parseInt(dismissedUntil, 10);

    if (nextVisits >= 2 && !isDismissed) {
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleInstallClick = () => {
    toast.info("Para instalar:", {
      description: "• No Android/Chrome: Clique nos 3 pontinhos e toque em 'Instalar App'.\n• No iOS/Safari: Clique em 'Compartilhar' e escolha 'Adicionar à Tela de Início'.",
      duration: 10000,
    });
    setShowBanner(false);
  };

  const handleDismiss = () => {
    const expiry = new Date().getTime() + 604800000;
    localStorage.setItem("nutri_install_dismissed", expiry.toString());
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-md bg-white border border-pink-100 shadow-2xl rounded-2xl p-4 flex items-center justify-between gap-3 animate-bounce shadow-pink-100 mb-safe animate-duration-1000">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-pink-50 text-pink-500 rounded-xl">
          <Download className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-heading font-bold text-sm text-gray-900 leading-tight">Instalar PersonalDiet?</h4>
          <p className="font-body text-xs text-text-gray-500 mt-0.5">Acesse instantaneamente da tela inicial em modo offline!</p>
        </div>
      </div>
      
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleDismiss}
          className="p-2 px-2.5 rounded-lg text-gray-400 hover:bg-gray-50 text-xs font-medium transition-all touch-target"
        >
          Dispensar
        </button>
        <button
          onClick={handleInstallClick}
          className="px-3.5 py-1.5 bg-pink-500 hover:bg-pink-600 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-sm shadow-pink-100 btn-interactive touch-target"
        >
          Instalar
        </button>
      </div>
    </div>
  );
}
