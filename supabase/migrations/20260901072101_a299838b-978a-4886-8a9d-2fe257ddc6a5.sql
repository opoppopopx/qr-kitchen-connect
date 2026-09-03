-- ROLES
CREATE TYPE public.app_role AS ENUM ('admin','manager','cashier','kitchen','waiter');
CREATE TYPE public.table_status AS ENUM ('available','occupied','reserved');
CREATE TYPE public.order_status AS ENUM ('pending','preparing','ready','served','cancelled');
CREATE TYPE public.payment_method AS ENUM ('cash','qr_code');
CREATE TYPE public.payment_status AS ENUM ('pending','completed');

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

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id)
$$;

CREATE OR REPLACE FUNCTION public.is_boss(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','manager'))
$$;

CREATE POLICY "staff read profiles" ON public.profiles FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "boss manage profiles" ON public.profiles FOR ALL TO authenticated USING (public.is_boss(auth.uid())) WITH CHECK (public.is_boss(auth.uid()));
CREATE POLICY "self update profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "staff read roles" ON public.user_roles FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- TABLES
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
CREATE POLICY "staff manage tables" ON public.tables FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- CATEGORIES
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
CREATE POLICY "staff manage categories" ON public.categories FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- PRODUCTS
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
CREATE POLICY "staff manage products" ON public.products FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- CUSTOMERS (members)
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
CREATE POLICY "anyone can register as member" ON public.customers FOR INSERT WITH CHECK (true);
CREATE POLICY "staff manage customers" ON public.customers FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- ORDERS
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
CREATE POLICY "anyone read orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "customers order only at open tables" ON public.orders FOR INSERT TO anon
  WITH CHECK (EXISTS (SELECT 1 FROM public.tables t WHERE t.id = table_id AND t.status = 'occupied'));
CREATE POLICY "staff manage orders" ON public.orders FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER orders_touch BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ORDER ITEMS
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
CREATE POLICY "anyone read order items" ON public.order_items FOR SELECT USING (true);
CREATE POLICY "customers add items to open table orders" ON public.order_items FOR INSERT TO anon
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.orders o JOIN public.tables t ON t.id = o.table_id
    WHERE o.id = order_id AND t.status = 'occupied'
  ));
CREATE POLICY "staff manage order items" ON public.order_items FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- PAYMENTS
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
CREATE POLICY "anyone read payments" ON public.payments FOR SELECT USING (true);
CREATE POLICY "customers request payment" ON public.payments FOR INSERT TO anon WITH CHECK (status = 'pending');
CREATE POLICY "staff manage payments" ON public.payments FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- REALTIME
ALTER TABLE public.tables REPLICA IDENTITY FULL;
ALTER TABLE public.products REPLICA IDENTITY FULL;
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER TABLE public.order_items REPLICA IDENTITY FULL;
ALTER TABLE public.payments REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tables, public.products, public.orders, public.order_items, public.payments;

-- SEED
INSERT INTO public.tables (number, zone, seats) VALUES
 (1,'A',2),(2,'A',2),(3,'A',4),(4,'A',4),(5,'B',4),(6,'B',6),
 (7,'B',6),(8,'B',8),(9,'C',4),(10,'C',4),(11,'C',2),(12,'C',8);

INSERT INTO public.categories (name, icon, sort_order) VALUES
 ('อาหารจานเดียว','🍛',1),('กับข้าว','🥘',2),('ของทอด/ทานเล่น','🍗',3),
 ('ส้มตำ/ยำ','🥗',4),('เครื่องดื่ม','🥤',5),('ของหวาน','🍰',6);

INSERT INTO public.products (name, price, image, category_id, available, description)
SELECT v.name, v.price, v.image, c.id, true, v.description
FROM (VALUES
 ('ข้าวผัดกุ้ง',80,'🍛','อาหารจานเดียว','ข้าวผัดกุ้งสด ไข่ดาว'),
 ('ผัดไทยกุ้งสด',90,'🍜','อาหารจานเดียว','ผัดไทยรสเด็ด กุ้งสดตัวโต'),
 ('ข้าวกะเพราหมูสับ',60,'🍚','อาหารจานเดียว','กะเพราหมูสับ ไข่ดาว'),
 ('ข้าวมันไก่',55,'🍗','อาหารจานเดียว','ข้าวมันไก่ต้ม น้ำจิ้มรสเด็ด'),
 ('ต้มยำกุ้ง',150,'🍲','กับข้าว','ต้มยำกุ้งน้ำข้น รสแซ่บ'),
 ('แกงเขียวหวานไก่',120,'🥘','กับข้าว','แกงเขียวหวาน เนื้อไก่นุ่ม'),
 ('ผัดกะเพราทะเล',140,'🦐','กับข้าว','กะเพราทะเลรวม'),
 ('ไก่ทอดหาดใหญ่',100,'🍗','ของทอด/ทานเล่น','ไก่ทอดกรอบ รสชาติดั้งเดิม'),
 ('ปอเปี๊ยะทอด',60,'🥟','ของทอด/ทานเล่น','ปอเปี๊ยะทอดกรอบ'),
 ('ส้มตำไทย',60,'🥗','ส้มตำ/ยำ','ส้มตำไทยรสแซ่บ'),
 ('ยำวุ้นเส้น',80,'🥗','ส้มตำ/ยำ','ยำวุ้นเส้นทะเล'),
 ('น้ำส้มคั้นสด',40,'🍊','เครื่องดื่ม','น้ำส้มคั้นสด 100%'),
 ('ชาไทย',35,'🧋','เครื่องดื่ม','ชาไทยเย็น หวานมัน'),
 ('น้ำเปล่า',15,'💧','เครื่องดื่ม','น้ำดื่ม'),
 ('ข้าวเหนียวมะม่วง',80,'🥭','ของหวาน','ข้าวเหนียวมะม่วง กะทิหอม')
) AS v(name, price, image, cat, description)
JOIN public.categories c ON c.name = v.cat;

INSERT INTO public.customers (name, phone, email, points) VALUES
 ('คุณอนันต์ ศรีสุข','081-111-2222','anan@example.com',120),
 ('คุณมาลี ใจงาม','082-333-4444','malee@example.com',45);