import React, { forwardRef } from 'react';
import { formatRupiah } from '@/utils/currency';

interface ReceiptProps {
  items: any[];
  total: number;       // Ini adalah Subtotal (Total harga barang)
  date: string;
  id: string;
  // [BARU] Props Tambahan
  discount?: number;   // Opsional
  paymentMethod?: string;
  cashAmount?: number; // Uang yang diserahkan (untuk Cash)
  changeAmount?: number; // Kembalian (untuk Cash)
}

const Receipt = forwardRef<HTMLDivElement, ReceiptProps>(({ 
  items, 
  total, 
  date, 
  id, 
  discount = 0, 
  paymentMethod = "Cash",
  cashAmount = 0,
  changeAmount = 0
}, ref) => {

  // Hitung Total Akhir (Subtotal - Diskon)
  const finalTotal = total - (discount || 0);

  return (
    <div 
      ref={ref} 
      className="bg-white text-black print-area"
      style={{ 
        width: '58mm', 
        padding: '2mm', 
        fontFamily: "'Courier New', Courier, monospace", 
        fontSize: '10px', 
        lineHeight: '1.2',
        position: 'relative',
        // Border Hitam (Sesuai request Boss agar tidak kena crop)
        border: '1px solid black',
        borderRadius: '2px' 
      }}
    >
      {/* Header */}
      <div className="text-center mb-2">
        <h2 className="font-bold text-sm uppercase">Toko Luwes</h2>
        <p className="text-[9px]">Jl. Contoh No. 123, Yogyakarta</p>
        <p className="text-[9px] mt-1">{date}</p>
        <p className="text-[9px]">ID: {id}</p>
      </div>

      {/* Garis Pembatas */}
      <div className="border-b border-dashed border-black my-2"></div>

      {/* List Item */}
      <div className="space-y-1">
        {items.map((item, index) => (
          <div key={index} className="flex flex-col">
            <div className="font-bold truncate">{item.name}</div>
            <div className="flex justify-between">
              <span>{item.qty} x {formatRupiah(item.price)}</span>
              <span>{formatRupiah(item.qty * item.price)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="border-b border-dashed border-black my-2"></div>

      {/* --- BAGIAN KALKULASI HARGA --- */}
      <div className="flex flex-col gap-1 text-xs">
        
        {/* 1. Subtotal (Hanya muncul jika ada diskon, biar jelas) */}
        {discount > 0 && (
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatRupiah(total)}</span>
          </div>
        )}

        {/* 2. Diskon (Hanya muncul jika diisi) */}
        {discount > 0 && (
          <div className="flex justify-between">
            <span>Diskon</span>
            <span>-{formatRupiah(discount)}</span>
          </div>
        )}

        {/* 3. TOTAL AKHIR (Bold) */}
        <div className="flex justify-between font-bold text-sm mt-1">
          <span>TOTAL</span>
          <span>{formatRupiah(finalTotal)}</span>
        </div>

        {/* 4. Info Pembayaran (Khusus Cash) */}
        {paymentMethod === 'Cash' && (
           <>
             <div className="flex justify-between mt-1 border-t border-dashed border-gray-400 pt-1">
               <span>Tunai</span>
               <span>{formatRupiah(cashAmount)}</span>
             </div>
             <div className="flex justify-between font-bold">
               <span>Kembalian</span>
               <span>{formatRupiah(changeAmount)}</span>
             </div>
           </>
        )}
        
        {/* Info Metode Non-Tunai */}
        {paymentMethod !== 'Cash' && (
            <div className="text-right text-[9px] mt-1 italic">
                Dibayar via {paymentMethod}
            </div>
        )}

      </div>
      
      {/* Footer Utama */}
      <div className="text-center mt-4 text-[9px]">
        <p>Terima Kasih</p>
        <p>Barang yang dibeli tidak dapat ditukar/dikembalikan</p>
      </div>

      {/* --- TRIK GANJALAN (SPACER) --- */}
      <div style={{ 
          height: '15mm',             
          display: 'flex', 
          alignItems: 'end',          
          justifyContent: 'center',    
          color: 'black'              
      }}>
          <span className="text-[10px] leading-none opacity-50">.</span> 
      </div>

      {/* CSS Print */}
      <style jsx global>{`
        @media print {
          @page {
            size: 58mm auto;
            margin: 0;
          }
          body * {
            visibility: hidden;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 58mm;
          }
        }
      `}</style>
    </div>
  );
});

Receipt.displayName = 'Receipt';
export default Receipt;