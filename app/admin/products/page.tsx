"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { formatRupiah } from "@/utils/currency";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { 
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter 
} from "@/components/ui/dialog";
import { 
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Plus, Search, Edit, Trash2, PackagePlus, Loader2, ArrowLeft, Image as ImageIcon } from "lucide-react";

export default function AdminProducts() {
  const [products, setProducts] = useState<any[]>([]); 
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [unitsList, setUnitsList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Semua");

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isRestockOpen, setIsRestockOpen] = useState(false);
  const [isEditingMode, setIsEditingMode] = useState(false); 
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState<Partial<any>>({});
  const [restockAmount, setRestockAmount] = useState<number | ''>('');
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  async function fetchAllData() {
    setIsLoading(true);
    try {
      const [resProd, resCat, resUnit] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/attributes?type=categories'),
        fetch('/api/attributes?type=units')
      ]);
      const dataProd = await resProd.json();
      const dataCat = await resCat.json();
      const dataUnit = await resUnit.json();

      setProducts(Array.isArray(dataProd) ? dataProd : []);
      setCategoriesList(Array.isArray(dataCat) ? dataCat : []);
      setUnitsList(Array.isArray(dataUnit) ? dataUnit : []);
    } catch (error) {
      toast.error("Gagal memuat data");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { fetchAllData(); }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter === "Semua" || p.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [products, search, categoryFilter]);

  // --- [PERBAIKAN UTAMA DI SINI] ---
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const uploadData = new FormData();
    uploadData.append('file', file);

    try {
        const res = await fetch('/api/upload', {
            method: 'POST',
            body: uploadData,
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "Gagal upload");

        // [FIX] Cloudinary mengembalikan 'secure_url'
        // Kita juga cek 'url' sebagai cadangan
        const imageUrl = data.secure_url || data.url;

        if (imageUrl) {
            setFormData(prev => ({ ...prev, image: imageUrl }));
            toast.success("Gambar berhasil diupload!");
        } else {
            console.error("Respon API:", data); 
            throw new Error("Respon API tidak memiliki URL gambar");
        }
    } catch (error: any) {
        console.error(error);
        toast.error(error.message || "Gagal upload gambar");
    } finally {
        setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Yakin hapus produk ini?")) return;
    try {
        await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
        toast.success("Produk dihapus");
        fetchAllData();
    } catch (e) { toast.error("Gagal hapus"); }
  };

  const handleSaveProduct = async () => {
    if (!formData.name || !formData.price || !formData.category) {
        toast.error("Nama, Harga, dan Kategori wajib diisi");
        return;
    }
    try {
        const method = isEditingMode ? 'PUT' : 'POST';
        const res = await fetch('/api/products', {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
        });
        if (res.ok) {
            toast.success(isEditingMode ? "Produk diperbarui!" : "Produk berhasil ditambah!");
            setIsEditOpen(false);
            fetchAllData();
        } else throw new Error();
    } catch (e) { toast.error("Gagal menyimpan produk"); }
  };

  const handleRestock = async () => {
    if (!selectedProduct || typeof restockAmount !== 'number' || restockAmount <= 0) {
        toast.error("Jumlah stok tidak valid"); return;
    }
    const newStock = (selectedProduct.stock || 0) + restockAmount;
    try {
        const res = await fetch('/api/products', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...selectedProduct, stock: newStock }),
        });
        if (res.ok) {
            toast.success(`Stok bertambah +${restockAmount}. Total: ${newStock}`);
            setIsRestockOpen(false);
            setRestockAmount('');
            fetchAllData();
        } else throw new Error();
    } catch (e) { toast.error("Gagal restock"); }
  };

  const openAddModal = () => {
      setIsEditingMode(false);
      setFormData({ name: "", price: 0, stock: 0, category: "", unit: "", image: "" });
      setIsEditOpen(true);
  };

  const openEditModal = (p: any) => {
      setIsEditingMode(true);
      setFormData(p); 
      setIsEditOpen(true);
  };

  const openRestockModal = (p: any) => {
      setSelectedProduct(p);
      setRestockAmount('');
      setIsRestockOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
            <Link href="/">
                <Button variant="outline" size="icon" className="h-10 w-10 border-slate-300 hover:bg-slate-100">
                    <ArrowLeft className="h-5 w-5 text-slate-700" />
                </Button>
            </Link>
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Manajemen Produk</h1>
                <p className="text-slate-500 text-sm">Tambah, edit, dan atur stok barang.</p>
            </div>
        </div>
        <Button onClick={openAddModal} className="bg-primary hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" /> Tambah Produk
        </Button>
      </div>

      <div className="bg-white p-4 rounded-lg border shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input placeholder="Cari nama produk..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)}/>
        </div>
        <div className="w-full md:w-48">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger><SelectValue placeholder="Kategori" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="Semua">Semua Kategori</SelectItem>
                    {categoriesList.map(c => (<SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>))}
                </SelectContent>
            </Select>
        </div>
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <Table>
            <TableHeader className="bg-slate-50">
                <TableRow>
                    <TableHead>Produk</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Harga</TableHead>
                    <TableHead className="text-center">Stok</TableHead>
                    <TableHead className="text-center">Satuan</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {isLoading ? (
                    <TableRow><TableCell colSpan={6} className="h-24 text-center"><div className="flex justify-center items-center gap-2 text-slate-500"><Loader2 className="animate-spin h-5 w-5" /> Memuat data...</div></TableCell></TableRow>
                ) : filteredProducts.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="h-24 text-center text-slate-500">Produk tidak ditemukan.</TableCell></TableRow>
                ) : (
                    filteredProducts.map((p) => (
                        <TableRow key={p.id}>
                            <TableCell className="font-medium">
                                <div className="flex items-center gap-3">
                                    {p.image ? (
                                        <img src={p.image} alt={p.name} className="h-10 w-10 rounded object-cover border bg-slate-100" />
                                    ) : (
                                        <div className="h-10 w-10 rounded bg-slate-100 border flex items-center justify-center text-slate-400"><ImageIcon className="h-4 w-4" /></div>
                                    )}
                                    <span>{p.name}</span>
                                </div>
                            </TableCell>
                            <TableCell><span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-slate-50 text-slate-600">{p.category}</span></TableCell>
                            <TableCell>{formatRupiah(p.price)}</TableCell>
                            <TableCell className="text-center"><span className={`font-bold ${p.stock < 5 ? 'text-red-500' : 'text-slate-700'}`}>{p.stock}</span></TableCell>
                            <TableCell className="text-center text-sm text-slate-500">{p.unit || '-'}</TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                    <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50" onClick={() => openRestockModal(p)} title="Tambah Stok"><PackagePlus className="h-4 w-4" /></Button>
                                    <Button size="sm" variant="ghost" onClick={() => openEditModal(p)}><Edit className="h-4 w-4 text-blue-600" /></Button>
                                    <Button size="sm" variant="ghost" onClick={() => handleDelete(p.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px]">
            <DialogHeader><DialogTitle>{isEditingMode ? 'Edit Produk' : 'Tambah Produk Baru'}</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                    <Label>Nama Produk <span className="text-red-500">*</span></Label>
                    <Input placeholder="Contoh: Kopi Kapal Api" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label>Kategori <span className="text-red-500">*</span></Label>
                        <Select value={formData.category} onValueChange={val => setFormData({...formData, category: val})}>
                            <SelectTrigger><SelectValue placeholder="Pilih..." /></SelectTrigger>
                            <SelectContent>{categoriesList.map(c => (<SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>))}</SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label>Satuan</Label>
                        <Select value={formData.unit || ''} onValueChange={val => setFormData({...formData, unit: val})}>
                            <SelectTrigger><SelectValue placeholder="Pilih..." /></SelectTrigger>
                            <SelectContent>{unitsList.map(u => (<SelectItem key={u.id} value={u.name}>{u.name}</SelectItem>))}</SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label>Harga Jual (Rp) <span className="text-red-500">*</span></Label>
                        <Input type="number" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
                    </div>
                    <div className="grid gap-2">
                        <Label>Stok Awal</Label>
                        <Input type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: Number(e.target.value)})} disabled={isEditingMode} />
                    </div>
                </div>
                
                {/* UPLOAD GAMBAR */}
                <div className="grid gap-2">
                    <Label>Gambar Produk</Label>
                    {formData.image && (
                        <div className="mb-2 relative w-24 h-24 rounded-md overflow-hidden border">
                             <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                             <button onClick={() => setFormData({...formData, image: ''})} className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-bl-md hover:bg-red-600"><Trash2 className="h-3 w-3" /></button>
                        </div>
                    )}
                    <div className="flex gap-2 items-center">
                         <Input type="file" accept="image/*" onChange={handleImageUpload} disabled={isUploading} className="cursor-pointer" />
                         {isUploading && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
                    </div>
                    <p className="text-[10px] text-slate-400">Format: JPG, PNG. Maks 2MB.</p>
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditOpen(false)} disabled={isUploading}>Batal</Button>
                <Button onClick={handleSaveProduct} disabled={isUploading}>{isUploading ? 'Sedang Upload...' : (isEditingMode ? 'Simpan Perubahan' : 'Buat Produk')}</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isRestockOpen} onOpenChange={setIsRestockOpen}>
        <DialogContent className="sm:max-w-[400px]">
            <DialogHeader><DialogTitle className="flex items-center gap-2"><PackagePlus className="h-5 w-5 text-green-600" /> Tambah Stok Barang</DialogTitle></DialogHeader>
            {selectedProduct && (
                <div className="space-y-4 py-4">
                    <div className="bg-slate-50 p-3 rounded-md border text-sm">
                        <p className="text-slate-500">Produk:</p>
                        <p className="font-bold text-base">{selectedProduct.name}</p>
                        <div className="flex justify-between mt-2"><span>Stok Sekarang:</span><span className="font-mono font-bold">{selectedProduct.stock} {selectedProduct.unit}</span></div>
                    </div>
                    <div className="space-y-2">
                        <Label>Jumlah Barang Masuk (+)</Label>
                        <div className="flex items-center gap-2">
                            <Input type="number" placeholder="0" autoFocus className="text-lg font-bold" value={restockAmount} onChange={(e) => setRestockAmount(Number(e.target.value))} onKeyDown={(e) => e.key === 'Enter' && handleRestock()} />
                            <span className="text-slate-400 text-sm">{selectedProduct.unit || 'pcs'}</span>
                        </div>
                        <p className="text-xs text-slate-400">Stok akan menjadi: <strong>{(selectedProduct.stock || 0) + (Number(restockAmount) || 0)}</strong></p>
                    </div>
                </div>
            )}
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsRestockOpen(false)}>Batal</Button>
                <Button className="bg-green-600 hover:bg-green-700" onClick={handleRestock}>Konfirmasi Restock</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}