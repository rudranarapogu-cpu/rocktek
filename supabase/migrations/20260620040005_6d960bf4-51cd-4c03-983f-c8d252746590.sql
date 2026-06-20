
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'driver';

DO $$ BEGIN CREATE TYPE public.driver_status AS ENUM ('pending','approved','rejected'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE public.order_status AS ENUM ('pending','confirmed','dispatched','in_transit','delivered','cancelled'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE public.payment_status AS ENUM ('unpaid','advance_paid','paid'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE public.trip_status AS ENUM ('assigned','loading','picked_up','in_transit','near_destination','delivered'); EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE OR REPLACE FUNCTION public.get_my_seller_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.sellers WHERE user_id = auth.uid() LIMIT 1
$$;

-- drivers table
CREATE TABLE public.drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text NOT NULL,
  license_number text NOT NULL,
  vehicle_number text NOT NULL,
  vehicle_type text,
  state text,
  status public.driver_status NOT NULL DEFAULT 'pending',
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.drivers TO authenticated;
GRANT ALL ON public.drivers TO service_role;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Drivers manage own row" ON public.drivers FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins manage drivers" ON public.drivers FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Authenticated can view approved drivers" ON public.drivers FOR SELECT TO authenticated USING (status = 'approved');
CREATE TRIGGER drivers_updated_at BEFORE UPDATE ON public.drivers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.get_my_driver_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.drivers WHERE user_id = auth.uid() LIMIT 1
$$;

-- orders table
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE RESTRICT,
  buyer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES public.sellers(id) ON DELETE RESTRICT,
  quantity numeric NOT NULL CHECK (quantity > 0),
  unit_price numeric NOT NULL,
  total_amount numeric NOT NULL,
  advance_amount numeric NOT NULL,
  status public.order_status NOT NULL DEFAULT 'pending',
  payment_status public.payment_status NOT NULL DEFAULT 'unpaid',
  buyer_name text,
  buyer_phone text,
  delivery_address text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Buyers manage own orders" ON public.orders FOR ALL TO authenticated USING (buyer_id = auth.uid()) WITH CHECK (buyer_id = auth.uid());
CREATE POLICY "Sellers view their orders" ON public.orders FOR SELECT TO authenticated USING (seller_id = public.get_my_seller_id());
CREATE POLICY "Sellers update their orders" ON public.orders FOR UPDATE TO authenticated USING (seller_id = public.get_my_seller_id()) WITH CHECK (seller_id = public.get_my_seller_id());
CREATE POLICY "Admins manage orders" ON public.orders FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- trips table
CREATE TABLE public.trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  driver_id uuid NOT NULL REFERENCES public.drivers(id) ON DELETE RESTRICT,
  seller_id uuid NOT NULL REFERENCES public.sellers(id) ON DELETE RESTRICT,
  status public.trip_status NOT NULL DEFAULT 'assigned',
  current_lat double precision,
  current_lng double precision,
  started_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trips TO authenticated;
GRANT ALL ON public.trips TO service_role;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Drivers manage own trips" ON public.trips FOR ALL TO authenticated USING (driver_id = public.get_my_driver_id()) WITH CHECK (driver_id = public.get_my_driver_id());
CREATE POLICY "Sellers manage own trips" ON public.trips FOR ALL TO authenticated USING (seller_id = public.get_my_seller_id()) WITH CHECK (seller_id = public.get_my_seller_id());
CREATE POLICY "Buyers view their trips" ON public.trips FOR SELECT TO authenticated USING (order_id IN (SELECT id FROM public.orders WHERE buyer_id = auth.uid()));
CREATE POLICY "Admins manage trips" ON public.trips FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trips_updated_at BEFORE UPDATE ON public.trips FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.can_view_trip(_trip_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.trips t
    LEFT JOIN public.orders o ON o.id = t.order_id
    WHERE t.id = _trip_id AND (
      t.driver_id = public.get_my_driver_id()
      OR t.seller_id = public.get_my_seller_id()
      OR o.buyer_id = auth.uid()
      OR public.has_role(auth.uid(),'admin')
    )
  )
$$;

-- trip_locations
CREATE TABLE public.trip_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  recorded_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.trip_locations TO authenticated;
GRANT ALL ON public.trip_locations TO service_role;
ALTER TABLE public.trip_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Drivers insert locations for own trips" ON public.trip_locations FOR INSERT TO authenticated WITH CHECK (trip_id IN (SELECT id FROM public.trips WHERE driver_id = public.get_my_driver_id()));
CREATE POLICY "Trip parties view locations" ON public.trip_locations FOR SELECT TO authenticated USING (public.can_view_trip(trip_id));

-- delivery_proofs
CREATE TABLE public.delivery_proofs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  image_url text,
  doc_url text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.delivery_proofs TO authenticated;
GRANT ALL ON public.delivery_proofs TO service_role;
ALTER TABLE public.delivery_proofs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Drivers add proof for own trips" ON public.delivery_proofs FOR INSERT TO authenticated WITH CHECK (trip_id IN (SELECT id FROM public.trips WHERE driver_id = public.get_my_driver_id()));
CREATE POLICY "Trip parties view proof" ON public.delivery_proofs FOR SELECT TO authenticated USING (public.can_view_trip(trip_id));
CREATE POLICY "Admins manage proof" ON public.delivery_proofs FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Stock reduction logic
CREATE OR REPLACE FUNCTION public.reduce_stock_on_order()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'confirmed' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'confirmed') THEN
    UPDATE public.listings
      SET stock_available = GREATEST(stock_available - NEW.quantity, 0),
          status = CASE WHEN GREATEST(stock_available - NEW.quantity, 0) = 0 THEN 'sold'::listing_status ELSE status END
      WHERE id = NEW.listing_id;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER orders_reduce_stock AFTER INSERT OR UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.reduce_stock_on_order();

-- Realtime
ALTER TABLE public.trips REPLICA IDENTITY FULL;
ALTER TABLE public.trip_locations REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trips;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_locations;
