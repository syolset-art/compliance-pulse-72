ALTER TABLE public.vendor_deliveries
  ADD COLUMN sla_uptime text,
  ADD COLUMN sla_response_time text,
  ADD COLUMN sla_support_hours text,
  ADD COLUMN sla_notes text;