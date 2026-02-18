// app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Lato } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner"; // <--- Import ini

const inter = Inter({ subsets: ["latin"] });

const openSans = Lato({ subsets: ["latin"], weight: ["700"] })

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false
}

export const metadata: Metadata = {
  title: "Toko Luwes Cashier",
  description: "Point of Sales System",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/logo/512.png", // Logo khusus jika di-install di iPhone/iPad
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Toko Luwes",
  }, 
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={openSans.className}>
        {children}
        <Toaster /> {/* <--- Pasang di sini, biasanya di bawah children */}
      </body>
    </html>
  );
}