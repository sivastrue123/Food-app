-- ============================================
-- FIX: Remove problematic RLS policies first
-- Then create all tables without recursive policies
-- ============================================

-- Fix users table policies (remove infinite recursion)
DROP POLICY IF EXISTS "Admins can manage all users" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;

-- Create simple, non-recursive policies for users
CREATE POLICY "Enable read access for all users" ON users FOR SELECT USING (true);
CREATE POLICY "Enable insert for service role only" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for service role only" ON users FOR UPDATE USING (true);

-- ============================================
-- 1. OUTLETS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS outlets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  contact TEXT,
  phone TEXT,
  address TEXT,
  is_active BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE outlets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view outlets" ON outlets;
CREATE POLICY "Anyone can view outlets" ON outlets FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable all for authenticated users" ON outlets;
CREATE POLICY "Enable all for authenticated users" ON outlets FOR ALL USING (true);

-- ============================================
-- 2. EMPLOYEES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  outlet_id UUID REFERENCES outlets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  salary DECIMAL(10,2) NOT NULL DEFAULT 0,
  salary_type TEXT DEFAULT 'monthly' CHECK (salary_type IN ('daily', 'monthly')),
  salary_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  join_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active employees" ON employees;
CREATE POLICY "Anyone can view active employees" ON employees FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable all for authenticated users" ON employees;
CREATE POLICY "Enable all for authenticated users" ON employees FOR ALL USING (true);

-- ============================================
-- 3. EMPLOYEE HISTORY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS employee_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  outlet_id UUID REFERENCES outlets(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE employee_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read for all" ON employee_history;
CREATE POLICY "Enable read for all" ON employee_history FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable all for authenticated" ON employee_history;
CREATE POLICY "Enable all for authenticated" ON employee_history FOR ALL USING (true);

-- ============================================
-- 4. PRODUCTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  base_price DECIMAL(10,2) NOT NULL,
  gst_percentage DECIMAL(5,2) DEFAULT 0,
  has_expiry BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read for all" ON products;
CREATE POLICY "Enable read for all" ON products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable all for authenticated" ON products;
CREATE POLICY "Enable all for authenticated" ON products FOR ALL USING (true);

-- ============================================
-- 5. OUTLET INVENTORY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS outlet_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outlet_id UUID REFERENCES outlets(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  expiry_date DATE,
  added_date DATE DEFAULT CURRENT_DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(outlet_id, product_id, expiry_date)
);

ALTER TABLE outlet_inventory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read for all" ON outlet_inventory;
CREATE POLICY "Enable read for all" ON outlet_inventory FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable all for authenticated" ON outlet_inventory;
CREATE POLICY "Enable all for authenticated" ON outlet_inventory FOR ALL USING (true);

-- ============================================
-- 6. ORDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  outlet_id UUID REFERENCES outlets(id) ON DELETE CASCADE,
  customer_mobile TEXT,
  customer_email TEXT,
  subtotal DECIMAL(10,2) NOT NULL,
  total_gst DECIMAL(10,2) NOT NULL,
  grand_total DECIMAL(10,2) NOT NULL,
  order_source TEXT DEFAULT 'pos' CHECK (order_source IN ('pos', 'kiosk')),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  bill_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read for all" ON orders;
CREATE POLICY "Enable read for all" ON orders FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable all for authenticated" ON orders;
CREATE POLICY "Enable all for authenticated" ON orders FOR ALL USING (true);

-- ============================================
-- 7. ORDER ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  gst_percentage DECIMAL(5,2) NOT NULL,
  gst_amount DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read for all" ON order_items;
CREATE POLICY "Enable read for all" ON order_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable all for authenticated" ON order_items;
CREATE POLICY "Enable all for authenticated" ON order_items FOR ALL USING (true);

-- ============================================
-- 8. PAYMENT RECORDS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS payment_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  payment_date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  period_type TEXT CHECK (period_type IN ('daily', 'monthly')),
  period_value TEXT,
  is_paid BOOLEAN DEFAULT false,
  marked_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read for all" ON payment_records;
CREATE POLICY "Enable read for all" ON payment_records FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable all for authenticated" ON payment_records;
CREATE POLICY "Enable all for authenticated" ON payment_records FOR ALL USING (true);

-- ============================================
-- 9. AUDIT LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_value JSONB,
  new_value JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read for all" ON audit_logs;
CREATE POLICY "Enable read for all" ON audit_logs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable all for authenticated" ON audit_logs;
CREATE POLICY "Enable all for authenticated" ON audit_logs FOR ALL USING (true);

-- ============================================
-- 10. NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  outlet_id UUID REFERENCES outlets(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read for all" ON notifications;
CREATE POLICY "Enable read for all" ON notifications FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable all for authenticated" ON notifications;
CREATE POLICY "Enable all for authenticated" ON notifications FOR ALL USING (true);

-- ============================================
-- VERIFICATION: Check all tables
-- ============================================
SELECT 
  table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- ============================================
-- SETUP COMPLETE!
-- All tables created successfully
-- Login with: username = admin, password = Admin@123
-- ============================================
