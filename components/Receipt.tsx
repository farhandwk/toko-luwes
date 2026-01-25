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
}

const Receipt = React.forwardRef<HTMLDivElement, ReceiptProps>((props, ref) => {
  const { items, total, discount, paymentMethod, cashAmount, changeAmount, date, id } = props;

  return (
    <div ref={ref} className="bg-white p-4 text-black font-mono text-md w-[80mm] mx-auto leading-tight" style={{ 
        width: '58mm', 
        padding: '2mm', 
        fontFamily: "'Courier New', Courier, monospace", 
        fontSize: '12px', 
        lineHeight: '1.2',
        position: 'relative',
        // Border Hitam (Sesuai request Boss agar tidak kena crop)
        border: '1px solid black',
        borderRadius: '2px' 
      }}>
      <div className="text-center mb-4">
        <h1 className="text-xl font-bold">TOKO LUWES</h1>
        <p>Jalan Raya Utama No. 123</p>
        <p>Telp: 0812-3456-7890</p>
      </div>

      <div className="border-b border-black pb-2 mb-2 flex justify-between">
        <span>{date}</span>
        <span>{id}</span>
      </div>

      <div className="space-y-2 mb-4 border-b border-black pb-2">
        {items.map((item, index) => (
          <div key={index}>
            <div className="flex justify-between font-bold">
               {/* [BARU] Tampilkan tanda (Khusus) jika isSpecial true */}
               <span>
                  {item.name} {item.isSpecial && <span className="text-[12px] font-normal italic">(Khusus)</span>}
               </span>
            </div>
            <div className="flex justify-between">
              <span>{item.qty} x {formatRupiah(item.price)}</span>
              <span>{formatRupiah(item.price * item.qty)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-1 mb-4 border-b border-black pb-2">
        <div className="flex justify-between font-bold">
          <span>Subtotal</span>
          <span>{formatRupiah(total + discount)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-red-600">
            <span>Diskon</span>
            <span>-{formatRupiah(discount)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-md mt-1">
          <span>TOTAL</span>
          <span>{formatRupiah(total)}</span>
        </div>
      </div>

      <div className="space-y-1 mb-4">
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

      <div className="text-center mt-4">
        <p>Terima kasih sudah berbelanja!</p>
        <p>Barang yang dibeli tidak dapat ditukar/dikembalikan.</p>
      </div>
    </div>
  );
});

Receipt.displayName = "Receipt";
export default Receipt;