UPDATE public.msp_customers
SET active_modules = array_remove(array_remove(active_modules, 'deviations'), 'ropa')
WHERE 'deviations' = ANY(active_modules) OR 'ropa' = ANY(active_modules);