UPDATE public.msp_customers SET active_modules = v.mods
FROM (VALUES
  ('Bergen Energi AS', ARRAY['core','vendors']),
  ('Fjordtech Solutions', ARRAY['core','assets']),
  ('Vest Helse Klinikk', ARRAY['core']),
  ('NordFinans Rådgivning', ARRAY['core','vendors','trust']),
  ('Stavanger Logistikk', ARRAY['core']),
  ('Digitale Løsninger Nord', ARRAY['core','assets','trust']),
  ('Tromsø Utdanning', ARRAY['core'])
) AS v(name, mods)
WHERE msp_customers.customer_name = v.name
  AND (msp_customers.active_modules IS NULL OR array_length(msp_customers.active_modules, 1) IS NULL);