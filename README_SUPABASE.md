# Supabase Integration Guide (Admin + Driver apps centralization)

This document explains how to connect this project to a single centralized Supabase project for all data used by the Admin panel, the main app (customer-facing), and the Driver app. It contains recommended schema SQL, Row-Level Security (RLS) policies, storage setup, realtime patterns, triggers and example client wiring for this repository.

Where to put it
- Save this file in your repo root as `README_SUPABASE.md` (already created).
- Key code hooks you will add to the repo: `src/services/supabaseClient.ts` and `src/services/api.ts` (examples below).

Overview / Goals
- Centralize all data in one Supabase project (single DB) so Admin and Driver apps see the same canonical data.
- Use Supabase Auth (profiles) + RLS to securely allow different roles (admin, customer, driver).
- Use Storage for images (products, flower images) and Realtime / database triggers for notifications and status updates.
- Avoid exposing the `service_role` key in client code — use it only server-side (edge functions / server runtime).

Environment variables (Vite)
- Create a `.env.local` in the project root (not checked into source control).

Example `.env.local` for Vite (client apps):

VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJI....

Server-only (do NOT commit):

SUPABASE_SERVICE_ROLE_KEY=<your service_role key>

Note: client apps use the `VITE_` prefix so Vite will inject them; keep `SUPABASE_SERVICE_ROLE_KEY` only in server environments.

Supabase project setup (quick)
1. Create a Supabase project: https://app.supabase.com
2. Configure a database password and wait for deployment.
3. Get your project URL and anon/service_role keys from Project Settings → API.
4. Create a Storage bucket (e.g., `product-images`) for product/flower images.
5. Paste the SQL below into SQL Editor → Run to create tables & triggers (or use migration tooling).

Recommended schema (SQL)
-- Profiles (link to Supabase Auth user)
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name text,
  email text,
  phone text,
  role text NOT NULL DEFAULT 'customer' -- 'customer' | 'admin' | 'driver'
);

-- Categories
CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  image text
);

-- Products
CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price integer NOT NULL,
  image text,
  badge text,
  created_at timestamptz DEFAULT now()
);

-- Product categories linking
CREATE TABLE product_categories (
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, category_id)
);

-- Bouquet colors
CREATE TABLE bouquet_colors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  hex_code text,
  description text
);

-- Flower types
CREATE TABLE flower_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  image text,
  category text,
  available boolean DEFAULT true
);

-- Orders
CREATE TABLE orders (
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
CREATE TABLE order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id),
  quantity integer NOT NULL,
  price integer NOT NULL
);

-- Deliveries (status history / driver actions)
CREATE TABLE deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  driver_id uuid REFERENCES profiles(id),
  status text DEFAULT 'assigned', -- assigned | in_transit | delivered
  delivered_at timestamptz,
  notes text,
  updated_at timestamptz DEFAULT now()
);

-- Notifications (can be used to display admin alerts)
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
  type text,
  payload jsonb,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

Indexes
CREATE INDEX idx_products_created_at ON products(created_at DESC);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_deliveries_order ON deliveries(order_id);

Trigger: when a delivery is marked delivered -> update order status & insert notification

CREATE OR REPLACE FUNCTION fn_on_delivery_update() RETURNS trigger AS $$
BEGIN
  IF tg_op = 'UPDATE' THEN
    IF NEW.status = 'delivered' AND (OLD.status IS DISTINCT FROM NEW.status) THEN
      UPDATE orders SET status = 'Delivered', driver_id = NEW.driver_id WHERE id = NEW.order_id;
      INSERT INTO notifications (user_id, type, payload) VALUES (NULL, 'order_delivered', jsonb_build_object('order_id', NEW.order_id));
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_delivery_update AFTER UPDATE ON deliveries
  FOR EACH ROW EXECUTE FUNCTION fn_on_delivery_update();

Row Level Security (RLS) — recommended approach
- We'll keep a `profiles` table with `role` to determine permissions.
- Enable RLS on tables and write policies based on `auth.uid` and `profiles.role`.

Examples:

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert profiles (signup)
CREATE POLICY "profiles_insert_auth" ON profiles FOR INSERT
  USING (auth.uid() = id);

-- Allow users to read and update their own profile
CREATE POLICY "profiles_manage_self" ON profiles FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Products: admins can insert/update/delete; everyone can read
CREATE POLICY "products_read" ON products FOR SELECT USING (true);
CREATE POLICY "products_admin" ON products FOR INSERT, UPDATE, DELETE
  USING (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'))
  WITH CHECK (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

-- Orders: customers can insert; customers can read their orders; admin can read all; drivers may update delivery status via deliveries table
CREATE POLICY "orders_insert_customer" ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "orders_select_customer_or_admin" ON orders FOR SELECT
  USING (
    auth.uid() = user_id OR
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- Deliveries: only assigned drivers can update their deliveries; admins can manage all
CREATE POLICY "deliveries_driver_update" ON deliveries FOR UPDATE
  USING (
    (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')) OR
    (driver_id = auth.uid())
  )
  WITH CHECK ( (driver_id = auth.uid()) OR (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')) );

Notes on RLS
- Adjust policies to match your exact auth/role model. You may prefer to assign a custom claim or use a separate table mapping auth.uid to role.
- Test policies thoroughly in the Supabase SQL Editor or Policy Simulator.

Storage
- Create bucket `product-images`. For simplicity, make it public read if you want direct CDN URLs. If private, generate signed URLs when needed.
- Upload via `supabase.storage.from('product-images').upload('products/<id>.jpg', file)`; store the public URL or path in `products.image`.

Realtime and Notifications
- Use `supabase-js` subscriptions to watch tables of interest:
  - Admins subscribe to `orders` (INSERT/UPDATE) and `deliveries` (UPDATE) to update the admin dashboard live.
  - Drivers subscribe to `deliveries` filtered by their driver id.

Example subscription (client-side):

const { data: subscription } = supabase
  .from('orders')
  .on('INSERT', payload => { console.log('New order', payload) })
  .subscribe();

Centralizing Admin + Driver apps
- Use the same Supabase project for the Admin app and Driver app. Configure both apps to use the same `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- Use RLS to ensure drivers only modify deliveries assigned to them, and customers can only read their own orders.
- For admin-only operations (creating products, editing categories), use either:
  - Client-side anon key + RLS (admins authenticated and have role='admin' in `profiles`), OR
  - A small server-side API (or Supabase Edge Function) that uses the `SUPABASE_SERVICE_ROLE_KEY` and exposes admin-only endpoints. This is safer for privileged bulk operations.

Driver flow example
1. Driver logs in (Supabase Auth). `profiles.role` = 'driver'.
2. App queries `deliveries` where `driver_id = auth.uid()` and `status != 'delivered'`.
3. Driver marks `status = 'delivered'` and optionally sets `delivered_at = now()` using the anon key. RLS policy ensures only driver or admin can perform update.
4. The `fn_on_delivery_update` trigger sets `orders.status = 'Delivered'` and inserts a `notifications` row (admin will see it via realtime).

Client wiring (example files to add)
- `src/services/supabaseClient.ts` (shared client used across services)

Example `src/services/supabaseClient.ts`:

```ts
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(url, anonKey, {
  realtime: { params: { eventsPerSecond: 10 } },
});
```

- `src/services/api.ts` (small helper functions)

```ts
import { supabase } from './supabaseClient';

export async function getProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*, product_categories(category_id)');
  if (error) throw error;
  return data;
}

export async function createOrder(orderPayload) {
  // orderPayload should contain: user_id, order_number, total_amount, delivery info, items
  const { data, error } = await supabase.from('orders').insert(orderPayload).select();
  if (error) throw error;
  return data;
}

export function subscribeToOrders(cb) {
  return supabase
    .from('orders')
    .on('*', (payload) => cb(payload))
    .subscribe();
}

export async function markDeliveryDelivered(deliveryId) {
  const { data, error } = await supabase
    .from('deliveries')
    .update({ status: 'delivered', delivered_at: new Date().toISOString() })
    .eq('id', deliveryId)
    .select();
  if (error) throw error;
  return data;
}
```

Integrating into this repository
- Replace the local stubbed exports in `src/data/products.ts` and `src/data/bouquetData.ts` with calls to `getProducts()` and corresponding services. Or better, call `getProducts()` directly from components or via a context provider.
- Add `src/services/supabaseClient.ts` and `src/services/api.ts` to the repo and call them from pages/components.
- Example: in `src/components/HomePage.tsx` use `useEffect` to fetch products from `getProducts()` and set state accordingly.

Security best practices
- Do not put `SUPABASE_SERVICE_ROLE_KEY` in client code or in public repositories.
- Prefer RLS over relying on client keys for authorization.
- Where server-side admin actions are required, expose a small server-side API or Supabase Edge Function that uses `service_role` key.

Testing & local development
- Use seed SQL or Supabase UI to create a handful of test rows: an `admin` profile, a few `products`, `categories`, and `drivers` (profiles with role=driver).
- Start dev server: `npm run dev` and set `.env.local` values.

Migration notes
- Paste the SQL above to Supabase SQL Editor OR use the Supabase CLI for proper migration management.
- Keep migration SQL in a `db/migrations/` folder so it can be reused for deployments.

Example: Assigning admin role after signup
- After a user signs up, insert/upsert into `profiles` with `role = 'customer'` by default.
- To make someone admin, update `profiles` row to role='admin' from Supabase Studio or via service role endpoint.

Edge Function / Server-side suggestions
- Create an Edge Function (Supabase Functions) to perform admin bulk imports or to call third-party services (SMS gateway) using `SUPABASE_SERVICE_ROLE_KEY`.
- Example: a function to send SMS when new order is placed.

Wrap-up / next steps for me (I can implement any of the below)
- Add `src/services/supabaseClient.ts` and `src/services/api.ts` to this repo and wire one page (e.g. `ProductsPage`) to fetch live data.
- Add sample seed SQL file and a migration script.
- Add serverless edge function skeleton for admin-only tasks.

If you want, I can now:
- (A) Add the `supabaseClient` and `api` files into the repo and wire `ProductsPage` to use real data.
- (B) Add the SQL migration files under `db/migrations/` and a small seed script.
- (C) Add an Edge Function skeleton that uses the service role key for admin tasks.

Pick A, B or C (or multiple) and I'll implement the chosen items next and run a build to ensure no errors.