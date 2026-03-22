"use client";
import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Fungsi untuk cek titipan di window
    const checkPrompt = () => {
      const savedPrompt = (window as any).deferredPWA;
      if (savedPrompt) {
        setDeferredPrompt(savedPrompt);
      }
    };

    // 1. Cek saat komponen ini baru muncul
    checkPrompt();

    // 2. Dengar jika event baru saja masuk
    window.addEventListener("pwa-ready", checkPrompt);
    
    // Support jika browser telat nembak event-nya
    const handlePrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handlePrompt);

    return () => {
      window.removeEventListener("pwa-ready", checkPrompt);
      window.removeEventListener("beforeinstallprompt", handlePrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
      (window as any).deferredPWA = null;
    }
  };

  // Tombol hanya muncul jika prompt sudah ditangkap
  if (!deferredPrompt) return null;

  return (
    <Button 
      onClick={handleInstallClick}
      variant="ghost" 
      className="w-full justify-start h-12 text-base font-normal text-blue-600 hover:bg-blue-50"
    >
      <Download className="mr-3 h-5 w-5" />
      Install App
    </Button>
  );
}