"use client";

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose
} from "@/components/ui/sheet";

import { 
  History, 
  Settings, 
  Menu, 
  Package, 
  Home,
  RefreshCw,
  BarChart3, FolderTree, ChartArea // Import Icon Chart
} from 'lucide-react';
import { Separator } from './ui/separator';

interface MobileSidebarProps {
  onRefresh: () => void;
}

export default function MobileSidebar({ onRefresh }: MobileSidebarProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden mr-2">
            <Menu className="h-6 w-6 text-slate-700" />
        </Button>
      </SheetTrigger>
      
      <SheetContent side="left" className="w-[300px] sm:w-[400px]">
        <SheetHeader className="text-left mb-6">
          <SheetTitle className="text-xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" />
            Toko Luwes
          </SheetTitle>
          <p className="text-sm text-slate-500">Menu Navigasi</p>
        </SheetHeader>

        <div className="flex flex-col gap-2">
            <SheetClose asChild>
                <Button variant="ghost" className="justify-start h-12 text-base font-normal" asChild>
                    <Link href="/">
                        <Home className="mr-3 h-5 w-5" /> Beranda (POS)
                    </Link>
                </Button>
            </SheetClose>
            
            <Separator className="my-2" />
            
            {/* --- MENU BARU: ANALYTICS --- */}
            <SheetClose asChild>
                <Link href="/admin/analytics">
                    <Button variant="ghost" className="w-full justify-start h-12 text-base font-normal">
                        <BarChart3 className="mr-3 h-5 w-5 text-purple-600" /> 
                        Analytics / Dashboard
                    </Button>
                </Link>
            </SheetClose>
            {/* --------------------------- */}

            <SheetClose asChild>
                <Link href="/transactions">
                    <Button variant="ghost" className="w-full justify-start h-12 text-base font-normal">
                        <History className="mr-3 h-5 w-5 text-blue-600" /> 
                        Riwayat Transaksi
                    </Button>
                </Link>
            </SheetClose>

            <SheetClose asChild>
              <Link href="/admin/settings">
                  <Button variant="ghost" className="w-full justify-start h-12 text-base font-normal">
                      <Settings className="mr-3 h-5 w-5 text-slate-600" /> 
                      Pengaturan Data
                  </Button>
              </Link>
          </SheetClose>

            <SheetClose asChild>
                <Link href="/admin/products">
                    <Button variant="ghost" className="w-full justify-start h-12 text-base font-normal">
                        <Settings className="mr-3 h-5 w-5 text-slate-600" /> 
                        Manajemen Produk
                    </Button>
                </Link>
            </SheetClose>

            <SheetClose asChild>
                <Link href="/admin/grosir">
                    <Button variant="ghost" className="w-full justify-start h-12 text-base font-normal">
                        <FolderTree className="h-4 w-4" /> Pengaturan Harga Grosir
                    </Button>
                 </Link>
            </SheetClose>
            
            <SheetClose asChild>
                <Link href="/admin/analytics">
                    <Button variant="ghost" className="w-full justify-start h-12 text-base font-normal">
                        <ChartArea className="h-4 w-4" /> Analytics
                    </Button>
                    </Link>
            </SheetClose>


            <SheetClose asChild>
                <Button 
                    variant="ghost" 
                    className="justify-start h-12 text-base font-normal text-slate-600"
                    onClick={onRefresh}
                >
                    <RefreshCw className="mr-3 h-5 w-5" /> 
                    Refresh Data
                </Button>
            </SheetClose>
            
        </div>
      </SheetContent>
    </Sheet>
  );
}