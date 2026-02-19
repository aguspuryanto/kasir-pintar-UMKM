import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight,
  Share2,
  Download
} from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { startOfMonth, endOfMonth, format } from 'date-fns';

export default function ReportsProfitLoss() {
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });
  const [data, setData] = useState({ total_sales: 0, total_profit: 0 });

  useEffect(() => {
    fetch(`/api/reports/profit-loss?start=${dateRange.start}&end=${dateRange.end}`)
      .then(res => res.json())
      .then(setData);
  }, [dateRange]);

  const shareReport = () => {
    const text = `*LAPORAN LABA RUGI*\n` +
      `Periode: ${dateRange.start} s/d ${dateRange.end}\n` +
      `--------------------------\n` +
      `Total Penjualan: ${formatCurrency(data.total_sales || 0)}\n` +
      `Total Laba Bersih: ${formatCurrency(data.total_profit || 0)}\n` +
      `Margin Laba: ${data.total_sales ? ((data.total_profit / data.total_sales) * 100).toFixed(1) : 0}%\n` +
      `--------------------------\n` +
      `Dikirim dari KasirPintar UMKM`;
    
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input 
              type="date" 
              className="bg-transparent text-sm font-medium focus:outline-none"
              value={dateRange.start}
              onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            />
          </div>
          <span className="text-slate-300">s/d</span>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input 
              type="date" 
              className="bg-transparent text-sm font-medium focus:outline-none"
              value={dateRange.end}
              onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={shareReport}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors text-sm font-bold"
          >
            <Share2 className="w-4 h-4" />
            Share WA
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <TrendingUp className="w-32 h-32" />
          </div>
          <p className="text-slate-500 font-medium mb-2">Total Penjualan (Omzet)</p>
          <h3 className="text-4xl font-black text-slate-900 mb-6">{formatCurrency(data.total_sales || 0)}</h3>
          <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
            <ArrowUpRight className="w-4 h-4" />
            Pendapatan Kotor
          </div>
        </div>

        <div className="bg-indigo-600 p-8 rounded-3xl shadow-xl relative overflow-hidden text-white">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <TrendingUp className="w-32 h-32" />
          </div>
          <p className="text-indigo-100 font-medium mb-2">Laba Bersih</p>
          <h3 className="text-4xl font-black mb-6">{formatCurrency(data.total_profit || 0)}</h3>
          <div className="flex items-center gap-2 text-indigo-100 font-bold text-sm">
            <ArrowUpRight className="w-4 h-4" />
            Keuntungan Real
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <h3 className="text-xl font-bold text-slate-900 mb-6">Ringkasan Performa</h3>
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <TrendingUp className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Margin Keuntungan</p>
                <p className="text-xs text-slate-500">Persentase laba dari omzet</p>
              </div>
            </div>
            <span className="text-2xl font-black text-slate-900">
              {data.total_sales ? ((data.total_profit / data.total_sales) * 100).toFixed(1) : 0}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
