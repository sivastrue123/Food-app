# Database Setup Guide

This guide will help you set up the complete database schema in Supabase.

## Prerequisites

- Supabase account
- Access to SQL Editor in your Supabase project

## Setup Steps

### Step 1: Access SQL Editor

1. Go to https://supabase.com and login
2. Open your project: `revebtouiqieixclbpma`
3. Navigate to **SQL Editor** in the left sidebar

### Step 2: Run SQL Files in Order

Execute the following SQL files in order. Copy and paste the content of each file into the SQL Editor and click "Run".

#### 1. Users Table (`01_users.sql`)

Creates the users table with:
- Email and username authentication
- Password hash storage
- Role-based access (admin/manager)
- Temporary password flag
- RLS policies for user data access

#### 2. Outlets Table (`02_outlets.sql`)

Creates the outlets table with:
- Outlet name, location, and contact info
- Active/inactive status
- RLS policies (admins full access, managers view assigned outlet)

#### 3. Employees Tables (`03_employees.sql`)

Creates two tables:
- **employees**: User assignments to outlets with salary info
- **employee_history**: Transfer and movement tracking
- RLS policies for employee data access

#### 4. Products & Inventory (`04_products_inventory.sql`)

Creates two tables:
- **products**: Master product catalog with GST
- **outlet_inventory**: Outlet-specific stock levels with expiry dates
- RLS policies for inventory management

#### 5. Orders Tables (`05_orders.sql`)

Creates two tables and one function:
- **orders**: Customer orders with billing details
- **order_items**: Order line items
- **decrease_stock()**: Function to update inventory on order
- RLS policies including kiosk access

#### 6. Support Tables (`06_payments_audit_notifications.sql`)

Creates three tables:
- **payment_records**: Employee salary payment tracking
- **audit_logs**: System-wide audit trail
- **notifications**: User notifications
- RLS policies for each table

### Step 3: Verify Tables

1. Go to **Table Editor** in Supabase
2. Verify all 11 tables are created:
   - users
   - outlets
   - employees
   - employee_history
   - products
   - outlet_inventory
   - orders
   - order_items
   - payment_records
   - audit_logs
   - notifications

3. Check that RLS (Row Level Security) is enabled for all tables

### Step 4: Create Initial Admin User

You need to hash the password first. Run this in your browser console after starting the dev server:

```javascript
import bcrypt from 'bcryptjs'
const hash = await bcrypt.hash('Admin123', 10)
console.log(hash)
```

Then run this SQL with the hashed password:

```sql
INSERT INTO users (email, username, password_hash, role, is_temp_password)
VALUES (
  'admin@hotel.com',
  'admin',
  '$2a$10$...',  -- Replace with actual bcrypt hash
  'admin',
  true
);
```

## Important Notes

### Row Level Security (RLS)

All tables use RLS policies. The frontend needs to set user context when making queries.

### Database Functions

The `decrease_stock()` function automatically updates inventory when orders are placed:

```sql
SELECT decrease_stock('inventory-id-uuid', 5);  -- Decrease by 5 units
```

## Next Steps

After database setup:
1. Start the development server: `npm run dev`
2. Login with admin credentials
3. Create outlets
4. Create manager users
5. Add products to the master catalog
