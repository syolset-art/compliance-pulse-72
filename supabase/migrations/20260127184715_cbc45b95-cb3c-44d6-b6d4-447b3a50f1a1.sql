-- Add domain column to company_profile for storing network domain (e.g., hult-it.no)
ALTER TABLE public.company_profile 
ADD COLUMN domain TEXT;