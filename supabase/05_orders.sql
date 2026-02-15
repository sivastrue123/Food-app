-- Orders Table
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
  created_by UUID REFERENCES users(id),
  bill_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Policy: View orders for accessible outlets
CREATE POLICY "View orders for accessible outlets" ON orders
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = current_setting('app.user_id', true)::uuid AND role = 'admin')
    OR
    EXISTS (
      SELECT 1 FROM employees e 
      WHERE e.user_id = current_setting('app.user_id', true)::uuid AND e.outlet_id = orders.outlet_id
    )
    OR
    order_source = 'kiosk' -- Allow kiosk orders to be viewed
  );

-- Policy: Create orders for accessible outlets
CREATE POLICY "Create orders for accessible outlets" ON orders
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = current_setting('app.user_id', true)::uuid AND role = 'admin')
    OR
    EXISTS (
      SELECT 1 FROM employees e 
      WHERE e.user_id = current_setting('app.user_id', true)::uuid AND e.outlet_id = orders.outlet_id
    )
    OR
    order_source = 'kiosk' -- Allow kiosk orders without auth
  );

-- Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  gst_percentage INTEGER NOT NULL,
  gst_amount DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Policy: View order items with order access
CREATE POLICY "View order items with order access" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders o 
      WHERE o.id = order_items.order_id 
      AND (
        EXISTS (SELECT 1 FROM users WHERE id = current_setting('app.user_id', true)::uuid AND role = 'admin')
        OR EXISTS (
          SELECT 1 FROM employees e 
          WHERE e.user_id = current_setting('app.user_id', true)::uuid AND e.outlet_id = o.outlet_id
        )
        OR o.order_source = 'kiosk'
      )
    )
  );

-- Policy: Create order items with order
CREATE POLICY "Create order items with order" ON order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders o 
      WHERE o.id = order_items.order_id
    )
  );

-- Function to decrease stock
CREATE OR REPLACE FUNCTION decrease_stock(inventory_id UUID, quantity INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE outlet_inventory 
  SET stock_quantity = stock_quantity - quantity,
      updated_at = NOW()
  WHERE id = inventory_id;
END;
$$ LANGUAGE plpgsql;
