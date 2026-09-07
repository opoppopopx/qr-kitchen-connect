-- Types
CREATE TYPE public.app_role AS ENUM ('admin','manager','cashier','kitchen','waiter');
CREATE TYPE public.table_status AS ENUM ('available','occupied','reserved');
CREATE TYPE public.order_status AS ENUM ('pending','preparing','ready','served','cancelled');
CREATE TYPE public.payment_method AS ENUM ('cash','qr_code');
CREATE TYPE public.payment_status AS ENUM ('pending','completed');
CREATE TYPE public.reservation_status AS ENUM ('pending', 'confirmed', 'cancelled', 'seated');

-- Profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL UNIQUE,
  full_name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  salary numeric NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION private.is_boss(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','manager'))
$$;

CREATE OR REPLACE FUNCTION private.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id)
$$;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.is_boss(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.is_staff(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_boss(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_staff(uuid) TO anon, authenticated, service_role;

CREATE POLICY "staff read profiles" ON public.profiles FOR SELECT TO authenticated USING (private.is_staff(auth.uid()));
CREATE POLICY "boss manage profiles" ON public.profiles FOR ALL TO authenticated USING (private.is_boss(auth.uid())) WITH CHECK (private.is_boss(auth.uid()));
CREATE POLICY "self update profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "staff read roles" ON public.user_roles FOR SELECT TO authenticated USING (private.is_staff(auth.uid()));

CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Tables
CREATE TABLE public.tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number int NOT NULL UNIQUE,
  zone text NOT NULL DEFAULT 'A',
  seats int NOT NULL DEFAULT 4,
  status public.table_status NOT NULL DEFAULT 'available',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.tables TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tables TO authenticated;
GRANT ALL ON public.tables TO service_role;
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone read tables" ON public.tables FOR SELECT USING (true);
CREATE POLICY "staff manage tables" ON public.tables FOR ALL TO authenticated USING (private.is_staff(auth.uid())) WITH CHECK (private.is_staff(auth.uid()));

-- Categories
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  icon text NOT NULL DEFAULT '🍽️',
  sort_order int NOT NULL DEFAULT 0
);
GRANT SELECT ON public.categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "staff manage categories" ON public.categories FOR ALL TO authenticated USING (private.is_staff(auth.uid())) WITH CHECK (private.is_staff(auth.uid()));

-- Products
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  image text NOT NULL DEFAULT '🍲',
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  available boolean NOT NULL DEFAULT true,
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone read products" ON public.products FOR SELECT USING (true);
CREATE POLICY "staff manage products" ON public.products FOR ALL TO authenticated USING (private.is_staff(auth.uid())) WITH CHECK (private.is_staff(auth.uid()));

-- Customers
CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  points int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.customers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "guests can register as member" ON public.customers FOR INSERT TO anon
  WITH CHECK (points = 0 AND length(name) BETWEEN 1 AND 80 AND length(phone) <= 20 AND length(email) <= 120);
CREATE POLICY "staff manage customers" ON public.customers FOR ALL TO authenticated USING (private.is_staff(auth.uid())) WITH CHECK (private.is_staff(auth.uid()));

-- Orders
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_no serial,
  table_id uuid NOT NULL REFERENCES public.tables(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  status public.order_status NOT NULL DEFAULT 'pending',
  source text NOT NULL DEFAULT 'staff',
  total_amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.orders TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "guests read orders of open tables" ON public.orders FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM public.tables t WHERE t.id = orders.table_id AND t.status = 'occupied'));
CREATE POLICY "customers order only at open tables" ON public.orders FOR INSERT TO anon
  WITH CHECK (EXISTS (SELECT 1 FROM public.tables t WHERE t.id = table_id AND t.status = 'occupied'));
CREATE POLICY "staff manage orders" ON public.orders FOR ALL TO authenticated USING (private.is_staff(auth.uid())) WITH CHECK (private.is_staff(auth.uid()));
CREATE TRIGGER orders_touch BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Order items
CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity int NOT NULL DEFAULT 1 CHECK (quantity > 0),
  price numeric NOT NULL DEFAULT 0,
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.order_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "guests read order items of open tables" ON public.order_items FOR SELECT TO anon
  USING (EXISTS (
    SELECT 1 FROM public.orders o JOIN public.tables t ON t.id = o.table_id
    WHERE o.id = order_items.order_id AND t.status = 'occupied'));
CREATE POLICY "customers add items to open table orders" ON public.order_items FOR INSERT TO anon
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.orders o JOIN public.tables t ON t.id = o.table_id
    WHERE o.id = order_id AND t.status = 'occupied'));
CREATE POLICY "staff manage order items" ON public.order_items FOR ALL TO authenticated USING (private.is_staff(auth.uid())) WITH CHECK (private.is_staff(auth.uid()));

-- Payments
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  amount numeric NOT NULL DEFAULT 0,
  method public.payment_method NOT NULL DEFAULT 'cash',
  status public.payment_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.payments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "guests read payments of open tables" ON public.payments FOR SELECT TO anon
  USING (EXISTS (
    SELECT 1 FROM public.orders o JOIN public.tables t ON t.id = o.table_id
    WHERE o.id = payments.order_id AND t.status = 'occupied'));
CREATE POLICY "customers request payment" ON public.payments FOR INSERT TO anon WITH CHECK (status = 'pending');
CREATE POLICY "staff manage payments" ON public.payments FOR ALL TO authenticated USING (private.is_staff(auth.uid())) WITH CHECK (private.is_staff(auth.uid()));

-- Password change logs
CREATE TABLE public.password_change_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  target_user_id uuid NOT NULL,
  target_username text NOT NULL DEFAULT '',
  changed_by_user_id uuid,
  changed_by_username text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT ON public.password_change_logs TO authenticated;
GRANT ALL ON public.password_change_logs TO service_role;
ALTER TABLE public.password_change_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read password change logs" ON public.password_change_logs FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'));
CREATE INDEX password_change_logs_created_at_idx ON public.password_change_logs (created_at DESC);

-- Restaurant settings & reservations
CREATE TABLE public.restaurant_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  promptpay_id text NOT NULL DEFAULT '',
  account_name text NOT NULL DEFAULT '',
  deposit_amount numeric NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.restaurant_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.restaurant_settings TO authenticated;
GRANT ALL ON public.restaurant_settings TO service_role;
ALTER TABLE public.restaurant_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone read settings" ON public.restaurant_settings FOR SELECT USING (true);
CREATE POLICY "staff manage settings" ON public.restaurant_settings FOR ALL TO authenticated USING (private.is_staff(auth.uid())) WITH CHECK (private.is_staff(auth.uid()));
CREATE TRIGGER restaurant_settings_touch BEFORE UPDATE ON public.restaurant_settings FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.reservations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE DEFAULT upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6)),
  name text NOT NULL,
  phone text NOT NULL DEFAULT '',
  guests integer NOT NULL DEFAULT 2,
  reserved_at timestamptz NOT NULL,
  zone text NOT NULL DEFAULT '',
  table_id uuid REFERENCES public.tables(id) ON DELETE SET NULL,
  note text NOT NULL DEFAULT '',
  food_amount numeric NOT NULL DEFAULT 0,
  deposit_amount numeric NOT NULL DEFAULT 0,
  total_due numeric NOT NULL DEFAULT 0,
  status public.reservation_status NOT NULL DEFAULT 'pending',
  payment_ref text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.reservations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reservations TO authenticated;
GRANT ALL ON public.reservations TO service_role;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "guests create pending reservations" ON public.reservations FOR INSERT TO anon
  WITH CHECK (status = 'pending' AND length(name) BETWEEN 1 AND 80 AND length(phone) <= 20 AND guests BETWEEN 1 AND 50 AND length(note) <= 500);
CREATE POLICY "guests read reservations" ON public.reservations FOR SELECT TO anon USING (true);
CREATE POLICY "staff manage reservations" ON public.reservations FOR ALL TO authenticated USING (private.is_staff(auth.uid())) WITH CHECK (private.is_staff(auth.uid()));
CREATE TRIGGER reservations_touch BEFORE UPDATE ON public.reservations FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.reservation_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reservation_id uuid NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id),
  quantity integer NOT NULL DEFAULT 1,
  price numeric NOT NULL DEFAULT 0,
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.reservation_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reservation_items TO authenticated;
GRANT ALL ON public.reservation_items TO service_role;
ALTER TABLE public.reservation_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "guests add items to pending reservation" ON public.reservation_items FOR INSERT TO anon
  WITH CHECK (EXISTS (SELECT 1 FROM public.reservations r WHERE r.id = reservation_items.reservation_id AND r.status = 'pending'));
CREATE POLICY "guests read reservation items" ON public.reservation_items FOR SELECT TO anon USING (true);
CREATE POLICY "staff manage reservation items" ON public.reservation_items FOR ALL TO authenticated USING (private.is_staff(auth.uid())) WITH CHECK (private.is_staff(auth.uid()));

CREATE INDEX reservations_reserved_at_idx ON public.reservations(reserved_at);
CREATE INDEX reservation_items_reservation_idx ON public.reservation_items(reservation_id);

-- Realtime
ALTER TABLE public.tables REPLICA IDENTITY FULL;
ALTER TABLE public.products REPLICA IDENTITY FULL;
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER TABLE public.order_items REPLICA IDENTITY FULL;
ALTER TABLE public.payments REPLICA IDENTITY FULL;
ALTER TABLE public.reservations REPLICA IDENTITY FULL;
ALTER TABLE public.reservation_items REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tables, public.products, public.orders, public.order_items, public.payments, public.reservations, public.reservation_items;

TRUNCATE public.reservation_items, public.reservations, public.payments, public.order_items, public.orders, public.customers, public.products, public.categories, public.tables, public.restaurant_settings RESTART IDENTITY CASCADE;
