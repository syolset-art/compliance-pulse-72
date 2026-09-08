GRANT SELECT ON public.process_agent_recommendations TO anon;
CREATE POLICY "Anyone can read agent recommendations (demo)" ON public.process_agent_recommendations FOR SELECT TO anon USING (true);