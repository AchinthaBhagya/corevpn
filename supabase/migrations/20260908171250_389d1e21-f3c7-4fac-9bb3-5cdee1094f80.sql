DROP POLICY IF EXISTS "Authenticated users view active configs" ON public.configs;
CREATE POLICY "Authenticated users view active configs"
ON public.configs FOR SELECT TO authenticated
USING (
  is_active = true
  AND is_assigned = false
  AND (expire_date IS NULL OR expire_date > now())
  AND (
    requires_premium = false
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_premium = true)
    OR private.has_plan_access(auth.uid())
  )
);