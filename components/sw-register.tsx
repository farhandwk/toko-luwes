"use client";
import { useEffect } from "react";

export default function SWRegister() {
  useEffect(() => {
    // 1. Registrasi SW
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js");
    }

    // 2. Tangkap event install dan titipkan di window (global)
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      (window as any).deferredPWA = e;
      // Beritahu komponen lain bahwa prompt sudah siap
      window.dispatchEvent(new Event("pwa-ready"));
    });
  }, []);

  return null;
}