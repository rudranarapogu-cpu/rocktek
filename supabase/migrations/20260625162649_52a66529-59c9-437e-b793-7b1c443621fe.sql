
CREATE OR REPLACE FUNCTION public.gen_public_code(_prefix text)
RETURNS text LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
DECLARE
  code text;
BEGIN
  code := _prefix || '-' || upper(substr(md5(gen_random_uuid()::text), 1, 6));
  RETURN code;
END $$;

REVOKE EXECUTE ON FUNCTION public.gen_public_code(text) FROM anon, authenticated;
