"use client";

import Link from "next/link";
import { useEffect, useState, useRef, useCallback } from "react";
import { formatRupiah } from "@/utils/currency";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"; 
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, FileText, Printer, Loader2, ArrowLeft, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import Receipt from "@/components/Receipt"; 
import { useReactToPrint } from 'react-to-print';
import { toast } from "sonner";
import { useDebounce } from 'use-debounce';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // --- STATE PAGINASI & FILTER ---
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search, 500);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Semua");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const limit = 10;

  const [selectedTrx, setSelectedTrx] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  // --- FETCH DATA (SERVER-SIDE) ---
  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
        search: debouncedSearch,
        paymentMethod: paymentMethod,
        startDate: startDate,
        endDate: endDate
      });

      const res = await fetch(`/api/transactions?${params.toString()}`);
      const data = await res.json();

      if (res.ok) {
        // [FIX ERROR] Ambil array dari dalam properti 'transactions'
        setTransactions(data.transactions || []);
        setTotalTransactions(data.total || 0);
      }
    } catch (error) {
      console.error("Gagal ambil data", error);
      toast.error("Gagal memuat data transaksi");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, debouncedSearch, paymentMethod, startDate, endDate]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // --- HANDLER FILTER ---
  const handleSearchChange = (val: string) => {
    setSearch(val);
    setCurrentPage(1);
    if (val.trim() !== "") {
    setPaymentMethod("Semua");
  }
  };

  const resetFilters = () => {
    setSearch("");
    setStartDate("");
    setEndDate("");
    setPaymentMethod("Semua");
    setCurrentPage(1);
  };

  // --- LOGIKA RECEIPT (Sama seperti sebelumnya) ---
  const cleanNumber = (v: any) => v ? Number(String(v).replace(/[^0-9.-]+/g, "")) : 0;

  const openReceiptModal = (trx: any) => {
    const items = typeof trx.items === 'string' ? JSON.parse(trx.items) : trx.items;
    const dbTotal = cleanNumber(trx.total);
    const calcSub = items.reduce((acc: number, item: any) => acc + (Number(item.price) * Number(item.qty)), 0);
    
    setSelectedTrx({
      ...trx,
      items,
      subTotal: calcSub > dbTotal ? calcSub : dbTotal,
      discount: calcSub > dbTotal ? calcSub - dbTotal : 0,
      total: dbTotal,
      cashAmount: cleanNumber(trx.cashAmount) || dbTotal,
      changeAmount: cleanNumber(trx.changeAmount) || 0
    });
    setIsModalOpen(true);
  };

  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: `Struk-${selectedTrx?.id}`,
  });

  const totalPages = Math.ceil(totalTransactions / limit);

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/"><Button variant="outline" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Riwayat Transaksi</h1>
          <p className="text-slate-500 text-sm">Total {totalTransactions} transaksi tercatat.</p>
        </div>
      </div>

      {/* FILTER PANEL */}
      <div className="bg-white p-4 rounded-lg border shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-500">Cari ID Transaksi</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder="TRX-..." className="pl-9" value={search} onChange={(e) => handleSearchChange(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-500">Metode</Label>
            <Select value={paymentMethod} onValueChange={(v) => {setPaymentMethod(v); setCurrentPage(1)}}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Semua">Semua Metode</SelectItem>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="QRIS">QRIS</SelectItem>
                <SelectItem value="Transfer">Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-500">Dari Tanggal</Label>
            <Input type="date" value={startDate} onChange={(e) => {setStartDate(e.target.value); setCurrentPage(1)}} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-500">Sampai Tanggal</Label>
            <Input type="date" value={endDate} onChange={(e) => {setEndDate(e.target.value); setCurrentPage(1)}} />
          </div>
        </div>
        {(search || startDate || endDate || paymentMethod !== "Semua") && (
          <Button variant="ghost" size="sm" onClick={resetFilters} className="text-red-500 h-8 text-xs">Reset Filter</Button>
        )}
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>ID Transaksi</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead>Metode</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-center">Struk</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="h-32 text-center"><Loader2 className="animate-spin h-6 w-6 mx-auto" /></TableCell></TableRow>
            ) : transactions.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="h-32 text-center text-slate-500">Data tidak ditemukan.</TableCell></TableRow>
            ) : (
              transactions.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-mono text-xs">{t.id}</TableCell>
                  <TableCell className="text-xs">{t.date}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${t.paymentMethod === 'Cash' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
                      {t.paymentMethod}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-bold">{formatRupiah(cleanNumber(t.total))}</TableCell>
                  <TableCell className="text-center">
                    <Button variant="ghost" size="sm" onClick={() => openReceiptModal(t)}><Eye className="h-4 w-4 text-blue-600" /></Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* PAGINASI ANGKA */}
        {!isLoading && totalTransactions > limit && (
          <div className="flex items-center justify-between px-4 py-4 bg-slate-50 border-t">
            <div className="text-xs text-slate-500">Halaman {currentPage} dari {totalPages}</div>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                (p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1)) && (
                  <Button key={p} variant={currentPage === p ? "default" : "outline"} size="sm" className="h-8 w-8 p-0" onClick={() => setCurrentPage(p)}>{p}</Button>
                )
              ))}
              <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        )}
      </div>

      {/* DIALOG RECEIPT */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <div className="flex justify-center bg-slate-100 py-4 rounded-md border overflow-auto max-h-[70vh]">
            {selectedTrx && (
              <div className="shadow-lg transform scale-90 origin-top">
                <Receipt ref={receiptRef} {...selectedTrx} />
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Tutup</Button>
            <Button onClick={() => handlePrint()}><Printer className="mr-2 h-4 w-4" /> Cetak</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}