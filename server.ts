import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import cookieSession from "cookie-session";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";

dotenv.config();

const db = new Database("pos.db");

// Initialize Database Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT,
    name TEXT,
    role TEXT DEFAULT 'admin',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    sku TEXT UNIQUE,
    category TEXT,
    price_buy REAL DEFAULT 0,
    price_sell REAL DEFAULT 0,
    stock INTEGER DEFAULT 0,
    image TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_no TEXT UNIQUE,
    total_amount REAL,
    total_profit REAL,
    customer_name TEXT,
    payment_method TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sale_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id INTEGER,
    product_id INTEGER,
    quantity INTEGER,
    price REAL,
    cost REAL,
    FOREIGN KEY(sale_id) REFERENCES sales(id),
    FOREIGN KEY(product_id) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS purchases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_no TEXT UNIQUE,
    supplier_id INTEGER,
    total_amount REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(supplier_id) REFERENCES suppliers(id)
  );

  CREATE TABLE IF NOT EXISTS purchase_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    purchase_id INTEGER,
    product_id INTEGER,
    quantity INTEGER,
    price REAL,
    FOREIGN KEY(purchase_id) REFERENCES purchases(id),
    FOREIGN KEY(product_id) REFERENCES products(id)
  );
`);

// Sample Data Initialization
const productCount = db.prepare("SELECT COUNT(*) as count FROM products").get() as { count: number };
if (productCount.count === 0) {
  db.prepare("INSERT INTO suppliers (name, phone, address) VALUES (?, ?, ?)").run("Supplier Utama", "08123456789", "Jl. Industri No. 1");
  
  const products = [
    ["Paracetamol 500mg", "PC-001", "Obat", 5000, 7500, 100],
    ["Amoxicillin", "AM-002", "Obat", 12000, 18000, 50],
    ["Kopi Hitam 1kg", "KP-001", "Minuman", 45000, 65000, 20],
    ["Gula Pasir 1kg", "GL-001", "Sembako", 12000, 15000, 80]
  ];
  
  for (const p of products) {
    db.prepare("INSERT INTO products (name, sku, category, price_buy, price_sell, stock) VALUES (?, ?, ?, ?, ?, ?)").run(...p);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  app.use(cookieSession({
    name: 'session',
    keys: [process.env.SESSION_SECRET || 'default-secret'],
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    secure: true,
    sameSite: 'none'
  }));

  // Auth Routes
  app.post("/api/auth/register", async (req, res) => {
    const { email, password, name } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({ error: "Semua field harus diisi" });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const info = db.prepare(
        "INSERT INTO users (email, password, name) VALUES (?, ?, ?)"
      ).run(email, hashedPassword, name);
      
      req.session!.userId = info.lastInsertRowid;
      res.json({ id: info.lastInsertRowid, email, name });
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return res.status(400).json({ error: "Email sudah terdaftar" });
      }
      res.status(500).json({ error: "Terjadi kesalahan server" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    
    try {
      const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
      
      if (!user || !await bcrypt.compare(password, user.password)) {
        return res.status(401).json({ error: "Email atau password salah" });
      }

      req.session!.userId = user.id;
      res.json({ id: user.id, email: user.email, name: user.name });
    } catch (error) {
      res.status(500).json({ error: "Terjadi kesalahan server" });
    }
  });

  app.get("/api/auth/me", (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const user = db.prepare("SELECT id, email, name, role FROM users WHERE id = ?").get(req.session.userId);
    if (!user) {
      req.session = null;
      return res.status(401).json({ error: "User not found" });
    }
    res.json(user);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session = null;
    res.json({ success: true });
  });

  // API Routes
  
  // Products
  app.get("/api/products", (req, res) => {
    const products = db.prepare("SELECT * FROM products ORDER BY name ASC").all();
    res.json(products);
  });

  app.post("/api/products", (req, res) => {
    const { name, sku, category, price_buy, price_sell, stock, image } = req.body;
    const info = db.prepare(
      "INSERT INTO products (name, sku, category, price_buy, price_sell, stock, image) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).run(name, sku, category, price_buy, price_sell, stock, image);
    res.json({ id: info.lastInsertRowid });
  });

  app.put("/api/products/:id", (req, res) => {
    const { name, sku, category, price_buy, price_sell, stock, image } = req.body;
    db.prepare(
      "UPDATE products SET name = ?, sku = ?, category = ?, price_buy = ?, price_sell = ?, stock = ?, image = ? WHERE id = ?"
    ).run(name, sku, category, price_buy, price_sell, stock, image, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/products/:id", (req, res) => {
    db.prepare("DELETE FROM products WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Suppliers
  app.get("/api/suppliers", (req, res) => {
    const suppliers = db.prepare("SELECT * FROM suppliers ORDER BY name ASC").all();
    res.json(suppliers);
  });

  app.post("/api/suppliers", (req, res) => {
    const { name, phone, address } = req.body;
    const info = db.prepare(
      "INSERT INTO suppliers (name, phone, address) VALUES (?, ?, ?)"
    ).run(name, phone, address);
    res.json({ id: info.lastInsertRowid });
  });

  // Sales
  app.post("/api/sales", (req, res) => {
    const { items, customer_name, payment_method, total_amount, total_profit } = req.body;
    const invoice_no = `INV-${Date.now()}`;
    
    const transaction = db.transaction(() => {
      const saleInfo = db.prepare(
        "INSERT INTO sales (invoice_no, total_amount, total_profit, customer_name, payment_method) VALUES (?, ?, ?, ?, ?)"
      ).run(invoice_no, total_amount, total_profit, customer_name, payment_method);
      
      const saleId = saleInfo.lastInsertRowid;
      
      for (const item of items) {
        db.prepare(
          "INSERT INTO sale_items (sale_id, product_id, quantity, price, cost) VALUES (?, ?, ?, ?, ?)"
        ).run(saleId, item.id, item.quantity, item.price_sell, item.price_buy);
        
        db.prepare(
          "UPDATE products SET stock = stock - ? WHERE id = ?"
        ).run(item.quantity, item.id);
      }
      
      return { id: saleId, invoice_no };
    });
    
    const result = transaction();
    res.json(result);
  });

  app.get("/api/sales", (req, res) => {
    const sales = db.prepare("SELECT * FROM sales ORDER BY created_at DESC").all();
    res.json(sales);
  });

  app.get("/api/sales/:id", (req, res) => {
    const sale = db.prepare("SELECT * FROM sales WHERE id = ?").get(req.params.id);
    const items = db.prepare(`
      SELECT si.*, p.name as product_name 
      FROM sale_items si 
      JOIN products p ON si.product_id = p.id 
      WHERE si.sale_id = ?
    `).all(req.params.id);
    res.json({ ...sale, items });
  });

  // Purchases
  app.post("/api/purchases", (req, res) => {
    const { items, supplier_id, total_amount } = req.body;
    const invoice_no = `PUR-${Date.now()}`;
    
    const transaction = db.transaction(() => {
      const purchaseInfo = db.prepare(
        "INSERT INTO purchases (invoice_no, supplier_id, total_amount) VALUES (?, ?, ?)"
      ).run(invoice_no, supplier_id, total_amount);
      
      const purchaseId = purchaseInfo.lastInsertRowid;
      
      for (const item of items) {
        db.prepare(
          "INSERT INTO purchase_items (purchase_id, product_id, quantity, price) VALUES (?, ?, ?, ?)"
        ).run(purchaseId, item.id, item.quantity, item.price_buy);
        
        db.prepare(
          "UPDATE products SET stock = stock + ?, price_buy = ? WHERE id = ?"
        ).run(item.quantity, item.price_buy, item.id);
      }
      
      return { id: purchaseId, invoice_no };
    });
    
    const result = transaction();
    res.json(result);
  });

  app.get("/api/purchases", (req, res) => {
    const purchases = db.prepare(`
      SELECT p.*, s.name as supplier_name 
      FROM purchases p 
      LEFT JOIN suppliers s ON p.supplier_id = s.id 
      ORDER BY p.created_at DESC
    `).all();
    res.json(purchases);
  });

  // Reports
  app.get("/api/reports/profit-loss", (req, res) => {
    const { start, end } = req.query;
    const data = db.prepare(`
      SELECT 
        SUM(total_amount) as total_sales,
        SUM(total_profit) as total_profit
      FROM sales 
      WHERE created_at BETWEEN ? AND ?
    `).get(start, end);
    res.json(data);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
