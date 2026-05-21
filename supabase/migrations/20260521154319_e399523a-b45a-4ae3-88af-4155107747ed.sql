
-- 1. Tighten access_logs INSERT: user_email must match the user's real email (or be null)
ALTER POLICY "Users insert own logs" ON public.access_logs
  WITH CHECK (
    auth.uid() = user_id
    AND (
      user_email IS NULL
      OR user_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
    )
  );

-- 2. Allow users to view their own access logs
CREATE POLICY "Users view own logs"
  ON public.access_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 3. Prevent users from self-granting premium / changing email via profile UPDATE
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND is_premium = (SELECT is_premium FROM public.profiles WHERE id = auth.uid())
    AND email = (SELECT email FROM public.profiles WHERE id = auth.uid())
  );

-- 4. Hide premium configs from non-premium users
DROP POLICY IF EXISTS "Authenticated users view active configs" ON public.configs;
CREATE POLICY "Authenticated users view active configs"
  ON public.configs
  FOR SELECT
  TO authenticated
  USING (
    is_active = true
    AND (expire_date IS NULL OR expire_date > now())
    AND (
      requires_premium = false
      OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND is_premium = true
      )
    )
  );
