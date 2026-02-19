import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  ShoppingCart,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { format } from 'date-fns';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalSales: 0,
    totalProfit: 0,
    totalProducts: 0,
    lowStock: 0
  });

  useEffect(() => {
    async function fetchData() {
      const [salesRes, productsRes] = await Promise.all([
        fetch('/api/sales'),
        fetch('/api/products')
      ]);
      const sales = await salesRes.json();
      const products = await productsRes.json();

      const totalSales = sales.reduce((acc: number, s: any) => acc + s.total_amount, 0);
      const totalProfit = sales.reduce((acc: number, s: any) => acc + s.total_profit, 0);
      const lowStockItems = products.filter((p: any) => p.stock < 10);

      // Group sales by day for chart
      const salesByDay = sales.reduce((acc: any, s: any) => {
        const day = format(new Date(s.created_at), 'dd MMM');
        acc[day] = (acc[day] || 0) + s.total_amount;
        return acc;
      }, {});

      const chartData = Object.entries(salesByDay).map(([name, sales]) => ({ name, sales })).reverse().slice(-7);

      setStats({
        totalSales,
        totalProfit,
        totalProducts: products.length,
        lowStock: lowStockItems.length,
        chartData,
        lowStockItems: lowStockItems.slice(0, 5)
      });
    }
    fetchData();
  }, []);

  const [dashboardData, setDashboardData] = useState<any>({ chartData: [], lowStockItems: [] });
  // Update the setStats to use dashboardData
  useEffect(() => {
    setDashboardData({ chartData: stats.chartData || [], lowStockItems: stats.lowStockItems || [] });
  }, [stats]);

  const cards = [
    { 
      name: 'Total Penjualan', 
      value: formatCurrency(stats.totalSales), 
      icon: ShoppingCart, 
      color: 'bg-blue-500',
      trend: '+12.5%',
      trendUp: true
    },
    { 
      name: 'Total Laba', 
      value: formatCurrency(stats.totalProfit), 
      icon: TrendingUp, 
      color: 'bg-emerald-500',
      trend: '+8.2%',
      trendUp: true
    },
    { 
      name: 'Total Produk', 
      value: stats.totalProducts, 
      icon: Package, 
      color: 'bg-amber-500',
      trend: 'Baru ditambahkan',
      trendUp: true
    },
    { 
      name: 'Stok Menipis', 
      value: stats.lowStock, 
      icon: TrendingDown, 
      color: 'bg-rose-500',
      trend: 'Perlu restock',
      trendUp: false
    },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => (
          <div key={card.name} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className={cn("p-3 rounded-xl text-white", card.color)}>
                <card.icon className="w-6 h-6" />
              </div>
              <div className={cn(
                "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
                card.trendUp ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
              )}>
                {card.trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {card.trend}
              </div>
            </div>
            <p className="text-sm text-slate-500 font-medium">{card.name}</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{card.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Grafik Penjualan (7 Hari Terakhir)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboardData.chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="sales" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Stok Menipis</h3>
          <div className="space-y-4">
            {dashboardData.lowStockItems.length > 0 ? (
              dashboardData.lowStockItems.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center border border-slate-200">
                      <Package className="w-4 h-4 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{item.name}</p>
                      <p className="text-xs text-slate-500">{item.sku}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-lg">
                    {item.stock} unit
                  </span>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
                <Package className="w-12 h-12 opacity-10 mb-2" />
                <p className="text-sm">Semua stok aman</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { cn } from '../lib/utils';
