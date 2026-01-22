"use client";

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { formatRupiah } from '@/utils/currency';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
 } from "@/components/ui/select"
import { 
  Loader2, Plus, Pencil, Trash2, ArrowLeft, Image as ImageIcon, Save 
} from 'lucide-react';
import { toast } from "sonner";

import { PRODUCT_CATEGORIES } from '@/types/categories';

// Tipe Data Produk
interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
  stock: number;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State Form
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    stock: '',
    image: ''
  });

  // Upload Gambar
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      // Tambahkan timestamp agar tidak cache
      const res = await fetch(`/api/products?t=${Date.now()}`);
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      toast.error("Gagal memuat produk");
    } finally {
      setLoading(false);
    }
  };

  // Reset Form saat modal dibuka untuk "Tambah Baru"
  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({ name: '', category: '', price: '', stock: '', image: '' });
    setIsDialogOpen(true);
  };

  // Isi Form saat tombol "Edit" diklik
  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      price: product.price.toString(),
      stock: product.stock.toString(),
      image: product.image
    });
    setIsDialogOpen(true);
  };

  // Logic Upload ke ImgBB (Reuse API /api/upload)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
        const uploadFormData = new FormData();
        uploadFormData.append('file', file);

        const res = await fetch('/api/upload', {
            method: 'POST',
            body: uploadFormData
        });
        const data = await res.json();

        if (data.success) {
            setFormData(prev => ({ ...prev, image: data.fileUrl }));
            toast.success("Foto berhasil diupload");
        } else {
            throw new Error("Gagal upload");
        }
    } catch (err) {
        toast.error("Gagal upload gambar");
    } finally {
        setIsUploading(false);
    }
  };

  // Submit (Bisa Create atau Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
        const payload = {
            ...formData,
            price: Number(formData.price),
            stock: Number(formData.stock),
        };

        let res;
        if (editingProduct) {
            // MODE EDIT (PUT)
            res = await fetch('/api/products', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: editingProduct.id, ...payload })
            });
        } else {
            // MODE TAMBAH (POST)
            res = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        }

        if (!res.ok) throw new Error("Gagal menyimpan");

        toast.success(editingProduct ? "Produk diperbarui" : "Produk ditambahkan");
        setIsDialogOpen(false);
        fetchProducts(); // Refresh tabel

    } catch (error) {
        console.error(error);
        toast.error("Terjadi kesalahan sistem");
    } finally {
        setIsSubmitting(false);
    }
  };

  // Hapus Produk
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Yakin ingin menghapus "${name}"? Data tidak bisa kembali.`)) return;

    try {
        // Optimistic UI Update (Hapus duluan dari layar biar cepat)
        setProducts(products.filter(p => p.id !== id));
        toast.success("Sedang menghapus...");

        const res = await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
        
        if (!res.ok) {
            throw new Error("Gagal hapus di server");
            fetchProducts(); // Rollback kalau gagal
        } else {
            toast.success("Produk terhapus permanen");
        }
    } catch (error) {
        toast.error("Gagal menghapus produk");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
                <Link href="/">
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">Manajemen Produk</h1>
                    <p className="text-slate-500 text-sm">Tambah, edit, atau hapus menu</p>
                </div>
            </div>
            <Button onClick={handleOpenAdd}>
                <Plus className="mr-2 h-4 w-4" /> Tambah Produk
            </Button>
        </div>

        {/* Tabel Produk */}
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[80px]">Gambar</TableHead>
                        <TableHead>Nama Produk</TableHead>
                        <TableHead className="table-cell">Kategori</TableHead>
                        <TableHead>Harga</TableHead>
                        <TableHead>Stok</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                         <TableRow>
                            <TableCell colSpan={6} className="h-32 text-center">
                                <div className="flex justify-center items-center gap-2">
                                    <Loader2 className="animate-spin" /> Memuat...
                                </div>
                            </TableCell>
                         </TableRow>
                    ) : products.map((product) => (
                        <TableRow key={product.id}>
                            <TableCell>
                                <div className="h-10 w-10 bg-slate-100 rounded-md overflow-hidden relative">
                                    {product.image ? (
                                        <img 
                                            src={product.image || 'https://api.escuelajs.co/api/v1/products'} 
                                            alt={product.name}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <ImageIcon className="h-5 w-5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-300" />
                                    )}
                                </div>
                            </TableCell>
                            <TableCell className="font-medium">{product.name}</TableCell>
                            <TableCell className="table-cell">
                                <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-full text-xs">
                                    {product.category}
                                </span>
                            </TableCell>
                            <TableCell>{formatRupiah(product.price)}</TableCell>
                            <TableCell>{product.stock}</TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleOpenEdit(product)}>
                                        <Pencil className="h-4 w-4 text-blue-600" />
                                    </Button>
                                    <Button variant="outline" size="icon" className="h-8 w-8 hover:bg-red-50" onClick={() => handleDelete(product.id, product.name)}>
                                        <Trash2 className="h-4 w-4 text-red-600" />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>

        {/* MODAL FORM (ADD / EDIT) */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}</DialogTitle>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    {/* Upload Gambar */}
                    <div className="flex flex-col items-center gap-4 mb-2">
                        <div 
                            className="h-24 w-24 bg-slate-100 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden cursor-pointer hover:bg-slate-50 relative group"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {isUploading ? (
                                <Loader2 className="animate-spin text-slate-400" />
                            ) : formData.image ? (
                                <img src={formData.image} alt="Preview" className="h-full w-full object-cover" />
                            ) : (
                                <div className="text-center p-2">
                                    <ImageIcon className="h-6 w-6 mx-auto text-slate-400 mb-1" />
                                    <span className="text-[10px] text-slate-400">Upload</span>
                                </div>
                            )}
                            
                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center text-white text-xs font-medium">
                                Ganti
                            </div>
                        </div>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Nama</Label>
                        <Input id="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="col-span-3" required />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="category" className="text-right">Kategori</Label>
                        {/* <Input id="category" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="col-span-3" placeholder="Contoh: Makanan" required /> */}
                        <div>
                            <Select
                            value={formData.category}
                            onValueChange={(value) => setFormData({ ...formData, category: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder='Pilih Kategori'/>
                                </SelectTrigger>
                                <SelectContent>
                                    { PRODUCT_CATEGORIES.map((item) => (
                                        <SelectItem key={item} value={item}>{item}</SelectItem>
                                    )) }
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="price" className="text-right">Harga</Label>
                        <Input id="price" type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="col-span-3" required />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="stock" className="text-right">Stok</Label>
                        <Input id="stock" type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} className="col-span-3" required />
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={isSubmitting || isUploading}>
                            {isSubmitting ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...</> 
                            ) : (
                                <><Save className="mr-2 h-4 w-4" /> Simpan</>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}