CREATE TYPE public.reservation_status AS ENUM ('pending', 'confirmed', 'cancelled', 'seated');

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

INSERT INTO public.restaurant_settings (promptpay_id, account_name, deposit_amount) VALUES ('', '', 100);

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