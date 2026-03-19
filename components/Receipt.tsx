import React from 'react';
import { formatRupiah } from '@/utils/currency';

interface ReceiptProps {
  items: any[];
  total: number;
  subtotal: number;
  discount: number;
  paymentMethod: string;
  cashAmount: number;
  changeAmount: number;
  date: string;
  id: string;
  logoUrl?: string;
}

const Receipt = React.forwardRef<HTMLDivElement, ReceiptProps>((props, ref) => {
  const { items, subtotal, total, discount, paymentMethod, cashAmount, changeAmount, date, id } = props;

  return (
    <div 
      ref={ref} 
      className="bg-white text-black font-mono mx-auto leading-tight" 
      style={{ 
        width: '58mm', 
        padding: '5px 5px', // Padding sedikit diperlebar agar tidak terpotong printer
        fontFamily: "monospace", // Gunakan monospace murni untuk kesan struk
        fontSize: '12px',
        fontWeight: '600',
        lineHeight: '1.2',
        position: 'relative',
        backgroundColor: 'white'
      }}
    >
      {/* HEADER */}
      <div className="text-center mb-2 border-b-2 border-black pb-2 border-dashed flex flex-col items-center">
        <img 
            src="/toko-luwes.png" 
            alt="Logo" 
            style={{ 
                maxWidth: '25mm',
                height: 'auto',
                marginBottom: '5px',
                filter: 'grayscale(100%) contrast(200%)', // Lebih kontras untuk printer thermal
            }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        <p className="text-[10px] font-bold">Jl. Pacarmulyo, Gondang, Watumalang</p>
        <p className="text-[10px]">Wonosobo | 0852-2679-0465</p>
      </div>

      {/* INFO TRANSAKSI */}
      <div className="flex justify-between text-[9px] mb-2 border-b border-black border-dashed pb-1">
        <span>{date}</span>
        <span>{id}</span>
      </div>

      {/* LIST ITEM */}
      <div className="space-y-2 mb-2 border-b-2 border-black pb-2 border-dashed">
        {items?.map((item, index) => (
          <div key={index} className="flex flex-col">
            <span className="font-bold text-[11px] uppercase">{item.name}</span>
            
            {/* Cek is_special (snake_case) atau isSpecial (camelCase) */}
            {(item.is_special || item.isSpecial) && (
                 <span className="text-[9px] italic font-bold">- Harga Khusus -</span>
            )}

            <div className="flex justify-between text-[11px]">
              <span>{item.qty} x {formatRupiah(item.price)}</span>
              <span>{formatRupiah(item.price * item.qty)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* TOTAL & PEMBAYARAN */}
      <div className="space-y-1 mb-2">
        <div className="flex justify-between text-[11px]">
          <span>Subtotal</span>
          <span>{formatRupiah(subtotal)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-[11px]">
            <span>Diskon</span>
            <span>-{formatRupiah(discount)}</span>
          </div>
        )}
        <div className="flex justify-between font-extrabold text-[13px] border-t border-black pt-1">
          <span>TOTAL</span>
          <span>{formatRupiah(total)}</span>
        </div>
      </div>

      <div className="space-y-1 mb-4 text-[10px] pt-1">
        <div className="flex justify-between">
          <span>Bayar ({paymentMethod})</span>
          <span>{paymentMethod === 'Cash' ? formatRupiah(cashAmount) : formatRupiah(total)}</span>
        </div>
        {paymentMethod === 'Cash' && (
          <div className="flex justify-between font-bold">
            <span>Kembali</span>
            <span>{formatRupiah(changeAmount)}</span>
          </div>
        )}
      </div>

      <div className="text-center text-[9px] border-t border-black border-dashed pt-2">
        <p className="font-bold italic">TERIMA KASIH</p>
        <p>Barang yang sudah dibeli</p>
        <p>tidak dapat ditukar/dikembalikan</p>
      </div>
      
      {/* Footer Padding untuk Printer Thermal agar tidak terpotong saat sobek kertas */}
      <div className="h-8"></div>
    </div>
  );
});

Receipt.displayName = "Receipt";
export default Receipt;