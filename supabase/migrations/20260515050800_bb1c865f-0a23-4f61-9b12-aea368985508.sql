
-- Roles enum
CREATE TYPE public.app_role AS ENUM ('buyer', 'seller', 'admin');
CREATE TYPE public.seller_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.listing_status AS ENUM ('active', 'sold', 'expired');
CREATE TYPE public.unit_type AS ENUM ('sqft', 'tons');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User roles (separate table to prevent privilege escalation)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Security definer fn for role checks (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Sellers
CREATE TABLE public.sellers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  gst_number TEXT NOT NULL,
  gst_address TEXT NOT NULL,
  state TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  status public.seller_status NOT NULL DEFAULT 'pending',
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Categories
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Listings
CREATE TABLE public.listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id),
  title TEXT NOT NULL,
  description TEXT,
  quantity NUMERIC NOT NULL,
  unit_type public.unit_type NOT NULL DEFAULT 'sqft',
  price NUMERIC NOT NULL,
  state TEXT NOT NULL,
  district TEXT,
  shading_quality TEXT,
  finish_type TEXT,
  dimensions TEXT,
  stock_available NUMERIC NOT NULL,
  status public.listing_status NOT NULL DEFAULT 'active',
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_listings_status ON public.listings(status);
CREATE INDEX idx_listings_category ON public.listings(category_id);
CREATE INDEX idx_listings_seller ON public.listings(seller_id);

-- Listing images / videos
CREATE TABLE public.listing_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.listing_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seller documents
CREATE TABLE public.seller_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_sellers_updated BEFORE UPDATE ON public.sellers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_listings_updated BEFORE UPDATE ON public.listings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile + buyer role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'phone');
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'buyer');
  RETURN NEW;
END $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_documents ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "profile_self_select" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profile_self_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profile_admin_all" ON public.profiles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- user_roles policies
CREATE POLICY "roles_self_select" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "roles_admin_all" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Sellers: public can view approved sellers; sellers manage their own; admins all
CREATE POLICY "sellers_public_approved" ON public.sellers FOR SELECT USING (status = 'approved');
CREATE POLICY "sellers_self_select" ON public.sellers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "sellers_self_insert" ON public.sellers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "sellers_self_update" ON public.sellers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "sellers_admin_all" ON public.sellers FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Categories: public read, admin write
CREATE POLICY "categories_public_select" ON public.categories FOR SELECT USING (true);
CREATE POLICY "categories_admin_all" ON public.categories FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Listings: public sees only active; sellers manage their own; admins all
CREATE POLICY "listings_public_active" ON public.listings FOR SELECT USING (status = 'active' AND expires_at > now());
CREATE POLICY "listings_seller_select" ON public.listings FOR SELECT USING (
  seller_id IN (SELECT id FROM public.sellers WHERE user_id = auth.uid())
);
CREATE POLICY "listings_seller_insert" ON public.listings FOR INSERT WITH CHECK (
  seller_id IN (SELECT id FROM public.sellers WHERE user_id = auth.uid() AND status = 'approved')
);
CREATE POLICY "listings_seller_update" ON public.listings FOR UPDATE USING (
  seller_id IN (SELECT id FROM public.sellers WHERE user_id = auth.uid())
);
CREATE POLICY "listings_seller_delete" ON public.listings FOR DELETE USING (
  seller_id IN (SELECT id FROM public.sellers WHERE user_id = auth.uid())
);
CREATE POLICY "listings_admin_all" ON public.listings FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Listing images: public can view if listing public; seller manages own
CREATE POLICY "images_public_select" ON public.listing_images FOR SELECT USING (
  listing_id IN (SELECT id FROM public.listings WHERE status = 'active' AND expires_at > now())
);
CREATE POLICY "images_seller_all" ON public.listing_images FOR ALL USING (
  listing_id IN (SELECT l.id FROM public.listings l JOIN public.sellers s ON s.id = l.seller_id WHERE s.user_id = auth.uid())
);

CREATE POLICY "videos_public_select" ON public.listing_videos FOR SELECT USING (
  listing_id IN (SELECT id FROM public.listings WHERE status = 'active' AND expires_at > now())
);
CREATE POLICY "videos_seller_all" ON public.listing_videos FOR ALL USING (
  listing_id IN (SELECT l.id FROM public.listings l JOIN public.sellers s ON s.id = l.seller_id WHERE s.user_id = auth.uid())
);

-- Seller documents: only seller + admin
CREATE POLICY "docs_seller_all" ON public.seller_documents FOR ALL USING (
  seller_id IN (SELECT id FROM public.sellers WHERE user_id = auth.uid())
);
CREATE POLICY "docs_admin_all" ON public.seller_documents FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES
  ('listing-media', 'listing-media', true),
  ('seller-documents', 'seller-documents', false),
  ('category-images', 'category-images', true);

-- Listing media: public read, seller upload to own folder
CREATE POLICY "listing_media_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'listing-media');
CREATE POLICY "listing_media_seller_upload" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'listing-media' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "listing_media_seller_update" ON storage.objects FOR UPDATE USING (
  bucket_id = 'listing-media' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "listing_media_seller_delete" ON storage.objects FOR DELETE USING (
  bucket_id = 'listing-media' AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Seller docs: private, only owner + admin
CREATE POLICY "seller_docs_owner_read" ON storage.objects FOR SELECT USING (
  bucket_id = 'seller-documents' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "seller_docs_owner_upload" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'seller-documents' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "seller_docs_admin_read" ON storage.objects FOR SELECT USING (
  bucket_id = 'seller-documents' AND public.has_role(auth.uid(), 'admin')
);

-- Category images: public read
CREATE POLICY "category_images_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'category-images');

-- Seed categories
INSERT INTO public.categories (name, slug, description) VALUES
  ('Black Granite', 'black-granite', 'Premium black granite blocks and slabs'),
  ('White Granite', 'white-granite', 'Elegant white granite varieties'),
  ('Marble', 'marble', 'Italian and Indian marble selection'),
  ('Quartz', 'quartz', 'Engineered quartz surfaces'),
  ('Natural Stone', 'natural-stone', 'Sandstone, slate, limestone and more');
