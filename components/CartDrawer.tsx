"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useCartStore } from '@/hooks/useCart';
import { formatRupiah } from '@/utils/currency';
import { getWIBDate } from '@/utils/date';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import { 
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { Separator } from '@/components/ui/separator';
import { Trash2, ShoppingCart, Plus, Minus, Loader2, Send, Share2, Download, Info } from 'lucide-react'; 
import { toast } from "sonner";
import { toPng } from 'html-to-image';
import Receipt from './Receipt';

interface CartDrawerProps {
  onCheckoutSuccess?: () => void;
}

const CartDrawer: React.FC<CartDrawerProps> = ({ onCheckoutSuccess }) => {
  const { items, addItem, decreaseQty, removeItem, clearCart, totalPrice } = useCartStore();
  const total = totalPrice();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [receiptData, setReceiptData] = useState({ id: '', date: '' });
  const receiptRef = useRef<HTMLDivElement>(null);

  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [cashReceived, setCashReceived] = useState<number | ''>('');

  // STATE BARU
  const [receiptBlob, setReceiptBlob] = useState<Blob | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [manualPhone, setManualPhone] = useState("");
  const [lastTxId, setLastTxId] = useState(""); 
  // Kita hapus lastProofLink karena tidak boleh ditampilkan ke customer

  const change = (paymentMethod === "Cash" && typeof cashReceived === 'number') 
    ? cashReceived - total 
    : 0;

  const isPaymentValid = () => {
    if (items.length === 0) return false;
    if (paymentMethod === "Cash") {
        return (typeof cashReceived === 'number' && cashReceived >= total);
    }
    return true;
  };

  useEffect(() => {
    if (isOpen) {
        setReceiptData({
            id: `TRX-${Date.now()}`,
            date: getWIBDate()
        });
        setCashReceived('');
        setPaymentMethod("Cash");
        setReceiptBlob(null);
        setManualPhone("");
    }
  }, [isOpen]);

  // --- 1. LOGIC DOWNLOAD MANUAL (Tombol Samping Input) ---
  const handleDownloadImage = () => {
    if (!receiptBlob) {
        toast.error("Struk belum siap");
        return;
    }

    const link = document.createElement('a');
    link.href = URL.createObjectURL(receiptBlob);
    link.download = `struk-${lastTxId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Struk tersimpan di folder Download!");
  };

  // --- 2. LOGIC SHARE / BUKA WA (Tombol Hijau) ---
  const handleOpenWhatsApp = async () => {
    if (!receiptBlob) {
        toast.error("Gagal memuat gambar struk");
        return;
    }

    // A. Persiapan File & Link
    const file = new File([receiptBlob], `struk-${lastTxId}.png`, { type: "image/png" });
    
    // Format Nomor HP
    let phone = manualPhone.replace(/\D/g, '');
    if (phone.startsWith('0')) phone = '62' + phone.slice(1);
    
    // Pesan Sopan
    const messageText = encodeURIComponent(`Halo Kak, terima kasih sudah berbelanja.\nBerikut kami lampirkan struk transaksinya ya 👇`);
    
    // URL wa.me
    const waUrl = phone 
        ? `https://wa.me/${phone}?text=${messageText}`
        : `https://wa.me/?text=${messageText}`;

    // DETEKSI APAKAH INI HP/TABLET?
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // B. MODE HP: Coba Share Native (Hanya jika HP dan Support Share)
    if (isMobile && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
            await navigator.share({
                files: [file],
                title: 'Struk Belanja',
                text: `Struk Transaksi ${lastTxId}`
            });
            toast.success("Membuka WhatsApp...");
        } catch (error) {
            console.log("Share dibatalkan user");
        }
    } 
    // C. MODE LAPTOP: Paksa Buka WA Web (Link Saja)
    else {
        // Langsung buka WA Web tanpa mencoba share native Windows yang error
        window.open(waUrl, '_blank');
        toast.info("WhatsApp terbuka! Silakan drag & drop struk yang sudah didownload.");
    }
  };

  const handleCheckout = async () => {
    if (!isPaymentValid()) return;
    
    setIsLoading(true);
    try {
      let proofLink = '';
      let currentBlob: Blob | null = null;
      
      // GENERATE FOTO
      if (receiptRef.current) {
        try {
          await new Promise(resolve => setTimeout(resolve, 100));
          const dataUrl = await toPng(receiptRef.current, { cacheBust: true, backgroundColor: '#ffffff' });
          const res = await fetch(dataUrl);
          currentBlob = await res.blob();
          setReceiptBlob(currentBlob);
          
          if (currentBlob) {
            const formData = new FormData();
            formData.append('file', currentBlob, 'struk.png');
            // Tetap upload ke server buat arsip Admin, TAPI tidak dikasih ke customer
            const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
            const uploadData = await uploadRes.json();
            if (uploadData.success) proofLink = uploadData.fileUrl;
          }
        } catch (imgError) {
          console.error("Gagal generate gambar:", imgError);
        }
      }

      // SIMPAN DB
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items,
          total: total,
          paymentMethod: paymentMethod,
          proofLink: proofLink,
          date: receiptData.date
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("Transaksi Sukses!");
        setLastTxId(result.transactionId || receiptData.id);
        
        setShowSuccessDialog(true);
        clearCart();
        if (onCheckoutSuccess) onCheckoutSuccess();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error(error);
      toast.error("Gagal Checkout");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button className="relative">
            <ShoppingCart className="mr-2 h-4 w-4" />
            Keranjang
            {items.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {items.reduce((acc, item) => acc + item.qty, 0)}
              </span>
            )}
          </Button>
        </SheetTrigger>
        
        <SheetContent className="flex flex-col h-full w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Keranjang Belanja</SheetTitle>
          </SheetHeader>
          <Separator className="my-4" />

          {/* List Item */}
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {items.length === 0 ? (
              <p className="text-center text-gray-500 mt-10">Keranjang masih kosong.</p>
            ) : (
              items.map((item) => (
                <div key={item.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg">
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{item.name}</p>
                    <p className="text-xs text-gray-500">{formatRupiah(item.price)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => decreaseQty(item.id)}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="text-sm font-bold w-4 text-center">{item.qty}</span>
                    <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => addItem(item)}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 ml-2" onClick={() => removeItem(item.id)}>
                      <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
          
           {/* AREA PEMBAYARAN */}
          <div className="mt-auto pt-4 bg-white space-y-4">
              <Separator />
              <div className="space-y-2">
                  <Label>Metode Pembayaran</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger><SelectValue placeholder="Pilih metode" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Cash">Tunai (Cash)</SelectItem>
                        <SelectItem value="QRIS">QRIS</SelectItem>
                        <SelectItem value="Transfer">Transfer Bank</SelectItem>
                    </SelectContent>
                  </Select>
              </div>
              {paymentMethod === "Cash" && (
                  <div className="space-y-2">
                      <Label>Uang Diterima</Label>
                      <Input type="number" placeholder="0" value={cashReceived} onChange={(e) => setCashReceived(Number(e.target.value))} className="text-right text-lg" />
                  </div>
              )}
              <div className="space-y-1 pt-2">
                <div className="flex justify-between text-sm"><span>Subtotal</span><span>{formatRupiah(total)}</span></div>
                {paymentMethod === "Cash" && (
                    <div className="flex justify-between text-sm font-medium text-green-600"><span>Kembalian</span><span>{formatRupiah(change < 0 ? 0 : change)}</span></div>
                )}
                <div className="flex justify-between items-center text-lg font-bold pt-2 border-t"><span>Total Tagihan</span><span className="text-primary">{formatRupiah(total)}</span></div>
              </div>
              <SheetFooter>
                   <Button className="w-full h-12 text-lg" disabled={!isPaymentValid() || isLoading} onClick={handleCheckout}>
                      {isLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memproses...</>) : (`Bayar ${formatRupiah(total)}`)}
                   </Button>
              </SheetFooter>
          </div>
        </SheetContent>
      </Sheet>

      {/* DIALOG SUKSES (REVISI PROFESIONAL) */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle className="text-center flex flex-col items-center gap-2">
                    <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                        <Send className="h-6 w-6" />
                    </div>
                    Transaksi Berhasil!
                </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
                {/* 1. INFO BAR: PETUNJUK USER */}
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3 flex items-start gap-2">
                    <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-700 leading-tight">
                        <strong>Saran:</strong> Download struk terlebih dahulu dengan tombol di bawah, lalu kirim manual di WhatsApp.
                    </p>
                </div>

                {/* 2. INPUT NOMOR & DOWNLOAD */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <Label className="text-xs text-slate-500 mb-1.5 block">Nomor WhatsApp Pelanggan</Label>
                    <div className="flex gap-2">
                        <Input 
                            placeholder="08xxxxxxxxxx" 
                            value={manualPhone}
                            onChange={(e) => setManualPhone(e.target.value)}
                            className="bg-white"
                        />
                        {/* TOMBOL DOWNLOAD (Icon Panah Bawah) */}
                        <Button 
                            variant="outline" 
                            onClick={handleDownloadImage} 
                            title="Download Gambar Struk"
                            className="border-slate-300 hover:bg-slate-100"
                        >
                            <Download className="h-4 w-4 text-slate-700" />
                        </Button>
                    </div>
                </div>

                {/* 3. TOMBOL UTAMA: BUKA WA */}
                <Button 
                    className="w-full h-14 text-lg bg-green-600 hover:bg-green-700 shadow-md flex flex-col items-center justify-center gap-0 leading-tight"
                    onClick={handleOpenWhatsApp}
                >
                    <div className="flex items-center gap-2">
                        <Share2 className="h-5 w-5" />
                        <span>Buka WhatsApp</span>
                    </div>
                    <span className="text-[10px] font-normal opacity-90">Kirim struk manual ke pelanggan</span>
                </Button>

            </div>

            <DialogFooter className="sm:justify-center">
                <Button variant="ghost" onClick={() => {
                    setShowSuccessDialog(false);
                    setIsOpen(false);
                }}>
                    Selesai / Tutup
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Struk Tersembunyi */}
      <div style={{ position: 'fixed', top: 0, left: '-9999px', zIndex: -50 }}>
        <Receipt 
            ref={receiptRef}
            items={items}
            total={total}
            date={receiptData.date}
            id={receiptData.id}
        />
      </div>
    </>
  );
};

export default CartDrawer;