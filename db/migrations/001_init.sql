-- 001_init.sql
-- Consolidated schema, indexes, triggers and RLS policies for the Flower Shop app
-- Paste this into the Supabase SQL editor and run as a single script.

-- 0) Enable extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1) Tables

-- Profiles (linked to auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name text,
  email text,
  phone text,
  role text NOT NULL DEFAULT 'customer' -- 'customer' | 'admin' | 'driver'
);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  image text
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price integer NOT NULL,
  image text,
  badge text,
  created_at timestamptz DEFAULT now()
);

-- Product categories linking
CREATE TABLE IF NOT EXISTS product_categories (
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, category_id)
);

-- Bouquet colors
CREATE TABLE IF NOT EXISTS bouquet_colors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  hex_code text,
  description text
);

-- Flower types
CREATE TABLE IF NOT EXISTS flower_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  image text,
  category text,
  available boolean DEFAULT true
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  order_number text UNIQUE,
  total_amount integer,
  phone text,
  date date DEFAULT CURRENT_DATE,
  status text DEFAULT 'Pending', -- Pending | Confirmed | Preparing | Ready | Delivered
  payment text, -- Cash | Card
  delivery_address text,
  delivery_option text DEFAULT 'delivery', -- delivery | pickup
  driver_id uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

-- Order items
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id),
  quantity integer NOT NULL,
  price integer NOT NULL
);

-- Deliveries
CREATE TABLE IF NOT EXISTS deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  driver_id uuid REFERENCES profiles(id),
  status text DEFAULT 'assigned', -- assigned | in_transit | delivered
  delivered_at timestamptz,
  notes text,
  updated_at timestamptz DEFAULT now()
);

-- Drivers metadata (links to profiles)
CREATE TABLE IF NOT EXISTS drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  vehicle_number text,
  status text DEFAULT 'active', -- active | inactive
  deliveries integer DEFAULT 0,
  rating numeric(3,2) DEFAULT 0.0,
  address text,
  created_at timestamptz DEFAULT now()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
  type text,
  payload jsonb,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 2) Indexes
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_order ON deliveries(order_id);
CREATE INDEX IF NOT EXISTS idx_drivers_profile ON drivers(profile_id);

-- 3) Trigger function: when a delivery is marked delivered -> update order status & insert notification
CREATE OR REPLACE FUNCTION fn_on_delivery_update() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.status = 'delivered' AND (OLD.status IS DISTINCT FROM NEW.status) THEN
      -- update order status and set driver
      UPDATE orders SET status = 'Delivered', driver_id = NEW.driver_id WHERE id = NEW.order_id;
      -- insert a notification for the order's user (if exists)
      INSERT INTO notifications (user_id, type, payload)
        VALUES ((SELECT user_id FROM orders WHERE id = NEW.order_id), 'order_delivered', jsonb_build_object('order_id', NEW.order_id));
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_delivery_update ON deliveries;
CREATE TRIGGER trg_delivery_update AFTER UPDATE ON deliveries
  FOR EACH ROW EXECUTE FUNCTION fn_on_delivery_update();

-- 4) Enable Row Level Security (RLS)
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS drivers ENABLE ROW LEVEL SECURITY;

-- 5) Policies
-- Note: auth.uid() returns text; cast to uuid when comparing with uuid columns

-- Profiles policies
DROP POLICY IF EXISTS profiles_insert_auth ON profiles;
CREATE POLICY profiles_insert_auth ON profiles FOR INSERT
  WITH CHECK (auth.uid()::uuid = id);

DROP POLICY IF EXISTS profiles_manage_self ON profiles;
CREATE POLICY profiles_manage_self ON profiles FOR ALL
  USING (auth.uid()::uuid = id)
  WITH CHECK (auth.uid()::uuid = id);

-- Products policies
DROP POLICY IF EXISTS products_read ON products;
CREATE POLICY products_read ON products FOR SELECT USING (true);

DROP POLICY IF EXISTS products_admin ON products;
CREATE POLICY products_admin ON products FOR ALL
  USING (exists (select 1 from profiles p where p.id = auth.uid()::uuid and p.role = 'admin'))
  WITH CHECK (exists (select 1 from profiles p where p.id = auth.uid()::uuid and p.role = 'admin'));

-- Orders policies
DROP POLICY IF EXISTS orders_insert_customer ON orders;
CREATE POLICY orders_insert_customer ON orders FOR INSERT
  WITH CHECK (auth.uid()::uuid = user_id);

DROP POLICY IF EXISTS orders_select_customer_or_admin ON orders;
CREATE POLICY orders_select_customer_or_admin ON orders FOR SELECT
  USING (
    auth.uid()::uuid = user_id OR
    exists (select 1 from profiles p where p.id = auth.uid()::uuid and p.role = 'admin')
  );

-- Deliveries policies (drivers update their deliveries; admins can manage)
DROP POLICY IF EXISTS deliveries_driver_update ON deliveries;
CREATE POLICY deliveries_driver_update ON deliveries FOR UPDATE
  USING (
    (exists (select 1 from profiles p where p.id = auth.uid()::uuid and p.role = 'admin')) OR
    (driver_id = auth.uid()::uuid)
  )
  WITH CHECK (
    (driver_id = auth.uid()::uuid) OR
    (exists (select 1 from profiles p where p.id = auth.uid()::uuid and p.role = 'admin'))
  );

-- Notifications policies
DROP POLICY IF EXISTS notifications_select ON notifications;
CREATE POLICY notifications_select ON notifications FOR SELECT
  USING (
    user_id = auth.uid()::uuid OR
    exists (select 1 from profiles p where p.id = auth.uid()::uuid and p.role = 'admin')
  );

-- Drivers policies
DROP POLICY IF EXISTS drivers_admin_manage ON drivers;
CREATE POLICY drivers_admin_manage ON drivers FOR ALL
  USING (exists (select 1 from profiles p where p.id = auth.uid()::uuid and p.role = 'admin'))
  WITH CHECK (exists (select 1 from profiles p where p.id = auth.uid()::uuid and p.role = 'admin'));

DROP POLICY IF EXISTS drivers_self_manage ON drivers;
-- Split into two policies: one for SELECT, one for UPDATE (with WITH CHECK)
DROP POLICY IF EXISTS drivers_self_manage_select ON drivers;
CREATE POLICY drivers_self_manage_select ON drivers FOR SELECT
  USING (profile_id = auth.uid()::uuid);

DROP POLICY IF EXISTS drivers_self_manage_update ON drivers;
CREATE POLICY drivers_self_manage_update ON drivers FOR UPDATE
  USING (profile_id = auth.uid()::uuid)
  WITH CHECK (profile_id = auth.uid()::uuid);

-- Allow admins to insert drivers
DROP POLICY IF EXISTS drivers_admin_insert ON drivers;
CREATE POLICY drivers_admin_insert ON drivers FOR INSERT
  WITH CHECK (exists (select 1 from profiles p where p.id = auth.uid()::uuid and p.role = 'admin'));

-- 6) Optional seed data (categories/products) — run only if you want sample rows
-- Uncomment to insert sample rows
--
-- INSERT INTO categories (name, description) VALUES
-- ('Birthday Flowers','Celebrate special moments'),
-- ('Anniversary','Romantic arrangements'),
-- ('Just Because','Surprise someone');
--
-- INSERT INTO products (name, price, badge) VALUES
-- ('Joy Bouquet', 1250, 'Special'),
-- ('Pure Elegance', 1650, 'Bestseller');

-- 7) Advice: to create an admin or driver profile, create the auth user first (via sign up or admin API),
-- then insert/upsert into profiles with id = <auth_user_id> and set role = 'admin' or 'driver'.

-- Example (run after creating an auth user and replacing <USER_UUID>):
-- INSERT INTO profiles (id, full_name, email, phone, role)
-- VALUES ('<USER_UUID>', 'Test Admin', 'admin@example.com', '09123456789', 'admin')
-- ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, role = EXCLUDED.role;

-- Example driver metadata insert (server-side/admin):
-- INSERT INTO drivers (profile_id, vehicle_number, address, status)
-- VALUES ('<USER_UUID>', 'ABC-1234', 'Makati City', 'active');

-- End of migration script
