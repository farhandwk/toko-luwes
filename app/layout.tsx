// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Lato } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner"; // <--- Import ini

const inter = Inter({ subsets: ["latin"] });

const openSans = Lato({ subsets: ["latin"], weight: ["700"] })

export const metadata: Metadata = {
  title: "POS Toko",
  description: "Point of Sales System",
  manifest: "/manifest.json", 
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