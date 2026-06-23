REVOKE EXECUTE ON FUNCTION public.notify(uuid, text, text, text, text) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.notify_order_change() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_trip_change() FROM anon, authenticated, public;