// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner"; // <--- Import ini

const inter = Inter({ subsets: ["latin"] });

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
      <body className={inter.className}>
        {children}
        <Toaster /> {/* <--- Pasang di sini, biasanya di bawah children */}
      </body>
    </html>
  );
}