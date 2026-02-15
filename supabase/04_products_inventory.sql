-- Products Table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  base_price DECIMAL(10,2) NOT NULL,
  gst_percentage INTEGER NOT NULL CHECK (gst_percentage >= 0 AND gst_percentage <= 100),
  has_expiry BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can view active products
CREATE POLICY "Everyone can view active products" ON products
  FOR SELECT USING (status = 'active');

-- Policy: Admins manage products
CREATE POLICY "Admins manage products" ON products
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = current_setting('app.user_id', true)::uuid AND role = 'admin')
  );

-- Outlet Inventory Table
CREATE TABLE IF NOT EXISTS outlet_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outlet_id UUID REFERENCES outlets(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  expiry_date DATE,
  added_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(outlet_id, product_id)
);

-- Enable RLS
ALTER TABLE outlet_inventory ENABLE ROW LEVEL SECURITY;

-- Policy: View inventory for accessible outlets
CREATE POLICY "View inventory for accessible outlets" ON outlet_inventory
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = current_setting('app.user_id', true)::uuid AND role = 'admin')
    OR
    EXISTS (
      SELECT 1 FROM employees e 
      WHERE e.user_id = current_setting('app.user_id', true)::uuid AND e.outlet_id = outlet_inventory.outlet_id
    )
  );

-- Policy: Manage inventory for accessible outlets
CREATE POLICY "Manage inventory for accessible outlets" ON outlet_inventory
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = current_setting('app.user_id', true)::uuid AND role = 'admin')
    OR
    EXISTS (
      SELECT 1 FROM employees e 
      WHERE e.user_id = current_setting('app.user_id', true)::uuid AND e.outlet_id = outlet_inventory.outlet_id
    )
  );
