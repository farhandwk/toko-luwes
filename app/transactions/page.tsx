"use client";

import Link from "next/link";
import { useEffect, useState, useRef, useMemo } from "react";
import { formatRupiah } from "@/utils/currency";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"; 
import { 
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { 
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter 
} from "@/components/ui/dialog";
import { 
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Search, FileText, Printer, Loader2, ArrowLeft, Eye, Calendar } from "lucide-react";
import Receipt from "@/components/Receipt"; 
import { useReactToPrint } from 'react-to-print';
import { toast } from "sonner";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc"); 
  
  const [selectedTrx, setSelectedTrx] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  // Helper: Bersihkan format angka
  const cleanNumber = (value: any) => {
      if (!value) return 0;
      const cleanString = String(value).replace(/[^0-9,-]+/g,""); 
      return Number(cleanString) || 0;
  };

  const parseCustomDate = (dateStr: string) => {
    if (!dateStr) return new Date();
    const standardDate = new Date(dateStr);
    if (!isNaN(standardDate.getTime())) return standardDate;

    try {
        const parts = dateStr.split(','); 
        const datePart = parts[0].trim(); 
        const timePart = parts[1] ? parts[1].trim() : "00:00:00";
        const [day, month, year] = datePart.split('/').map(Number);
        const [hour, minute, second] = timePart.split(':').map(Number);
        return new Date(year, month - 1, day, hour || 0, minute || 0, second || 0);
    } catch (e) { return new Date(); }
  };

  useEffect(() => {
    async function fetchTransactions() {
      try {
        const res = await fetch('/api/transactions');
        const data = await res.json();
        setTransactions(data);
      } catch (error) {
        console.error("Gagal ambil data", error);
        toast.error("Gagal memuat data transaksi");
      } finally {
        setIsLoading(false);
      }
    }
    fetchTransactions();
  }, []);

  const filteredAndSortedTransactions = useMemo(() => {
    let data = [...transactions];
    if (search) {
        const lowerSearch = search.toLowerCase();
        data = data.filter(t => 
            t.id.toLowerCase().includes(lowerSearch) ||
            (t.paymentMethod && t.paymentMethod.toLowerCase().includes(lowerSearch))
        );
    }
    if (startDate || endDate) {
        data = data.filter(t => {
            const tDate = parseCustomDate(t.date);
            const tTime = new Date(tDate.getFullYear(), tDate.getMonth(), tDate.getDate()).getTime();
            let isValid = true;
            if (startDate) {
                const sDate = new Date(startDate); 
                const sTime = new Date(sDate.getFullYear(), sDate.getMonth(), sDate.getDate()).getTime();
                if (tTime < sTime) isValid = false;
            }
            if (endDate) {
                const eDate = new Date(endDate);
                const eTime = new Date(eDate.getFullYear(), eDate.getMonth(), eDate.getDate()).getTime();
                if (tTime > eTime) isValid = false;
            }
            return isValid;
        });
    }
    data.sort((a, b) => {
        const dateA = parseCustomDate(a.date).getTime();
        const dateB = parseCustomDate(b.date).getTime();
        return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });
    return data;
  }, [transactions, search, startDate, endDate, sortOrder]);

  const parseItems = (itemsData: any) => {
      try {
          if (typeof itemsData === 'string') return JSON.parse(itemsData);
          return itemsData;
      } catch (e) { return []; }
  };

  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: `Struk-${selectedTrx?.id}`,
    onAfterPrint: () => toast.success("Struk dicetak ulang!"),
  });

  // --- LOGIKA UTAMA PERBAIKAN STRUK ---
  const openReceiptModal = (trx: any) => {
      const items = parseItems(trx.items);
      
      // 1. Ambil Total Akhir dari Database (Ini yang paling dipercaya sebagai nominal bayar)
      const dbTotal = cleanNumber(trx.total);

      // 2. HITUNG ULANG Subtotal berdasarkan item
      // Kita tidak percaya kolom 'subTotal' di DB karena sering kosong/error
      const calculatedSubTotal = items.reduce((acc: number, item: any) => {
          return acc + (Number(item.price) * Number(item.qty));
      }, 0);

      // 3. Tentukan Diskon
      // Jika hasil hitungan item (misal 91.200) lebih besar dari Total di DB (90.000),
      // berarti selisihnya adalah diskon (1.200).
      let finalDiscount = 0;
      let finalSubTotal = calculatedSubTotal;

      if (calculatedSubTotal > dbTotal) {
          finalDiscount = calculatedSubTotal - dbTotal;
      } else if (calculatedSubTotal < dbTotal) {
          // Kasus aneh: Total item lebih kecil dari bayar (mungkin ada biaya tambahan?)
          // Kita set subtotal mengikuti total agar tidak minus
          finalSubTotal = dbTotal;
      }

      // 4. Perbaiki Tampilan Uang Diterima (Cash)
      let cashIn = cleanNumber(trx.cashAmount);
      let changeIn = cleanNumber(trx.changeAmount);
      // Fallback: Jika cashIn 0 (data lama), anggap uang pas
      if (cashIn === 0 && trx.paymentMethod === 'Cash') {
          cashIn = dbTotal;
          changeIn = 0;
      }

      const cleanTrx = {
          ...trx,
          items: items,
          discount: finalDiscount,   // Pakai hasil hitungan
          subTotal: finalSubTotal,   // Pakai hasil hitungan
          total: dbTotal,            // Pakai data DB
          cashAmount: cashIn,
          changeAmount: changeIn,
      };
      setSelectedTrx(cleanTrx);
      setIsModalOpen(true);
  };

  const resetFilters = () => {
      setSearch("");
      setStartDate("");
      setEndDate("");
      setSortOrder("desc");
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      
      {/* HEADER KEMBALI SEPERTI AWAL (Tanpa Navbar) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
            <Link href="/">
                <Button variant="outline" size="icon" className="h-10 w-10 border-slate-300">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
            </Link>
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Riwayat Transaksi</h1>
                <p className="text-slate-500 text-sm">Rekap penjualan toko.</p>
            </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-4 relative">
                <Label className="text-xs text-slate-500 mb-1.5 block">Cari ID / Metode</Label>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input placeholder="Cari ID Transaksi..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
            </div>
            <div className="md:col-span-3">
                <Label className="text-xs text-slate-500 mb-1.5 block">Dari Tanggal</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="block w-full" />
            </div>
            <div className="md:col-span-3">
                <Label className="text-xs text-slate-500 mb-1.5 block">Sampai Tanggal</Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="block w-full" />
            </div>
            <div className="md:col-span-2">
                <Label className="text-xs text-slate-500 mb-1.5 block">Urutkan</Label>
                <Select value={sortOrder} onValueChange={(v: "asc" | "desc") => setSortOrder(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="desc">Terbaru</SelectItem>
                        <SelectItem value="asc">Terlama</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
        {(search || startDate || endDate || sortOrder !== 'desc') && (
            <div className="flex justify-end">
                <Button variant="ghost" size="sm" onClick={resetFilters} className="text-red-500 h-8 text-xs hover:bg-red-50 hover:text-red-600">Reset Filter</Button>
            </div>
        )}
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <Table>
            <TableHeader className="bg-slate-50">
                <TableRow>
                    <TableHead>ID Transaksi</TableHead>
                    <TableHead>Tanggal & Waktu</TableHead>
                    <TableHead>Metode</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-center">Aksi</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {isLoading ? (
                    <TableRow><TableCell colSpan={5} className="h-24 text-center"><Loader2 className="animate-spin h-5 w-5 mx-auto" /> Memuat data...</TableCell></TableRow>
                ) : filteredAndSortedTransactions.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="h-32 text-center text-slate-500">Tidak ada transaksi ditemukan.</TableCell></TableRow>
                ) : (
                    filteredAndSortedTransactions.map((t) => (
                        <TableRow key={t.id} className="hover:bg-slate-50 transition-colors">
                            <TableCell className="font-mono text-xs text-slate-600">{t.id}</TableCell>
                            <TableCell>
                                <div className="flex flex-col">
                                    <span className="font-medium">
                                        {parseCustomDate(t.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </span>
                                    <span className="text-xs text-slate-400">
                                        {parseCustomDate(t.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${t.paymentMethod === 'Cash' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                                    {t.paymentMethod || 'Cash'}
                                </span>
                            </TableCell>
                            <TableCell className="text-right font-bold text-slate-900">
                                {formatRupiah(cleanNumber(t.total))}
                            </TableCell>
                            <TableCell className="text-center">
                                <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-slate-200" onClick={() => openReceiptModal(t)} title="Lihat Struk">
                                    <Eye className="h-4 w-4 text-blue-600" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
        <div className="bg-slate-50 border-t p-3 text-xs text-slate-500 text-center">
            Menampilkan <strong>{filteredAndSortedTransactions.length}</strong> transaksi
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
            <DialogHeader><DialogTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Detail Transaksi</DialogTitle></DialogHeader>
            <div className="flex justify-center bg-slate-100 py-4 rounded-md border overflow-auto max-h-[60vh]">
                {selectedTrx && (
                    <div className="shadow-lg transform scale-90 origin-top">
                        <Receipt 
                            ref={receiptRef}
                            items={selectedTrx.items}
                            subtotal={selectedTrx.subTotal} 
                            total={selectedTrx.total} 
                            discount={selectedTrx.discount}
                            paymentMethod={selectedTrx.paymentMethod}
                            cashAmount={selectedTrx.cashAmount}
                            changeAmount={selectedTrx.changeAmount}
                            date={selectedTrx.date}
                            id={selectedTrx.id}
                            logoUrl="/logo.png" 
                        />
                    </div>
                )}
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>Tutup</Button>
                <Button onClick={() => handlePrint()}><Printer className="mr-2 h-4 w-4" /> Cetak Ulang</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}