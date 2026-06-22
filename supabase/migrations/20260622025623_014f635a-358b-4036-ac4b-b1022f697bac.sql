
-- ============ SELLERS: remove public PII exposure ============
DROP POLICY IF EXISTS sellers_public_approved ON public.sellers;

-- Safe public view (security definer bypasses base RLS, exposes safe columns only)
CREATE OR REPLACE VIEW public.sellers_public AS
  SELECT id, company_name, owner_name, state, verified_at, created_at
  FROM public.sellers
  WHERE status = 'approved';

GRANT SELECT ON public.sellers_public TO anon, authenticated;

-- ============ DRIVERS: remove broad PII exposure ============
DROP POLICY IF EXISTS "Authenticated can view approved drivers" ON public.drivers;

-- Safe driver list for assignment (no phone / license / vehicle number)
CREATE OR REPLACE VIEW public.drivers_public AS
  SELECT id, full_name, vehicle_type, state, status, verified_at
  FROM public.drivers
  WHERE status = 'approved';

GRANT SELECT ON public.drivers_public TO authenticated;

-- Parties to a trip (the seller or buyer) can see the assigned driver's full record
CREATE POLICY drivers_trip_party ON public.drivers
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.trips t
      LEFT JOIN public.orders o ON o.id = t.order_id
      WHERE t.driver_id = drivers.id
        AND (t.seller_id = public.get_my_seller_id() OR o.buyer_id = auth.uid())
    )
  );
