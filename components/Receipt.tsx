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
    // Container Utama: Lebar 58mm, Font Monospace (seperti mesin ketik), Background Putih
    <div 
      ref={ref} 
      className="bg-white text-black p-2"
      style={{ 
        width: '58mm', // Ukuran kertas thermal 58mm
        minHeight: '100mm', // Tinggi minimal agar tidak terpotong
        fontFamily: "'Courier New', Courier, monospace", // Font struk klasik
        fontSize: '10px', // Ukuran font kecil agar muat
        lineHeight: '1.2'
      }}
    >
      {/* Header */}
      <div className="text-center mb-2">
        <h2 className="font-bold text-sm uppercase">Toko Luwes</h2>
        <p className="text-[9px]">Jl. Pacarmulyo, Gondang, Watumalang, Wonsobo</p>
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

      {/* CSS Khusus Print: Sembunyikan header/footer browser saat dicetak */}
      <style jsx global>{`
        @media print {
          @page {
            size: 58mm auto; /* Paksa ukuran kertas */
            margin: 0;       /* Hapus margin browser */
          }
          body * {
            visibility: hidden; /* Sembunyikan semua elemen web */
          }
          /* Tampilkan HANYA area struk */
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