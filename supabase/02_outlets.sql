-- Outlets Table
CREATE TABLE IF NOT EXISTS outlets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  contact TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE outlets ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can do everything
CREATE POLICY "Admins full access to outlets" ON outlets
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = current_setting('app.user_id', true)::uuid AND role = 'admin')
  );

-- Policy: Managers can view their assigned outlet
CREATE POLICY "Managers can view assigned outlets" ON outlets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM employees e 
      JOIN users u ON e.user_id = u.id 
      WHERE u.id = current_setting('app.user_id', true)::uuid 
        AND e.outlet_id = outlets.id 
        AND e.status = 'active'
    )
  );
