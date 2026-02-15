-- Payment Records Table
CREATE TABLE IF NOT EXISTS payment_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  payment_date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'monthly')),
  period_value TEXT NOT NULL,
  is_paid BOOLEAN DEFAULT false,
  marked_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;

-- Policy: View payment records
CREATE POLICY "View payment records" ON payment_records
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = current_setting('app.user_id', true)::uuid AND role = 'admin')
    OR
    EXISTS (
      SELECT 1 FROM employees e1 
      JOIN employees e2 ON e1.outlet_id = e2.outlet_id
      WHERE e1.user_id = current_setting('app.user_id', true)::uuid AND e2.id = payment_records.employee_id
    )
  );

-- Policy: Admins and managers can manage payments
CREATE POLICY "Manage payment records" ON payment_records
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = current_setting('app.user_id', true)::uuid AND role IN ('admin', 'manager'))
  );

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_value JSONB,
  new_value JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Admins view all audit logs
CREATE POLICY "Admins view all audit logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = current_setting('app.user_id', true)::uuid AND role = 'admin')
  );

-- Policy: Anyone can insert audit logs
CREATE POLICY "Anyone can insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (true);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  outlet_id UUID REFERENCES outlets(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users view own notifications
CREATE POLICY "Users view own notifications" ON notifications
  FOR SELECT USING (user_id = current_setting('app.user_id', true)::uuid);

-- Policy: Users update own notifications
CREATE POLICY "Users update own notifications" ON notifications
  FOR UPDATE USING (user_id = current_setting('app.user_id', true)::uuid);

-- Policy: Anyone can create notifications
CREATE POLICY "Anyone can create notifications" ON notifications
  FOR INSERT WITH CHECK (true);
