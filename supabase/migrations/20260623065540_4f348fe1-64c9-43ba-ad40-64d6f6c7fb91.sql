-- 1. Driver acceptance on trips
ALTER TABLE public.trips
  ADD COLUMN IF NOT EXISTS acceptance text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS rejected_at timestamptz,
  ADD COLUMN IF NOT EXISTS reject_reason text;

-- 2. Trip events: time + location captured at each step
CREATE TABLE IF NOT EXISTS public.trip_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  status text NOT NULL,
  lat double precision,
  lng double precision,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.trip_events TO authenticated;
GRANT ALL ON public.trip_events TO service_role;
ALTER TABLE public.trip_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view trip events" ON public.trip_events FOR SELECT TO authenticated
  USING (public.can_view_trip(trip_id));
CREATE POLICY "insert trip events" ON public.trip_events FOR INSERT TO authenticated
  WITH CHECK (public.can_view_trip(trip_id));

-- 3. Notifications for every role
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  body text,
  link text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view own notifications" ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "update own notifications" ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trip_events_trip ON public.trip_events(trip_id, created_at);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_events;

-- Helper to insert a notification (bypasses RLS for cross-user notifications)
CREATE OR REPLACE FUNCTION public.notify(_user_id uuid, _type text, _title text, _body text, _link text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF _user_id IS NULL THEN RETURN; END IF;
  INSERT INTO public.notifications (user_id, type, title, body, link)
  VALUES (_user_id, _type, _title, _body, _link);
END $$;

-- Order notifications
CREATE OR REPLACE FUNCTION public.notify_order_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  seller_uid uuid;
  item_title text;
BEGIN
  SELECT user_id INTO seller_uid FROM public.sellers WHERE id = NEW.seller_id;
  SELECT title INTO item_title FROM public.listings WHERE id = NEW.listing_id;

  IF TG_OP = 'INSERT' THEN
    PERFORM public.notify(seller_uid, 'order', 'New order received',
      'Order placed for ' || COALESCE(item_title,'an item') || '.', '/seller/orders');
    PERFORM public.notify(NEW.buyer_id, 'order', 'Order placed',
      'Your order for ' || COALESCE(item_title,'an item') || ' was placed.', '/buyer');
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.status = 'confirmed' THEN
      PERFORM public.notify(NEW.buyer_id, 'order', 'Order confirmed',
        COALESCE(item_title,'Your order') || ' was confirmed by the seller.', '/buyer');
    ELSIF NEW.status = 'dispatched' THEN
      PERFORM public.notify(NEW.buyer_id, 'order', 'Order dispatched',
        COALESCE(item_title,'Your order') || ' is on the way.', '/buyer/tracking');
    ELSIF NEW.status = 'delivered' THEN
      PERFORM public.notify(NEW.buyer_id, 'order', 'Order delivered',
        COALESCE(item_title,'Your order') || ' has been delivered.', '/buyer');
      PERFORM public.notify(seller_uid, 'order', 'Order delivered',
        COALESCE(item_title,'An order') || ' was delivered successfully.', '/seller/orders');
    ELSIF NEW.status = 'cancelled' THEN
      PERFORM public.notify(NEW.buyer_id, 'order', 'Order cancelled',
        COALESCE(item_title,'Your order') || ' was cancelled.', '/buyer');
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_notify_order ON public.orders;
CREATE TRIGGER trg_notify_order AFTER INSERT OR UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.notify_order_change();

-- Trip notifications + step events
CREATE OR REPLACE FUNCTION public.handle_trip_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  seller_uid uuid;
  driver_uid uuid;
  buyer_uid uuid;
  drv_name text;
  item_title text;
BEGIN
  SELECT user_id INTO seller_uid FROM public.sellers WHERE id = NEW.seller_id;
  SELECT user_id, full_name INTO driver_uid, drv_name FROM public.drivers WHERE id = NEW.driver_id;
  SELECT buyer_id INTO buyer_uid FROM public.orders WHERE id = NEW.order_id;
  SELECT l.title INTO item_title FROM public.orders o JOIN public.listings l ON l.id = o.listing_id WHERE o.id = NEW.order_id;

  IF TG_OP = 'INSERT' THEN
    PERFORM public.notify(driver_uid, 'trip', 'New trip assigned',
      'You have been assigned a delivery. Accept or reject it.', '/driver');
    INSERT INTO public.trip_events (trip_id, status, note) VALUES (NEW.id, 'assigned', 'Driver assigned');
    RETURN NEW;
  END IF;

  -- acceptance change
  IF OLD.acceptance IS DISTINCT FROM NEW.acceptance THEN
    IF NEW.acceptance = 'accepted' THEN
      PERFORM public.notify(seller_uid, 'trip', 'Driver accepted',
        COALESCE(drv_name,'The driver') || ' accepted the delivery.', '/seller/orders');
      PERFORM public.notify(buyer_uid, 'trip', 'Driver assigned',
        'A driver has accepted your delivery.', '/buyer/tracking');
    ELSIF NEW.acceptance = 'rejected' THEN
      PERFORM public.notify(seller_uid, 'trip', 'Driver rejected',
        COALESCE(drv_name,'The driver') || ' rejected the delivery. Please reassign.', '/seller/orders');
    END IF;
  END IF;

  -- status step change: record time + location, notify buyer & seller
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.trip_events (trip_id, status, lat, lng)
    VALUES (NEW.id, NEW.status::text, NEW.current_lat, NEW.current_lng);
    PERFORM public.notify(buyer_uid, 'trip', 'Shipment update',
      COALESCE(item_title,'Your shipment') || ' status: ' || replace(NEW.status::text,'_',' ') || '.', '/buyer/tracking');
    PERFORM public.notify(seller_uid, 'trip', 'Shipment update',
      COALESCE(item_title,'A shipment') || ' status: ' || replace(NEW.status::text,'_',' ') || '.', '/seller/orders');
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_handle_trip ON public.trips;
CREATE TRIGGER trg_handle_trip AFTER INSERT OR UPDATE ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.handle_trip_change();