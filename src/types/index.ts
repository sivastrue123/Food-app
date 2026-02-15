// Database table interfaces

export interface User {
  id: string
  email: string
  username: string
  password_hash: string
  role: 'admin' | 'manager' | 'staff'
  is_temp_password: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Outlet {
  id: string
  name: string
  location: string
  contact: string
  phone: string | null
  address: string | null
  is_active: boolean
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

export interface Employee {
  id: string
  user_id: string
  outlet_id: string
  name: string
  position: string
  phone: string | null
  email: string | null
  salary: number
  salary_type: 'daily' | 'monthly'
  salary_amount: number
  join_date: string
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

export interface EmployeeHistory {
  id: string
  employee_id: string
  outlet_id: string
  start_date: string
  end_date: string | null
  reason: string | null
  created_at: string
}

export interface Product {
  id: string
  name: string
  category: string
  base_price: number
  gst_percentage: number
  has_expiry: boolean
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

export interface OutletInventory {
  id: string
  outlet_id: string
  product_id: string
  stock_quantity: number
  expiry_date: string | null
  added_date: string
  updated_at: string
}

export interface Order {
  id: string
  order_number: string
  outlet_id: string
  customer_mobile: string | null
  customer_email: string | null
  subtotal: number
  total_gst: number
  grand_total: number
  order_source: 'pos' | 'kiosk'
  created_by: string | null
  bill_sent: boolean
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
  gst_percentage: number
  gst_amount: number
  total_price: number
  created_at: string
}

export interface PaymentRecord {
  id: string
  employee_id: string
  payment_date: string
  amount: number
  period_type: 'daily' | 'monthly'
  period_value: string
  is_paid: boolean
  marked_by: string | null
  created_at: string
  updated_at: string
}

export interface AuditLog {
  id: string
  user_id: string | null
  action: string
  entity_type: string
  entity_id: string | null
  old_value: Record<string, any> | null
  new_value: Record<string, any> | null
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  outlet_id: string
  type: string
  title: string
  message: string
  is_read: boolean
  created_at: string
}

// Form types
export interface LoginFormData {
  identifier: string
  password: string
}

export interface PasswordResetFormData {
  password: string
  confirmPassword: string
}

export interface CreateUserFormData {
  email: string
  username: string
  role: 'admin' | 'manager'
}

export interface CreateOutletFormData {
  name: string
  location: string
  contact: string
}

export interface CreateProductFormData {
  name: string
  category: string
  base_price: number
  gst_percentage: number
  has_expiry: boolean
}

// Cart types
export interface CartItem {
  product_id: string
  inventory_id: string
  name: string
  unit_price: number
  gst_percentage: number
  quantity: number
  gst_amount?: number
  total_price?: number
}

export interface CartTotals {
  items: CartItem[]
  subtotal: number
  totalGST: number
  grandTotal: number
}
