import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Truck,
  X,
  ShoppingCart,
  ChevronRight,
  Package
} from 'lucide-react';
import { Product, Supplier, Purchase } from '../types';
import { formatCurrency, cn } from '../lib/utils';

export default function Purchases() {
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [cart, setCart] = useState<(Product & { quantity: number })[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/products').then(res => res.json()).then(setProducts);
    fetch('/api/suppliers').then(res => res.json()).then(setSuppliers);
  }, []);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updatePrice = (productId: number, price: number) => {
    setCart(prev => prev.map(item => 
      item.id === productId ? { ...item, price_buy: price } : item
    ));
  };

  const updateQuantity = (productId: number, qty: number) => {
    setCart(prev => prev.map(item => 
      item.id === productId ? { ...item, quantity: Math.max(1, qty) } : item
    ));
  };

  const total = cart.reduce((acc, item) => acc + (item.price_buy * item.quantity), 0);

  const handlePurchase = async () => {
    if (cart.length === 0 || !selectedSupplier) return;
    setIsProcessing(true);
    try {
      await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart,
          supplier_id: Number(selectedSupplier),
          total_amount: total
        })
      });
      setCart([]);
      setSelectedSupplier('');
      alert('Pembelian stok berhasil dicatat!');
    } catch (error) {
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col lg:flex-row gap-6">
      <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari produk untuk restock..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredProducts.map(product => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="flex items-center gap-4 p-3 rounded-xl border border-slate-200 hover:border-indigo-500 hover:shadow-sm transition-all text-left"
              >
                <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                  <Package className="w-6 h-6 text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-900 truncate">{product.name}</h4>
                  <p className="text-xs text-slate-500">Stok saat ini: {product.stock}</p>
                </div>
                <Plus className="w-5 h-5 text-indigo-600" />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full lg:w-[450px] flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden shrink-0">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <Truck className="w-5 h-5 text-indigo-600" />
            Daftar Pembelian Stok
          </h3>
        </div>

        <div className="p-4 border-b border-slate-200">
          <label className="block text-sm font-medium text-slate-700 mb-1">Pilih Supplier</label>
          <select
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={selectedSupplier}
            onChange={(e) => setSelectedSupplier(e.target.value)}
          >
            <option value="">-- Pilih Supplier --</option>
            {suppliers.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 py-8">
              <Truck className="w-12 h-12 opacity-20 mb-2" />
              <p className="text-sm">Belum ada produk dipilih</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/30 space-y-3">
                <div className="flex justify-between items-start">
                  <h5 className="font-bold text-slate-900 text-sm">{item.name}</h5>
                  <button onClick={() => setCart(prev => prev.filter(i => i.id !== item.id))}>
                    <Trash2 className="w-4 h-4 text-rose-500" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Harga Beli</label>
                    <input
                      type="number"
                      className="w-full px-2 py-1 text-sm border border-slate-200 rounded-lg"
                      value={item.price_buy}
                      onChange={(e) => updatePrice(item.id, Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Jumlah (Qty)</label>
                    <input
                      type="number"
                      className="w-full px-2 py-1 text-sm border border-slate-200 rounded-lg"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.id, Number(e.target.value))}
                    />
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">Subtotal: <span className="font-bold text-slate-900">{formatCurrency(item.price_buy * item.quantity)}</span></p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50/50">
          <div className="flex justify-between items-center mb-4">
            <span className="text-slate-500 font-medium">Total Pembelian</span>
            <span className="text-2xl font-bold text-indigo-600">{formatCurrency(total)}</span>
          </div>
          <button
            onClick={handlePurchase}
            disabled={cart.length === 0 || !selectedSupplier || isProcessing}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all"
          >
            {isProcessing ? "Menyimpan..." : "Simpan Pembelian"}
          </button>
        </div>
      </div>
    </div>
  );
}
