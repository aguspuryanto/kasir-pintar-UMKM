import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Download, 
  Share2,
  Calendar,
  Eye
} from 'lucide-react';
import { Sale } from '../types';
import { formatCurrency, formatDate, cn } from '../lib/utils';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export default function ReportsSales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [search, setSearch] = useState('');
  const [selectedSale, setSelectedSale] = useState<any>(null);

  useEffect(() => {
    fetch('/api/sales').then(res => res.json()).then(setSales);
  }, []);

  const filteredSales = sales.filter(s => 
    s.invoice_no.toLowerCase().includes(search.toLowerCase()) ||
    s.customer_name.toLowerCase().includes(search.toLowerCase())
  );

  const downloadReport = () => {
    const doc = new jsPDF();
    doc.text("LAPORAN PENJUALAN", 105, 20, { align: 'center' });
    
    const tableData = filteredSales.map(s => [
      s.invoice_no,
      formatDate(s.created_at),
      s.customer_name,
      s.payment_method,
      formatCurrency(s.total_amount)
    ]);

    (doc as any).autoTable({
      startY: 30,
      head: [['Invoice', 'Tanggal', 'Pelanggan', 'Metode', 'Total']],
      body: tableData,
    });

    doc.save(`Laporan-Penjualan-${new Date().toLocaleDateString()}.pdf`);
  };

  const shareSummary = () => {
    const total = filteredSales.reduce((acc, s) => acc + s.total_amount, 0);
    const text = `*RINGKASAN PENJUALAN*\n` +
      `Periode: ${new Date().toLocaleDateString()}\n` +
      `Total Transaksi: ${filteredSales.length}\n` +
      `Total Omzet: ${formatCurrency(total)}\n` +
      `--------------------------\n` +
      `Dikirim dari KasirPintar UMKM`;
    
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari invoice atau pelanggan..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={downloadReport}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <Download className="w-5 h-5" />
            PDF
          </button>
          <button
            onClick={shareSummary}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors"
          >
            <Share2 className="w-5 h-5" />
            Share WA
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Invoice</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Tanggal</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Pelanggan</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Metode</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Total</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-bold text-indigo-600">{sale.invoice_no}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{formatDate(sale.created_at)}</td>
                  <td className="px-6 py-4 text-sm text-slate-900 font-medium">{sale.customer_name}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                      {sale.payment_method}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-900">{formatCurrency(sale.total_amount)}</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={async () => {
                        const res = await fetch(`/api/sales/${sale.id}`);
                        const data = await res.json();
                        setSelectedSale(data);
                      }}
                      className="p-2 text-slate-400 hover:text-indigo-600"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedSale && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">Detail Penjualan</h3>
              <button onClick={() => setSelectedSale(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500">Invoice</p>
                  <p className="font-bold">{selectedSale.invoice_no}</p>
                </div>
                <div>
                  <p className="text-slate-500">Tanggal</p>
                  <p className="font-bold">{formatDate(selectedSale.created_at)}</p>
                </div>
              </div>
              <div className="border-t border-slate-100 pt-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-slate-500">
                      <th className="text-left font-medium pb-2">Produk</th>
                      <th className="text-center font-medium pb-2">Qty</th>
                      <th className="text-right font-medium pb-2">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedSale.items.map((item: any) => (
                      <tr key={item.id}>
                        <td className="py-2">{item.product_name}</td>
                        <td className="py-2 text-center">{item.quantity}</td>
                        <td className="py-2 text-right">{formatCurrency(item.price * item.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-slate-100">
                      <td colSpan={2} className="py-4 font-bold">TOTAL</td>
                      <td className="py-4 text-right font-bold text-indigo-600">{formatCurrency(selectedSale.total_amount)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { X } from 'lucide-react';
