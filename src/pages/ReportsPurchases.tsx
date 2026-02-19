import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Download, 
  Share2,
  Eye,
  X
} from 'lucide-react';
import { Purchase } from '../types';
import { formatCurrency, formatDate } from '../lib/utils';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export default function ReportsPurchases() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/purchases').then(res => res.json()).then(setPurchases);
  }, []);

  const filteredPurchases = purchases.filter(p => 
    p.invoice_no.toLowerCase().includes(search.toLowerCase()) ||
    p.supplier_name?.toLowerCase().includes(search.toLowerCase())
  );

  const downloadReport = () => {
    const doc = new jsPDF();
    doc.text("LAPORAN PEMBELIAN STOK", 105, 20, { align: 'center' });
    
    const tableData = filteredPurchases.map(p => [
      p.invoice_no,
      formatDate(p.created_at),
      p.supplier_name || '-',
      formatCurrency(p.total_amount)
    ]);

    (doc as any).autoTable({
      startY: 30,
      head: [['Invoice', 'Tanggal', 'Supplier', 'Total']],
      body: tableData,
    });

    doc.save(`Laporan-Pembelian-${new Date().toLocaleDateString()}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari invoice atau supplier..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          onClick={downloadReport}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
        >
          <Download className="w-5 h-5" />
          Download PDF
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Invoice</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Tanggal</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Supplier</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredPurchases.map((purchase) => (
                <tr key={purchase.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-bold text-indigo-600">{purchase.invoice_no}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{formatDate(purchase.created_at)}</td>
                  <td className="px-6 py-4 text-sm text-slate-900 font-medium">{purchase.supplier_name}</td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-900">{formatCurrency(purchase.total_amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
