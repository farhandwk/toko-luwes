"use client";

import Link from "next/link"; // 1. IMPORT LINK
import { useEffect, useState, useMemo } from "react";
import { Product } from "@/types";
import { formatRupiah } from "@/utils/currency";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDebounce } from "@/hooks/useDebounce"; 
import { PRODUCT_CATEGORIES } from "@/types/categories";
import { toast } from "sonner";
import { 
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { 
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter 
} from "@/components/ui/dialog";
import { 
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
// 2. TAMBAHKAN IMPORT ArrowLeft
import { Plus, Search, Edit, Trash2, PackagePlus, Loader2, ArrowLeft } from "lucide-react";

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // STATE FILTER & SEARCH
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [categoryFilter, setCategoryFilter] = useState("Semua");

  // STATE MODALS
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isRestockOpen, setIsRestockOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Form Data
  const [formData, setFormData] = useState<Partial<Product>>({});
  const [restockAmount, setRestockAmount] = useState<number | ''>('');

  async function fetchProducts() {
    setIsLoading(true);
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      toast.error("Gagal ambil data");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchesCategory = categoryFilter === "Semua" || p.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [products, debouncedSearch, categoryFilter]);

  const handleDelete = async (id: string) => {
    if(!confirm("Yakin hapus produk ini?")) return;
    try {
        await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
        toast.success("Produk dihapus");
        fetchProducts();
    } catch (e) { toast.error("Gagal hapus"); }
  };

  const handleSaveEdit = async () => {
    if (!editingProduct) return;
    try {
        const res = await fetch('/api/products', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
        });
        if (res.ok) {
            toast.success("Produk diperbarui!");
            setIsEditOpen(false);
            fetchProducts();
        } else throw new Error();
    } catch (e) { toast.error("Gagal update produk"); }
  };

  const handleRestock = async () => {
    if (!editingProduct || typeof restockAmount !== 'number' || restockAmount <= 0) {
        toast.error("Masukkan jumlah stok yang valid");
        return;
    }

    const newStock = editingProduct.stock + restockAmount;

    try {
        const res = await fetch('/api/products', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...editingProduct,
                stock: newStock
            }),
        });

        if (res.ok) {
            toast.success(`Stok bertambah +${restockAmount}. Total: ${newStock}`);
            setIsRestockOpen(false);
            setRestockAmount('');
            fetchProducts();
        } else throw new Error();
    } catch (e) { toast.error("Gagal restock"); }
  };

  const openEdit = (p: Product) => { setEditingProduct(p); setFormData(p); setIsEditOpen(true); };
  const openRestock = (p: Product) => { setEditingProduct(p); setRestockAmount(''); setIsRestockOpen(true); };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      
      {/* HEADER & ACTIONS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        
        {/* 3. TOMBOL KEMBALI + JUDUL */}
        <div className="flex items-center gap-4">
            <Link href="/">
                <Button variant="outline" size="icon" className="h-10 w-10 border-slate-300 hover:bg-slate-100" title="Kembali ke Menu Utama">
                    <ArrowLeft className="h-5 w-5 text-slate-700" />
                </Button>
            </Link>
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Manajemen Produk</h1>
                <p className="text-slate-500 text-sm">Tambah, edit, dan atur stok barang.</p>
            </div>
        </div>

      </div>

      {/* FILTER BAR */}
      <div className="bg-white p-4 rounded-lg border shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
                placeholder="Cari nama produk..." 
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />
        </div>
        <div className="w-full md:w-48">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                    <SelectValue placeholder="Kategori" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="Semua">Semua Kategori</SelectItem>
                    {PRODUCT_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
            </Select>
        </div>
      </div>

      {/* TABEL PRODUK */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <Table>
            <TableHeader className="bg-slate-50">
                <TableRow>
                    <TableHead>Produk</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Harga</TableHead>
                    <TableHead className="text-center">Stok</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {isLoading ? (
                    <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                            <div className="flex justify-center items-center gap-2 text-slate-500">
                                <Loader2 className="animate-spin h-5 w-5" /> Memuat data...
                            </div>
                        </TableCell>
                    </TableRow>
                ) : filteredProducts.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                            Produk tidak ditemukan.
                        </TableCell>
                    </TableRow>
                ) : (
                    filteredProducts.map((p) => (
                        <TableRow key={p.id}>
                            <TableCell className="font-medium">
                                <div className="flex items-center gap-3">
                                    {p.image ? (
                                        <img src={p.image} alt={p.name} className="h-10 w-10 rounded object-cover border" />
                                    ) : (
                                        <div className="h-10 w-10 rounded bg-slate-100 border flex items-center justify-center text-xs text-slate-400">Img</div>
                                    )}
                                    <span>{p.name}</span>
                                </div>
                            </TableCell>
                            <TableCell><span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">{p.category}</span></TableCell>
                            <TableCell>{formatRupiah(p.price)}</TableCell>
                            <TableCell className="text-center">
                                <span className={`font-bold ${p.stock < 5 ? 'text-red-500' : 'text-slate-700'}`}>
                                    {p.stock}
                                </span>
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                    <Button 
                                        size="sm" 
                                        variant="outline" 
                                        className="text-green-600 border-green-200 hover:bg-green-50"
                                        onClick={() => openRestock(p)}
                                        title="Tambah Stok"
                                    >
                                        <PackagePlus className="h-4 w-4" />
                                    </Button>

                                    <Button size="sm" variant="ghost" onClick={() => openEdit(p)}>
                                        <Edit className="h-4 w-4 text-blue-600" />
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => handleDelete(p.id)}>
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
      </div>

      {/* MODAL EDIT */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Edit Produk</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                    <Label>Nama Produk</Label>
                    <Input value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="grid grid-2 gap-4 grid-cols-2">
                    <div className="grid gap-2">
                        <Label>Harga</Label>
                        <Input type="number" value={formData.price || 0} onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
                    </div>
                    <div className="grid gap-2">
                        <Label>Stok (Manual)</Label>
                        <Input type="number" value={formData.stock || 0} onChange={e => setFormData({...formData, stock: Number(e.target.value)})} />
                    </div>
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditOpen(false)}>Batal</Button>
                <Button onClick={handleSaveEdit}>Simpan Perubahan</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL QUICK RESTOCK */}
      <Dialog open={isRestockOpen} onOpenChange={setIsRestockOpen}>
        <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                    <PackagePlus className="h-5 w-5 text-green-600" />
                    Tambah Stok Barang
                </DialogTitle>
            </DialogHeader>
            
            {editingProduct && (
                <div className="space-y-4 py-4">
                    <div className="bg-slate-50 p-3 rounded-md border text-sm">
                        <p className="text-slate-500">Produk:</p>
                        <p className="font-bold text-base">{editingProduct.name}</p>
                        <div className="flex justify-between mt-2">
                            <span>Stok Sekarang:</span>
                            <span className="font-mono font-bold">{editingProduct.stock}</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Jumlah Barang Masuk (+)</Label>
                        <div className="flex items-center gap-2">
                            <Input 
                                type="number" 
                                placeholder="0" 
                                autoFocus
                                className="text-lg font-bold"
                                value={restockAmount}
                                onChange={(e) => setRestockAmount(Number(e.target.value))}
                                onKeyDown={(e) => e.key === 'Enter' && handleRestock()}
                            />
                            <span className="text-slate-400 text-sm">pcs</span>
                        </div>
                        <p className="text-xs text-slate-400">
                            Stok akan menjadi: <strong>{editingProduct.stock + (Number(restockAmount) || 0)}</strong>
                        </p>
                    </div>
                </div>
            )}

            <DialogFooter>
                <Button variant="outline" onClick={() => setIsRestockOpen(false)}>Batal</Button>
                <Button className="bg-green-600 hover:bg-green-700" onClick={handleRestock}>
                    Konfirmasi Restock
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}