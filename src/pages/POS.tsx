import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard, 
  User,
  CheckCircle2,
  Printer,
  Share2,
  Package,
  ShoppingCart
} from 'lucide-react';
import { Product, Sale } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export default function POS() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<(Product & { quantity: number })[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Tunai');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastSale, setLastSale] = useState<any>(null);

  useEffect(() => {
    fetch('/api/products').then(res => res.json()).then(setProducts);
  }, []);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (product: Product) => {
    if (product.stock <= 0) return;
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQty = Math.max(1, Math.min(item.stock, item.quantity + delta));
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const total = cart.reduce((acc, item) => acc + (item.price_sell * item.quantity), 0);
  const totalProfit = cart.reduce((acc, item) => acc + ((item.price_sell - item.price_buy) * item.quantity), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);
    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart,
          customer_name: customerName || 'Pelanggan Umum',
          payment_method: paymentMethod,
          total_amount: total,
          total_profit: totalProfit
        })
      });
      const data = await res.json();
      setLastSale({ ...data, items: cart, total, customerName, paymentMethod, date: new Date() });
      setCart([]);
      setCustomerName('');
      // Refresh products to update stock
      fetch('/api/products').then(res => res.json()).then(setProducts);
    } catch (error) {
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const generatePDF = (sale: any) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("STRUK PENJUALAN", 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`No. Invoice: ${sale.invoice_no}`, 20, 40);
    doc.text(`Tanggal: ${new Date(sale.date).toLocaleString()}`, 20, 45);
    doc.text(`Pelanggan: ${sale.customerName || 'Pelanggan Umum'}`, 20, 50);
    doc.text(`Pembayaran: ${sale.paymentMethod}`, 20, 55);

    const tableData = sale.items.map((item: any) => [
      item.name,
      item.quantity,
      formatCurrency(item.price_sell),
      formatCurrency(item.price_sell * item.quantity)
    ]);

    (doc as any).autoTable({
      startY: 65,
      head: [['Produk', 'Qty', 'Harga', 'Subtotal']],
      body: tableData,
      foot: [['', '', 'TOTAL', formatCurrency(sale.total)]],
    });

    doc.save(`Invoice-${sale.invoice_no}.pdf`);
  };

  const shareToWA = (sale: any) => {
    const text = `*STRUK PENJUALAN*\n` +
      `No: ${sale.invoice_no}\n` +
      `Tanggal: ${new Date(sale.date).toLocaleString()}\n` +
      `Pelanggan: ${sale.customerName || 'Pelanggan Umum'}\n` +
      `--------------------------\n` +
      sale.items.map((item: any) => `${item.name} x${item.quantity} = ${formatCurrency(item.price_sell * item.quantity)}`).join('\n') +
      `\n--------------------------\n` +
      `*TOTAL: ${formatCurrency(sale.total)}*`;
    
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="h-full flex flex-col lg:flex-row gap-6 overflow-hidden">
      {/* Product Selection */}
      <div className="flex-1 flex flex-col min-w-0 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari produk atau scan barcode..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                disabled={product.stock <= 0}
                className={cn(
                  "flex flex-col text-left p-3 rounded-xl border transition-all group",
                  product.stock <= 0 
                    ? "bg-slate-50 border-slate-100 opacity-60 cursor-not-allowed" 
                    : "bg-white border-slate-200 hover:border-indigo-500 hover:shadow-md active:scale-95"
                )}
              >
                <div className="aspect-square rounded-lg bg-slate-100 mb-3 overflow-hidden">
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-8 h-8 text-slate-300" />
                    </div>
                  )}
                </div>
                <h4 className="font-semibold text-slate-900 text-sm line-clamp-2 mb-1">{product.name}</h4>
                <p className="text-indigo-600 font-bold text-sm">{formatCurrency(product.price_sell)}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                    product.stock < 10 ? "bg-rose-50 text-rose-600" : "bg-slate-100 text-slate-600"
                  )}>
                    Stok: {product.stock}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cart & Checkout */}
      <div className="w-full lg:w-96 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden shrink-0">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-indigo-600" />
            Keranjang Belanja
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2 py-8">
              <ShoppingCart className="w-12 h-12 opacity-20" />
              <p className="text-sm">Keranjang masih kosong</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="flex gap-3">
                <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden shrink-0">
                  {item.image && <img src={item.image} className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="text-sm font-medium text-slate-900 truncate">{item.name}</h5>
                  <p className="text-xs text-slate-500">{formatCurrency(item.price_sell)}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <button 
                      onClick={() => updateQuantity(item.id, -1)}
                      className="p-1 rounded-md hover:bg-slate-100 text-slate-500"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-sm font-semibold w-6 text-center">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, 1)}
                      className="p-1 rounded-md hover:bg-slate-100 text-slate-500"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <div className="flex-1" />
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="p-1 rounded-md hover:bg-rose-50 text-rose-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-slate-200 space-y-4 bg-slate-50/50">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Nama Pelanggan (Opsional)"
                className="flex-1 bg-transparent text-sm focus:outline-none"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-slate-400" />
              <select 
                className="flex-1 bg-transparent text-sm focus:outline-none"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option>Tunai</option>
                <option>Transfer Bank</option>
                <option>QRIS</option>
                <option>Kartu Kredit</option>
              </select>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <span className="text-slate-500 font-medium">Total</span>
              <span className="text-2xl font-bold text-indigo-600">{formatCurrency(total)}</span>
            </div>
            <button
              onClick={handleCheckout}
              disabled={cart.length === 0 || isProcessing}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {isProcessing ? "Memproses..." : "Bayar Sekarang"}
            </button>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {lastSale && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center"
            >
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Transaksi Berhasil!</h2>
              <p className="text-slate-500 mb-8">Invoice #{lastSale.invoice_no} telah dicatat.</p>
              
              <div className="grid grid-cols-2 gap-4 mb-8">
                <button
                  onClick={() => generatePDF(lastSale)}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  <Printer className="w-6 h-6 text-slate-600" />
                  <span className="text-sm font-medium">Cetak PDF</span>
                </button>
                <button
                  onClick={() => shareToWA(lastSale)}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  <Share2 className="w-6 h-6 text-emerald-600" />
                  <span className="text-sm font-medium">Share WA</span>
                </button>
              </div>

              <button
                onClick={() => setLastSale(null)}
                className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
              >
                Tutup
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
