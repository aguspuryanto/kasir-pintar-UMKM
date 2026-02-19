/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import ProductMaster from './pages/ProductMaster';
import SupplierMaster from './pages/SupplierMaster';
import Purchases from './pages/Purchases';
import ReportsSales from './pages/ReportsSales';
import ReportsPurchases from './pages/ReportsPurchases';
import ReportsProfitLoss from './pages/ReportsProfitLoss';
import Login from './pages/Login';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Not authenticated');
      })
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
        <Route path="/" element={user ? <Layout user={user} /> : <Navigate to="/login" />}>
          <Route index element={<Dashboard />} />
          <Route path="pos" element={<POS />} />
          <Route path="products" element={<ProductMaster />} />
          <Route path="suppliers" element={<SupplierMaster />} />
          <Route path="purchases" element={<Purchases />} />
          <Route path="reports/sales" element={<ReportsSales />} />
          <Route path="reports/purchases" element={<ReportsPurchases />} />
          <Route path="reports/profit-loss" element={<ReportsProfitLoss />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
