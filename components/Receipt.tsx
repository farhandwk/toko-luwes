// components/Receipt.tsx
import React, { forwardRef } from 'react';
import { CartItem } from '@/hooks/useCart';
import { formatRupiah } from '@/utils/currency';

interface ReceiptProps {
  items: CartItem[];
  total: number;
  date: string;
  id: string;
}

const Receipt = forwardRef<HTMLDivElement, ReceiptProps>(({ items, total, date, id }, ref) => {
  // Style Dasar Text
  const textStyle = {
    color: '#000000', // Hitam Pekat (Hex)
    fontFamily: 'monospace',
    fontSize: '12px',
    lineHeight: '1.2',
  };

  const borderStyle = {
    borderBottom: '1px dashed #000000',
    marginBottom: '8px',
    paddingBottom: '8px',
  };

  return (
    <div 
      ref={ref} 
      style={{
        backgroundColor: '#ffffff', // Putih Pekat
        padding: '20px',
        width: '300px', // Paksa text hitam di container utama
        ...textStyle // Spread style dasar
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0, color: '#000000' }}>POS TOKO LUWES</h2>
        <p style={{ margin: '4px 0', color: '#000000' }}>Jalan Kaliurang KM 5</p>
        <p style={{ margin: 0, color: '#000000' }}>Yogyakarta</p>
      </div>

      {/* Info Transaksi */}
      <div style={borderStyle}>
        <p style={{ margin: 0, color: '#000000' }}>No: {id}</p>
        <p style={{ margin: 0, color: '#000000' }}>Tgl: {date}</p>
        <p style={{ margin: 0, color: '#000000' }}>Waktu: {date}</p>
      </div>

      {/* List Barang */}
      <div style={{ marginBottom: '8px' }}>
        {items.map((item) => (
          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ color: '#000000' }}>{item.name} x{item.qty}</span>
            <span style={{ color: '#000000' }}>{formatRupiah(item.price * item.qty)}</span>
          </div>
        ))}
      </div>

      {/* Total */}
      <div style={{ 
          borderTop: '1px dashed #000000', 
          paddingTop: '8px', 
          marginBottom: '16px',
          display: 'flex', 
          justifyContent: 'space-between', 
          fontWeight: 'bold' 
      }}>
        <span style={{ color: '#000000' }}>TOTAL</span>
        <span style={{ color: '#000000' }}>{formatRupiah(total)}</span>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', marginTop: '16px' }}>
        <p style={{ margin: '4px 0', color: '#000000' }}>Terima Kasih</p>
        <p style={{ margin: 0, fontSize: '10px', color: '#000000' }}>Barang yang dibeli tidak dapat ditukar</p>
      </div>
    </div>
  );
});

Receipt.displayName = "Receipt";
export default Receipt;