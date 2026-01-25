"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatRupiah } from "@/utils/currency";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Save, Trash2, Users, Tag } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdmingrosirPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [prices, setPrices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form States
  const [newGroup, setNewGroup] = useState("");
  const [priceForm, setPriceForm] = useState({ product_id: "", group_id: "", price: 0 });

  async function fetchData() {
    setLoading(true);
    try {
      const [resgrosir, resProd] = await Promise.all([ fetch('/api/grosir'), fetch('/api/products') ]);
      const datagrosir = await resgrosir.json();
      const dataProd = await resProd.json();

      setGroups(datagrosir.groups || []);
      setPrices(datagrosir.prices || []);
      
      // Filter hanya produk kategori "grosir" (Optional, atau tampilkan semua)
      // Disini saya tampilkan semua produk agar Boss bisa pilih mana yg mau diset harganya
      setProducts(Array.isArray(dataProd) ? dataProd : []);
    } catch (e) { toast.error("Gagal memuat data"); } 
    finally { setLoading(false); }
  }

  useEffect(() => { fetchData(); }, []);

  const handleAddGroup = async () => {
    if (!newGroup) return toast.error("Nama grup wajib diisi");
    await fetch('/api/grosir', {
        method: 'POST', body: JSON.stringify({ type: 'group', data: { name: newGroup } })
    });
    toast.success("Grup pelanggan ditambah!");
    setNewGroup(""); fetchData();
  };

  const handleDeleteGroup = async (id: string) => {
    if(!confirm("Hapus grup ini?")) return;
    await fetch('/api/grosir', { method: 'POST', body: JSON.stringify({ type: 'delete_group', data: { id } }) });
    fetchData();
  }

  const handleSetPrice = async () => {
    if (!priceForm.product_id || !priceForm.group_id || priceForm.price <= 0) return toast.error("Data tidak lengkap");
    await fetch('/api/grosir', {
        method: 'POST', body: JSON.stringify({ type: 'price', data: priceForm })
    });
    toast.success("Harga khusus disimpan!");
    fetchData();
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/"><Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div>
            <h1 className="text-2xl font-bold">Kontrol Harga grosir & Grosir</h1>
            <p className="text-slate-500">Atur pelanggan spesial dan harga khusus mereka.</p>
        </div>
      </div>

      <Tabs defaultValue="groups" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="groups"><Users className="mr-2 h-4 w-4"/> Kelompok Pelanggan</TabsTrigger>
            <TabsTrigger value="prices"><Tag className="mr-2 h-4 w-4"/> Atur Harga Khusus</TabsTrigger>
        </TabsList>

        {/* TAB 1: GRUP PELANGGAN */}
        <TabsContent value="groups" className="space-y-4 py-4">
            <div className="flex gap-2">
                <Input placeholder="Nama Grup (Misal: Pengecer, Warung, Tetangga)" value={newGroup} onChange={e => setNewGroup(e.target.value)} />
                <Button onClick={handleAddGroup}><Save className="mr-2 h-4 w-4" /> Simpan</Button>
            </div>
            <div className="bg-white border rounded-lg">
                <Table>
                    <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Nama Grup</TableHead><TableHead className="text-right">Aksi</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {groups.map(g => (
                            <TableRow key={g.id}>
                                <TableCell className="font-mono text-xs">{g.id}</TableCell>
                                <TableCell className="font-bold">{g.name}</TableCell>
                                <TableCell className="text-right"><Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleDeleteGroup(g.id)}><Trash2 className="h-4 w-4"/></Button></TableCell>
                            </TableRow>
                        ))}
                        {groups.length === 0 && <TableRow><TableCell colSpan={3} className="text-center py-8 text-slate-400">Belum ada grup pelanggan.</TableCell></TableRow>}
                    </TableBody>
                </Table>
            </div>
        </TabsContent>

        {/* TAB 2: HARGA KHUSUS */}
        <TabsContent value="prices" className="space-y-4 py-4">
            <div className="bg-slate-50 p-4 rounded-lg border grid gap-4 md:grid-cols-3 items-end">
                <div className="space-y-2">
                    <Label>Pilih Produk</Label>
                    <Select onValueChange={v => setPriceForm({...priceForm, product_id: v})}>
                        <SelectTrigger><SelectValue placeholder="Pilih Produk..." /></SelectTrigger>
                        <SelectContent>
                            {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({formatRupiah(p.price)})</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Pilih Grup Pelanggan</Label>
                    <Select onValueChange={v => setPriceForm({...priceForm, group_id: v})}>
                        <SelectTrigger><SelectValue placeholder="Pilih Grup..." /></SelectTrigger>
                        <SelectContent>
                            {groups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Harga Khusus (Rp)</Label>
                    <div className="flex gap-2">
                        <Input type="number" placeholder="0" onChange={e => setPriceForm({...priceForm, price: Number(e.target.value)})} />
                        <Button onClick={handleSetPrice}>Set</Button>
                    </div>
                </div>
            </div>

            <div className="bg-white border rounded-lg">
                <Table>
                    <TableHeader><TableRow><TableHead>Produk</TableHead><TableHead>Grup Pelanggan</TableHead><TableHead>Harga Khusus</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {prices.map(price => {
                            const prod = products.find(p => p.id === price.product_id);
                            const grp = groups.find(g => g.id === price.group_id);
                            if (!prod || !grp) return null;
                            return (
                                <TableRow key={price.id}>
                                    <TableCell>{prod.name}</TableCell>
                                    <TableCell><span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold">{grp.name}</span></TableCell>
                                    <TableCell className="font-bold text-green-600">{formatRupiah(price.price)}</TableCell>
                                </TableRow>
                            )
                        })}
                         {prices.length === 0 && <TableRow><TableCell colSpan={3} className="text-center py-8 text-slate-400">Belum ada harga khusus diatur.</TableCell></TableRow>}
                    </TableBody>
                </Table>
            </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}