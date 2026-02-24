-- Yasal linkler: Ödeme sayfasında kullanılacak URL'ler (Admin > Ayarlar'dan düzenlenir).
-- Supabase SQL Editor'da çalıştırın. settings tablosu zaten varsa sadece bu sütunları ekler.

ALTER TABLE public.settings
  ADD COLUMN IF NOT EXISTS link_privacy_policy text,
  ADD COLUMN IF NOT EXISTS link_distance_selling text,
  ADD COLUMN IF NOT EXISTS link_delivery_return text,
  ADD COLUMN IF NOT EXISTS link_terms_conditions text;
