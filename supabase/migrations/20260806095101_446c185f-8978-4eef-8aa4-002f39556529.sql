UPDATE public.msp_customers
SET active_modules = array_remove(active_modules, 'systems')
WHERE 'systems' = ANY(active_modules);