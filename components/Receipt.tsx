import React, { forwardRef } from 'react';
import { formatRupiah } from '@/utils/currency';

interface ReceiptProps {
  items: any[];
  total: number;
  date: string;
  id: string;
}

const Receipt = forwardRef<HTMLDivElement, ReceiptProps>(({ items, total, date, id }, ref) => {
  return (
    // [PERBAIKAN] Tambahkan class "print-area" di sini
    <div 
      ref={ref} 
      className="bg-white text-black p-2 print-area" // <--- TAMBAHKAN 'print-area'
      style={{ 
        width: '58mm', 
        minHeight: '100mm', 
        padding: '5mm',        // Jarak aman kiri-kanan-atas
        paddingBottom: '15mm',
        paddingTop: '15mm',
        fontFamily: "'Courier New', Courier, monospace", 
        fontSize: '10px', 
        lineHeight: '1.2'
      }}
    >
      {/* Header */}
      <div className="text-center mb-2">
        <h2 className="font-bold text-sm uppercase">Toko Luwes</h2>
        <p className="text-[9px]">Jl. Contoh No. 123, Yogyakarta</p>
        <p className="text-[9px] mt-1">{date}</p>
        <p className="text-[9px]">ID: {id}</p>
      </div>

      {/* Garis Putus-putus */}
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

      {/* Total */}
      <div className="flex justify-between font-bold text-xs mt-1">
        <span>TOTAL</span>
        <span>{formatRupiah(total)}</span>
      </div>
      
      {/* Footer */}
      <div className="text-center mt-4 text-[9px]">
        <p>Terima Kasih</p>
        <p>Barang yang dibeli tidak dapat ditukar/dikembalikan</p>
      </div>

      {/* CSS: Sembunyikan semua KECUALI yang punya class 'print-area' */}
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