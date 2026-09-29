-- 1. Move role helper functions into a non-exposed schema
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

-- 2. Recreate staff policies against private helpers
DROP POLICY IF EXISTS "staff manage categories" ON public.categories;
CREATE POLICY "staff manage categories" ON public.categories FOR ALL TO authenticated
  USING (private.is_staff(auth.uid())) WITH CHECK (private.is_staff(auth.uid()));

DROP POLICY IF EXISTS "staff manage customers" ON public.customers;
CREATE POLICY "staff manage customers" ON public.customers FOR ALL TO authenticated
  USING (private.is_staff(auth.uid())) WITH CHECK (private.is_staff(auth.uid()));

DROP POLICY IF EXISTS "staff manage products" ON public.products;
CREATE POLICY "staff manage products" ON public.products FOR ALL TO authenticated
  USING (private.is_staff(auth.uid())) WITH CHECK (private.is_staff(auth.uid()));

DROP POLICY IF EXISTS "staff manage tables" ON public.tables;
CREATE POLICY "staff manage tables" ON public.tables FOR ALL TO authenticated
  USING (private.is_staff(auth.uid())) WITH CHECK (private.is_staff(auth.uid()));

DROP POLICY IF EXISTS "staff manage orders" ON public.orders;
CREATE POLICY "staff manage orders" ON public.orders FOR ALL TO authenticated
  USING (private.is_staff(auth.uid())) WITH CHECK (private.is_staff(auth.uid()));

DROP POLICY IF EXISTS "staff manage order items" ON public.order_items;
CREATE POLICY "staff manage order items" ON public.order_items FOR ALL TO authenticated
  USING (private.is_staff(auth.uid())) WITH CHECK (private.is_staff(auth.uid()));

DROP POLICY IF EXISTS "staff manage payments" ON public.payments;
CREATE POLICY "staff manage payments" ON public.payments FOR ALL TO authenticated
  USING (private.is_staff(auth.uid())) WITH CHECK (private.is_staff(auth.uid()));

DROP POLICY IF EXISTS "boss manage profiles" ON public.profiles;
CREATE POLICY "boss manage profiles" ON public.profiles FOR ALL TO authenticated
  USING (private.is_boss(auth.uid())) WITH CHECK (private.is_boss(auth.uid()));

DROP POLICY IF EXISTS "staff read profiles" ON public.profiles;
CREATE POLICY "staff read profiles" ON public.profiles FOR SELECT TO authenticated
  USING (private.is_staff(auth.uid()));

DROP POLICY IF EXISTS "staff read roles" ON public.user_roles;
CREATE POLICY "staff read roles" ON public.user_roles FOR SELECT TO authenticated
  USING (private.is_staff(auth.uid()));

-- 3. Drop the publicly exposed helper functions
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);
DROP FUNCTION IF EXISTS public.is_boss(uuid);
DROP FUNCTION IF EXISTS public.is_staff(uuid);

-- 4. Scope guest reads of orders / items / payments to currently open tables
DROP POLICY IF EXISTS "anyone read orders" ON public.orders;
CREATE POLICY "guests read orders of open tables" ON public.orders FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM public.tables t WHERE t.id = orders.table_id AND t.status = 'occupied'));

DROP POLICY IF EXISTS "anyone read order items" ON public.order_items;
CREATE POLICY "guests read order items of open tables" ON public.order_items FOR SELECT TO anon
  USING (EXISTS (
    SELECT 1 FROM public.orders o JOIN public.tables t ON t.id = o.table_id
    WHERE o.id = order_items.order_id AND t.status = 'occupied'));

DROP POLICY IF EXISTS "anyone read payments" ON public.payments;
CREATE POLICY "guests read payments of open tables" ON public.payments FOR SELECT TO anon
  USING (EXISTS (
    SELECT 1 FROM public.orders o JOIN public.tables t ON t.id = o.table_id
    WHERE o.id = payments.order_id AND t.status = 'occupied'));

-- 5. Public member registration cannot set points or oversized values
DROP POLICY IF EXISTS "anyone can register as member" ON public.customers;
CREATE POLICY "guests can register as member" ON public.customers FOR INSERT TO anon
  WITH CHECK (
    points = 0
    AND length(name) BETWEEN 1 AND 80
    AND length(phone) <= 20
    AND length(email) <= 120
  );