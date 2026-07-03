-- Saved addresses for reuse across orders
CREATE TABLE public.addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label text NOT NULL DEFAULT 'Address',
  contact_name text NOT NULL,
  phone text NOT NULL,
  line1 text NOT NULL,
  state text NOT NULL,
  district text NOT NULL,
  mandal text NOT NULL,
  pincode text,
  lat double precision,
  lng double precision,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.addresses TO authenticated;
GRANT ALL ON public.addresses TO service_role;

ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own addresses"
  ON public.addresses FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER set_addresses_updated_at
  BEFORE UPDATE ON public.addresses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- store geo coords on orders for distance-based delivery charge auditing
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_pincode text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS distance_km double precision;