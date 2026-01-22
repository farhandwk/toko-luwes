"use client";

import React, { useEffect, useState } from 'react';
import { formatRupiah } from '@/utils/currency';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2, ArrowLeft, Calendar, FileText, XCircle } from 'lucide-react'; // <--- Tambah XCircle
import Link from 'next/link';

interface Transaction {
  id: string;
  date: string;
  items: string;
  total: string;
  paymentMethod: string;
  proofLink: string;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const res = await fetch('/api/transactions');
      const data = await res.json();
      setTransactions(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ FUNGSI PARSE TANGGAL & JAM (ROBUS)
  const parseDate = (dateStr: string) => {
    if (!dateStr) return new Date(0);

    let cleanDateStr = dateStr;
    let timeStr = "00:00:00";

    // Pisahkan Tanggal dan Jam jika ada koma (format baru)
    if (dateStr.includes(',')) {
        const parts = dateStr.split(',');
        cleanDateStr = parts[0].trim();
        timeStr = parts[1].trim();
    }

    let dateObj = new Date();
    
    // Deteksi Format Tanggal
    if (cleanDateStr.includes('/')) {
        // Format Indonesia: DD/MM/YYYY
        const [d, m, y] = cleanDateStr.split('/');
        dateObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    } else if (cleanDateStr.includes('-')) {
        // Format ISO: YYYY-MM-DD
        dateObj = new Date(cleanDateStr);
    }

    // Set Jam (Penting untuk Sorting yang presisi)
    if (timeStr) {
        const [h, m, s] = timeStr.split(':').map(Number);
        if (!isNaN(h)) dateObj.setHours(h);
        if (!isNaN(m)) dateObj.setMinutes(m);
        if (!isNaN(s)) dateObj.setSeconds(s || 0);
    }

    return dateObj;
  };

  // LOGIKA FILTER & SORTING
  const filteredData = transactions.filter((trx) => {
    if (!startDate && !endDate) return true;
    
    const trxDate = parseDate(trx.date);
    trxDate.setHours(0, 0, 0, 0); // Reset jam untuk perbandingan tanggal saja

    const start = startDate ? new Date(startDate) : null;
    if (start) start.setHours(0, 0, 0, 0);

    const end = endDate ? new Date(endDate) : null;
    if (end) end.setHours(0, 0, 0, 0);

    if (start && trxDate < start) return false;
    if (end && trxDate > end) return false;
    
    return true;
  }).sort((a, b) => {
     const dateA = parseDate(a.date).getTime();
     const dateB = parseDate(b.date).getTime();
     return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
  });

  const parseItems = (jsonString: string) => {
    try {
      const items = JSON.parse(jsonString);
      return items.map((i: any) => `${i.name} (x${i.qty})`).join(', ');
    } catch {
      return "-";
    }
  };

  // Handler Hapus Filter
  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-4">
            <Link href="/">
                <Button variant="outline" size="icon">
                    <ArrowLeft className="h-4 w-4" />
                </Button>
            </Link>
            <div>
                <h1 className="text-2xl font-bold">Riwayat Transaksi</h1>
                <p className="text-slate-500 text-sm">Rekap penjualan toko</p>
            </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-lg border shadow-sm flex flex-col lg:flex-row gap-4 justify-between items-end lg:items-center">
            
            {/* Group Kiri: Date Inputs + Reset Button */}
            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto items-end sm:items-center">
                <div className="flex flex-col md:flex-row gap-2 w-full sm:w-auto">
                    <div className="grid gap-1.5 flex-1 sm:flex-none">
                        <label className="text-xs font-medium text-slate-500">Dari Tanggal</label>
                        <div className="relative">
                            <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                            <Input 
                                type="date" 
                                className="pl-9 w-full sm:w-[160px]" 
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="grid gap-1.5 flex-1 sm:flex-none">
                        <label className="text-xs font-medium text-slate-500">Sampai Tanggal</label>
                        <div className="relative">
                            <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                            <Input 
                                type="date" 
                                className="pl-9 w-full sm:w-[160px]" 
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* TOMBOL HAPUS FILTER (Muncul hanya jika ada filter) */}
                {(startDate || endDate) && (
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={clearFilters}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 h-10 px-3"
                    >
                        <XCircle className="mr-2 h-4 w-4" />
                        Hapus Filter
                    </Button>
                )}
            </div>

            {/* Group Kanan: Sort */}
            <div className="grid gap-1.5 w-full lg:w-[150px]">
                <label className="text-xs font-medium text-slate-500">Urutkan</label>
                <Select value={sortOrder} onValueChange={setSortOrder}>
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="newest">Terbaru</SelectItem>
                        <SelectItem value="oldest">Terlama</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>

        {/* Table Transaksi */}
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[120px]">ID TRX</TableHead>
                        <TableHead>Waktu</TableHead>
                        <TableHead className="hidden md:table-cell">Items</TableHead>
                        <TableHead>Metode</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-center">Aksi</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">
                                <div className="flex justify-center items-center gap-2 text-slate-500">
                                    <Loader2 className="h-4 w-4 animate-spin" /> Memuat Data...
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : filteredData.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                                Tidak ada transaksi ditemukan.
                            </TableCell>
                        </TableRow>
                    ) : (
                        filteredData.map((trx) => (
                            <TableRow key={trx.id}>
                                <TableCell className="font-mono text-xs text-slate-500">{trx.id}</TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-medium text-sm">
                                            {trx.date.includes(',') ? trx.date.split(',')[0] : trx.date}
                                        </span>
                                        <span className="text-xs text-slate-400">
                                            {trx.date.includes(',') ? trx.date.split(',')[1] : ''}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="hidden md:table-cell text-sm text-slate-600 truncate max-w-[200px]">
                                    {parseItems(trx.items)}
                                </TableCell>
                                <TableCell>
                                    <span className={`px-2 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider ${
                                        trx.paymentMethod === 'Cash' 
                                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                                        : 'bg-blue-100 text-blue-700 border border-blue-200'
                                    }`}>
                                        {trx.paymentMethod}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right font-bold text-slate-900">
                                    {formatRupiah(Number(trx.total))}
                                </TableCell>
                                <TableCell className="text-center">
                                    {trx.proofLink ? (
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50">
                                                    <FileText className="h-4 w-4" />
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-sm">
                                                <DialogHeader>
                                                    <DialogTitle>Bukti Transaksi</DialogTitle>
                                                </DialogHeader>
                                                <div className="flex justify-center p-4 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                                                    <img 
                                                        src={trx.proofLink} 
                                                        alt="Struk Belanja" 
                                                        className="w-full h-auto object-contain shadow-md"
                                                    />
                                                </div>
                                                <div className="flex justify-center pt-2">
                                                    <Button variant="outline" size="sm" asChild className="text-xs">
                                                        <a href={trx.proofLink} target="_blank" rel="noreferrer">
                                                            Buka Link Asli ↗
                                                        </a>
                                                    </Button>
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    ) : (
                                        <span className="text-xs text-slate-300">-</span>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
      </div>
    </div>
  );
}