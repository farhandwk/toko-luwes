// types/index.ts

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
  stock: number;
}

export interface TransactionItem {
  id: string;
  qty: number;
  priceAtPurchase: number; // Harga saat beli (antisipasi perubahan harga)
}

export interface Transaction {
  id: string;
  date: string;
  items: TransactionItem[];
  totalPrice: number;
  paymentMethod: 'Cash' | 'QRIS' | 'Transfer';
  proofLink?: string;
}

export interface appUser {
  id: string;
  name: string;
  username: string;
}

export interface authUser extends appUser {
  password: string
}