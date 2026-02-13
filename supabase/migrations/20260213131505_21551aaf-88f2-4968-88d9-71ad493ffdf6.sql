
ALTER TABLE public.customer_compliance_requests
ADD COLUMN shared_mode text,
ADD COLUMN shared_with_customers text[] DEFAULT '{}';
