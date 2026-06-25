
-- Unique public codes for drivers and sellers
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS public_code text;
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS public_code text;

CREATE OR REPLACE FUNCTION public.gen_public_code(_prefix text)
RETURNS text LANGUAGE plpgsql AS $$
DECLARE
  code text;
  done boolean := false;
BEGIN
  WHILE NOT done LOOP
    code := _prefix || '-' || upper(substr(md5(gen_random_uuid()::text), 1, 6));
    done := true;
  END LOOP;
  RETURN code;
END $$;

CREATE OR REPLACE FUNCTION public.set_driver_code()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.public_code IS NULL THEN
    LOOP
      NEW.public_code := public.gen_public_code('DRV');
      EXIT WHEN NOT EXISTS (SELECT 1 FROM public.drivers WHERE public_code = NEW.public_code);
    END LOOP;
  END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.set_seller_code()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.public_code IS NULL THEN
    LOOP
      NEW.public_code := public.gen_public_code('SLR');
      EXIT WHEN NOT EXISTS (SELECT 1 FROM public.sellers WHERE public_code = NEW.public_code);
    END LOOP;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_set_driver_code ON public.drivers;
CREATE TRIGGER trg_set_driver_code BEFORE INSERT ON public.drivers
FOR EACH ROW EXECUTE FUNCTION public.set_driver_code();

DROP TRIGGER IF EXISTS trg_set_seller_code ON public.sellers;
CREATE TRIGGER trg_set_seller_code BEFORE INSERT ON public.sellers
FOR EACH ROW EXECUTE FUNCTION public.set_seller_code();

-- backfill existing rows
UPDATE public.drivers SET public_code = public.gen_public_code('DRV') WHERE public_code IS NULL;
UPDATE public.sellers SET public_code = public.gen_public_code('SLR') WHERE public_code IS NULL;

ALTER TABLE public.drivers ADD CONSTRAINT drivers_public_code_key UNIQUE (public_code);
ALTER TABLE public.sellers ADD CONSTRAINT sellers_public_code_key UNIQUE (public_code);

-- expose code in public views
DROP VIEW IF EXISTS public.drivers_public;
CREATE VIEW public.drivers_public WITH (security_invoker=on) AS
  SELECT id, full_name, vehicle_type, state, status, verified_at, public_code
  FROM public.drivers WHERE status = 'approved'::driver_status;

DROP VIEW IF EXISTS public.sellers_public;
CREATE VIEW public.sellers_public WITH (security_invoker=on) AS
  SELECT id, company_name, owner_name, state, verified_at, created_at, public_code
  FROM public.sellers WHERE status = 'approved'::seller_status;

GRANT SELECT ON public.drivers_public TO anon, authenticated;
GRANT SELECT ON public.sellers_public TO anon, authenticated;

-- delivery + own-vehicle fields on orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS buyer_has_vehicle boolean NOT NULL DEFAULT false;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_state text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_district text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_mandal text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_charge numeric NOT NULL DEFAULT 0;
