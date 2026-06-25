
CREATE POLICY "Buyers manage trips for own orders" ON public.trips
FOR ALL TO authenticated
USING (order_id IN (SELECT id FROM public.orders WHERE buyer_id = auth.uid()))
WITH CHECK (order_id IN (SELECT id FROM public.orders WHERE buyer_id = auth.uid()));
