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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"; 
import { Trash2, ShoppingCart, Plus, Minus, Loader2, Send, Share2, Download, Printer } from 'lucide-react'; 
import { toast } from "sonner";
import { toPng } from 'html-to-image';
import { useReactToPrint } from 'react-to-print'; 
import Receipt from './Receipt';

interface CartDrawerProps {
  onCheckoutSuccess?: () => void;
  className?: string; 
}

const CartDrawer: React.FC<CartDrawerProps> = ({ onCheckoutSuccess, className }) => {
  const { items, addItem, decreaseQty, removeItem, clearCart, totalPrice } = useCartStore();
  
  const subTotal = totalPrice(); // Harga barang murni

  // STATE BARU: DISKON
  const [discount, setDiscount] = useState<number | ''>('');
  
  // Hitung Total Akhir (Subtotal - Diskon)
  const finalTotal = subTotal - (Number(discount) || 0);

  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [receiptData, setReceiptData] = useState({ id: '', date: '' });
  const receiptRef = useRef<HTMLDivElement>(null);

  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [cashReceived, setCashReceived] = useState<number | ''>('');

  const [receiptBlob, setReceiptBlob] = useState<Blob | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [manualPhone, setManualPhone] = useState("");
  const [lastTxId, setLastTxId] = useState(""); 

  // STATE CADANGAN (SNAPSHOT) UNTUK PRINT SETELAH CLEAR CART
  const [lastItems, setLastItems] = useState<any[]>([]);
  const [lastSubTotal, setLastSubTotal] = useState(0);
  const [lastDiscount, setLastDiscount] = useState(0);
  const [lastPaymentMethod, setLastPaymentMethod] = useState("Cash");
  const [lastCashReceived, setLastCashReceived] = useState(0);
  const [lastChange, setLastChange] = useState(0);

  // Hitung Kembalian (Berdasarkan Final Total)
  const change = (paymentMethod === "Cash" && typeof cashReceived === 'number') 
    ? cashReceived - finalTotal
    : 0;

  const isPaymentValid = () => {
    if (items.length === 0) return false;
    // Validasi Diskon tidak boleh lebih besar dari total
    if (Number(discount) > subTotal) return false;

    if (paymentMethod === "Cash") {
        return (typeof cashReceived === 'number' && cashReceived >= finalTotal);
    }
    return true;
  };

  useEffect(() => {
    setReceiptData({
        id: `TRX-${Date.now()}`,
        date: getWIBDate()
    });
  }, [isOpen]);

  const handlePrintPC = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: `Struk-${lastTxId}`,
    onAfterPrint: () => toast.success("Perintah cetak dikirim!"),
  });

  const handlePrintMobile = () => {
    if (!receiptBlob) {
        toast.error("Sedang memproses gambar struk...");
        return;
    }
    const reader = new FileReader();
    reader.readAsDataURL(receiptBlob);
    reader.onloadend = () => {
        const base64data = reader.result as string;
        const cleanBase64 = base64data.split(',')[1];
        const rawbtUrl = `rawbt:data:image/png;base64,${cleanBase64}`;
        window.location.href = rawbtUrl;
    };
  };

  const handleDownloadImage = () => {
    if (!receiptBlob) { toast.error("Struk belum siap"); return; }
    const link = document.createElement('a');
    link.href = URL.createObjectURL(receiptBlob);
    link.download = `struk-${lastTxId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Struk tersimpan!");
  };

  const handleOpenWhatsApp = async () => {
    if (!receiptBlob) { toast.error("Gagal memuat gambar struk"); return; }
    let phone = manualPhone.replace(/\D/g, '');
    if (phone.startsWith('0')) phone = '62' + phone.slice(1);
    const messageText = encodeURIComponent(`Halo Kak, terima kasih sudah berbelanja.\nBerikut struk transaksinya 👇`);
    const waUrl = phone ? `https://wa.me/${phone}?text=${messageText}` : `https://wa.me/?text=${messageText}`;

    const file = new File([receiptBlob], `struk-${lastTxId}.png`, { type: "image/png" });
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isMobile && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
            await navigator.share({ files: [file], title: 'Struk Belanja', text: `Struk ${lastTxId}` });
        } catch (error) { console.log("Share dibatalkan"); }
    } else {
        window.open(waUrl, '_blank');
        toast.info("WhatsApp terbuka!");
    }
  };

  const handleCheckout = async () => {
    if (!isPaymentValid()) return;
    setIsLoading(true);
    try {
      let proofLink = '';
      let currentBlob: Blob | null = null;

      // 1. Generate Gambar Struk Dulu
      if (receiptRef.current) {
        try {
          await new Promise(resolve => setTimeout(resolve, 100));
          const dataUrl = await toPng(receiptRef.current, { 
             cacheBust: true, 
             backgroundColor: '#ffffff',
             filter: (node) => (node.tagName !== 'LINK'), 
             // @ts-ignore
             skipFonts: true, 
          });
          const res = await fetch(dataUrl);
          currentBlob = await res.blob();
          setReceiptBlob(currentBlob);
          
          // (Opsional) Upload ke Cloudinary dsb di sini jika perlu
        } catch (imgError) { console.error("Gagal generate gambar:", imgError); }
      }

      // 2. Kirim Data ke API
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items,
          subTotal: subTotal,
          discount: Number(discount) || 0,
          total: finalTotal, // Total yang masuk database adalah setelah diskon
          paymentMethod: paymentMethod,
          date: receiptData.date
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("Transaksi Sukses!");
        setLastTxId(result.transactionId || receiptData.id);

        // 3. Simpan Snapshot Data untuk Print Ulang (PENTING)
        setLastItems(items);
        setLastSubTotal(subTotal);
        setLastDiscount(Number(discount) || 0);
        setLastPaymentMethod(paymentMethod);
        setLastCashReceived(Number(cashReceived) || 0);
        setLastChange(change);

        // 4. Reset & Buka Dialog
        setShowSuccessDialog(true);
        clearCart();
        setCashReceived('');
        setDiscount(''); // Reset diskon juga
        if (onCheckoutSuccess) onCheckoutSuccess();
      } else { throw new Error(result.error); }
    } catch (error) {
      console.error(error);
      toast.error("Gagal Checkout");
    } finally { setIsLoading(false); }
  };

  // --- UI ISI KERANJANG ---
  const cartContent = (
    <div className="flex flex-col h-full overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
            {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <ShoppingCart className="h-12 w-12 mb-3 opacity-20" />
                <p>Keranjang kosong.</p>
            </div>
            ) : (
            items.map((item) => (
                <div key={item.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="flex-1">
                    <p className="font-semibold text-sm line-clamp-1">{item.name}</p>
                    <p className="text-xs text-gray-500">{formatRupiah(item.price)}</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => decreaseQty(item.id)}><Minus className="h-3 w-3" /></Button>
                    <span className="text-sm font-bold w-6 text-center">{item.qty}</span>
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => addItem(item)}><Plus className="h-3 w-3" /></Button>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 ml-1 hover:bg-red-50" onClick={() => removeItem(item.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
            ))
            )}
        </div>
        
        {/* FOOTER PEMBAYARAN */}
        <div className="bg-white p-4 space-y-4 border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10 relative">
            
            {/* INPUT DISKON (BARU) */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                    <Label>Diskon (Rp)</Label>
                    <Input 
                        type="number" 
                        placeholder="0" 
                        value={discount} 
                        onChange={(e) => setDiscount(Number(e.target.value))} 
                        className="font-mono"
                    />
                </div>
            </div>

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
                    <Input 
                        type="number" 
                        placeholder="0" 
                        value={cashReceived} 
                        onChange={(e) => setCashReceived(Number(e.target.value))} 
                        className="text-right text-lg font-mono font-bold" 
                        autoFocus={false} 
                    />
                </div>
            )}

            {/* RINGKASAN HARGA */}
            <div className="space-y-1 pt-2">
                <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>{formatRupiah(subTotal)}</span>
                </div>
                
                {Number(discount) > 0 && (
                     <div className="flex justify-between text-sm text-red-500">
                        <span>Diskon</span>
                        <span>- {formatRupiah(Number(discount))}</span>
                    </div>
                )}

                {paymentMethod === "Cash" && (
                    <div className="flex justify-between text-sm font-medium text-green-600">
                        <span>Kembalian</span>
                        <span>{formatRupiah(change < 0 ? 0 : change)}</span>
                    </div>
                )}
                
                <div className="flex justify-between items-center text-lg font-bold pt-2 border-t">
                    <span>Total Tagihan</span>
                    <span className="text-primary">{formatRupiah(finalTotal)}</span>
                </div>
            </div>

            <Button className="w-full h-12 text-lg font-bold shadow-sm" disabled={!isPaymentValid() || isLoading} onClick={handleCheckout}>
                {isLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memproses...</>) : (`Bayar ${formatRupiah(finalTotal)}`)}
            </Button>
        </div>
    </div>
  );

  return (
    <div className={className}>
      
      {/* MOBILE */}
      <div className="lg:hidden"> 
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <div className='fixed bottom-6 left-0 w-full flex justify-center z-40 px-4'>
                <DialogTrigger asChild>
                    <Button className="w-full h-14 text-lg rounded-full shadow-2xl bg-primary hover:bg-primary/90 transition-all flex items-center justify-between px-6">
                        <div className="flex items-center gap-2">
                            <ShoppingCart className="h-6 w-6" />
                            <span className="font-bold">Total: {formatRupiah(finalTotal)}</span>
                        </div>
                        <div className="bg-white text-primary text-xs font-bold px-2 py-1 rounded-full">
                            {items.reduce((acc, item) => acc + item.qty, 0)} Item
                        </div>
                    </Button>
                </DialogTrigger>
            </div>
            <DialogContent className="sm:max-w-lg w-[95%] rounded-xl flex flex-col max-h-[85vh] p-0 gap-0 overflow-hidden">
                <DialogHeader className="p-4 border-b bg-slate-50">
                    <DialogTitle className="font-bold flex items-center gap-2 text-base">
                        <ShoppingCart className="h-5 w-5" /> Keranjang Belanja
                    </DialogTitle>
                </DialogHeader>
                {cartContent} 
            </DialogContent>
        </Dialog>
      </div>

      {/* DESKTOP */}
      <div className="hidden lg:flex flex-col h-full bg-white rounded-xl overflow-hidden border">
          <div className="p-4 border-b bg-slate-50">
            <h2 className="font-bold flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" /> Keranjang Belanja
            </h2>
          </div>
          {cartContent}
      </div>

      {/* DIALOG SUKSES */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
           <DialogContent className="sm:max-w-md w-[90%] rounded-xl">
            <DialogHeader>
                <DialogTitle className="text-center flex flex-col items-center gap-2">
                    Transaksi Berhasil!
                </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <Label className="text-xs text-slate-500 mb-1.5 block">Nomor WhatsApp Pelanggan</Label>
                    <div className="flex gap-2">
                        <Input placeholder="08xxxxxxxxxx" value={manualPhone} onChange={(e) => setManualPhone(e.target.value)} className="bg-white" />
                        <Button variant="outline" onClick={handleDownloadImage} title="Download"><Download className="h-4 w-4" /></Button>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                    <Button variant="outline" className="flex flex-col h-16 hidden md:flex" onClick={() => handlePrintPC()}>
                        <Printer className="h-5 w-5" /><span className="text-xs">Cetak (USB)</span>
                    </Button>
                    <Button variant="outline" className="flex flex-col h-16 md:hidden" onClick={handlePrintMobile}>
                        <Printer className="h-5 w-5" /><span className="text-xs">Cetak (BT)</span>
                    </Button>
                    <Button className="flex flex-col h-16 bg-green-600 col-span-2 md:col-span-1" onClick={handleOpenWhatsApp}>
                        <Share2 className="h-5 w-5" /><span className="text-xs">Kirim WA</span>
                    </Button>
                </div>
            </div>
            <DialogFooter className="sm:justify-center">
                <Button variant="ghost" onClick={() => { setShowSuccessDialog(false); setIsOpen(false); }}>Tutup</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* INVISIBLE RECEIPT UNTUK GENERATE & PRINT */}
      <div style={{ position: 'fixed', top: 0, left: '-9999px', zIndex: -50 }}>
        <Receipt 
            ref={receiptRef} 
            // LOGIKA: Jika keranjang isi, pakai data live. Jika kosong (checkout sukses), pakai data snapshot
            items={items.length > 0 ? items : lastItems}
            total={items.length > 0 ? subTotal : lastSubTotal}
            discount={items.length > 0 ? (Number(discount) || 0) : lastDiscount}
            paymentMethod={items.length > 0 ? paymentMethod : lastPaymentMethod}
            cashAmount={items.length > 0 ? (Number(cashReceived) || 0) : lastCashReceived}
            changeAmount={items.length > 0 ? change : lastChange}
            date={receiptData.date} 
            id={receiptData.id} 
        />
      </div>
    </div>
  );
};

export default CartDrawer;