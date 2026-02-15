-- Employees Table
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  outlet_id UUID REFERENCES outlets(id) ON DELETE CASCADE,
  salary_type TEXT NOT NULL CHECK (salary_type IN ('daily', 'monthly')),
  salary_amount DECIMAL(10,2) NOT NULL,
  join_date DATE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, outlet_id)
);

-- Enable RLS
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Policy: Admins manage all employees
CREATE POLICY "Admins manage all employees" ON employees
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = current_setting('app.user_id', true)::uuid AND role = 'admin')
  );

-- Policy: Managers view outlet employees
CREATE POLICY "Managers view outlet employees" ON employees
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM employees e 
      JOIN users u ON e.user_id = u.id 
      WHERE u.id = current_setting('app.user_id', true)::uuid AND e.outlet_id = employees.outlet_id
    )
  );

-- Employee History Table
CREATE TABLE IF NOT EXISTS employee_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  outlet_id UUID REFERENCES outlets(id),
  start_date DATE NOT NULL,
  end_date DATE,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE employee_history ENABLE ROW LEVEL SECURITY;

-- Policy: Admin and managers view history
CREATE POLICY "Admin and managers view history" ON employee_history
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = current_setting('app.user_id', true)::uuid AND role IN ('admin', 'manager'))
  );
