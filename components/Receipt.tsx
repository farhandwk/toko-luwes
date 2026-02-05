import React from 'react';
import { formatRupiah } from '@/utils/currency';

interface ReceiptProps {
  items: any[];
  total: number;
  discount: number;
  paymentMethod: string;
  cashAmount: number;
  changeAmount: number;
  date: string;
  id: string;
  logoUrl: string;
}

const Receipt = React.forwardRef<HTMLDivElement, ReceiptProps>((props, ref) => {
  const { items, total, discount, paymentMethod, cashAmount, changeAmount, date, id, logoUrl } = props;

  return (
    <div 
      ref={ref} 
      className="bg-white text-black font-mono mx-auto leading-tight" 
      style={{ 
        width: '58mm', 
        padding: '5px 2px', // Padding secukupnya
        fontFamily: "'sans-serif", 
        fontSize: '12px', // [REQUEST BOSS] Font tetap 12px
        fontWeight: '600', // Agak tebal biar jelas di thermal printer
        lineHeight: '1.3', // Jarak antar baris sedikit direnggangkan biar tidak numpuk
        position: 'relative',
        border: '1px solid black',
      }}
    >
      <div style={{ 
         height: '5mm',  
          display: 'flex', 
          alignItems: 'end', 
           justifyContent: 'center', 
           color: 'black' 
        }}>
           <span className="text-[1px] leading-none opacity-50">.</span> 
    </div>

      {/* HEADER */}
      <div className="text-center mb-2 border-b-2 border-black pb-2 border-dashed flex flex-col justify-center items-center">
        <img 
            src={logoUrl || "/toko-luwes.png"} 
            alt="Logo Toko" 
            style={{ 
                maxWidth: '20mm', // Maksimal 40mm agar tidak mepet pinggir
                height: 'auto',   // Tinggi menyesuaikan
                marginBottom: '10px',
                // [TIPS] Filter ini memaksa gambar jadi hitam putih tajam
                filter: 'grayscale(100%) contrast(150%)', 
                display: 'block'
            }}
            // Handler jika gambar tidak ditemukan, sembunyikan elemennya
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        {/* <h1 className="text-xl font-extrabold mb-1">TOKO LUWES</h1> */}
        <p className="text-[10px] font-bold">Jl. Pacarmulyo, Gondang, Watumalang, Wonosobo</p>
        <p className="text-[10px] font-normal">Telp: 0852-2679-0465</p>
      </div>

      {/* INFO TRANSAKSI */}
      <div className="flex justify-between text-[10px] mb-2 font-normal">
        <span>{date}</span>
        <span>{id}</span>
      </div>

      {/* LIST ITEM */}
      <div className="space-y-3 mb-2 border-b-2 border-black pb-2 border-dashed">
        {items.map((item, index) => (
          <div key={index} className="flex flex-col">
            
            {/* 1. NAMA PRODUK (Full Width) */}
            <span className="font-bold text-left break-words">
                {item.name}
            </span>

            {/* 2. LABEL KHUSUS (Di baris baru agar aman) */}
            {item.isSpecial && (
                 <span className="text-[10px] italic font-bold text-slate-800 -mt-0.5 mb-0.5">
                   ** Harga Khusus **
                 </span>
            )}

            {/* 3. QTY & HARGA (Di baris bawahnya) */}
            <div className="flex justify-between font-normal">
              <span>{item.qty} x {formatRupiah(item.price)}</span>
              <span>{formatRupiah(item.price * item.qty)}</span>
            </div>

          </div>
        ))}
      </div>

      {/* TOTAL & PEMBAYARAN */}
      <div className="space-y-1 mb-4 border-b-2 border-black pb-2 border-dashed">
        <div className="flex justify-between font-bold">
          <span>Subtotal</span>
          <span>{formatRupiah(total + discount)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-[10px]">
            <span>Diskon</span>
            <span>-{formatRupiah(discount)}</span>
          </div>
        )}
        <div className="flex justify-between font-extrabold text-[14px] mt-1">
          <span>TOTAL</span>
          <span>{formatRupiah(total)}</span>
        </div>
      </div>

      <div className="space-y-1 mb-6 text-[11px] font-normal">
        <div className="flex justify-between">
          <span>Bayar ({paymentMethod})</span>
          <span>{paymentMethod === 'Cash' ? formatRupiah(cashAmount) : '-'}</span>
        </div>
        {paymentMethod === 'Cash' && (
          <div className="flex justify-between">
            <span>Kembali</span>
            <span>{formatRupiah(changeAmount)}</span>
          </div>
        )}
      </div>

      <div className="text-center text-[10px] font-normal">
        <p>Terima Kasih</p>
        <p>Barang beli tidak dapat ditukar</p>
      </div>

      {/* Spacer Bawah */}
     <div style={{ 
         height: '5mm',  
          display: 'flex', 
          alignItems: 'end', 
           justifyContent: 'center', 
           color: 'black' 
        }}>
           <span className="text-[1px] leading-none opacity-50">.</span> 
    </div>
    </div>
  );
});

Receipt.displayName = "Receipt";
export default Receipt;