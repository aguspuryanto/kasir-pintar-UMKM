export interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  price_buy: number;
  price_sell: number;
  stock: number;
  image?: string;
  created_at: string;
}

export interface Supplier {
  id: number;
  name: string;
  phone: string;
  address: string;
  created_at: string;
}

export interface Sale {
  id: number;
  invoice_no: string;
  total_amount: number;
  total_profit: number;
  customer_name: string;
  payment_method: string;
  created_at: string;
  items?: SaleItem[];
}

export interface SaleItem {
  id: number;
  sale_id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  price: number;
  cost: number;
}

export interface Purchase {
  id: number;
  invoice_no: string;
  supplier_id: number;
  supplier_name?: string;
  total_amount: number;
  created_at: string;
  items?: PurchaseItem[];
}

export interface PurchaseItem {
  id: number;
  purchase_id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  price: number;
}
