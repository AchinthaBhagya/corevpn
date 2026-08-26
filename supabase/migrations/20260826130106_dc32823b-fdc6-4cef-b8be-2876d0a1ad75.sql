-- 1. profile contact fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS whatsapp text;

-- 2. config pool
ALTER TABLE public.configs
  ADD COLUMN IF NOT EXISTS is_assigned boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assigned_at timestamptz;

CREATE INDEX IF NOT EXISTS configs_pool_idx ON public.configs (isp, is_assigned, is_active);

-- customers can read their own assigned config only while their plan is active
CREATE POLICY "Users view own assigned config"
  ON public.configs FOR SELECT TO authenticated
  USING (assigned_to = auth.uid() AND private.has_plan_access(auth.uid()));

-- 3. order details
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS isp text,
  ADD COLUMN IF NOT EXISTS sim_package text,
  ADD COLUMN IF NOT EXISTS config_id uuid REFERENCES public.configs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS customer_name text,
  ADD COLUMN IF NOT EXISTS customer_whatsapp text;

-- 4. payments
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slip_path text,
  note text,
  status text NOT NULL DEFAULT 'pending',
  verified_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own payments"
  ON public.payments FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users submit own payments"
  ON public.payments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND status = 'pending' AND verified_by IS NULL AND verified_at IS NULL);

CREATE POLICY "Admins view all payments"
  ON public.payments FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage payments"
  ON public.payments FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete payments"
  ON public.payments FOR DELETE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER payments_set_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5. activation: reserve a config from the ISP pool and create the pending order
CREATE OR REPLACE FUNCTION public.activate_package(
  _plan_tier plan_tier,
  _isp text,
  _sim_package text,
  _customer_name text,
  _customer_whatsapp text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_price integer;
  v_config_id uuid;
  v_sub_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF coalesce(trim(_customer_name), '') = '' OR coalesce(trim(_customer_whatsapp), '') = '' THEN
    RAISE EXCEPTION 'Name and WhatsApp number are required';
  END IF;

  SELECT price_lkr INTO v_price
  FROM public.plans
  WHERE tier = _plan_tier AND is_active = true
  ORDER BY sort_order
  LIMIT 1;

  IF v_price IS NULL THEN
    RAISE EXCEPTION 'Plan not available';
  END IF;

  SELECT id INTO v_config_id
  FROM public.configs
  WHERE is_active = true
    AND is_assigned = false
    AND lower(isp) = lower(trim(_isp))
    AND (_sim_package IS NULL OR trim(_sim_package) = '' OR lower(package_name) = lower(trim(_sim_package)))
    AND (expire_date IS NULL OR expire_date > now())
  ORDER BY created_at
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  INSERT INTO public.subscriptions (
    user_id, plan_tier, price_lkr, pay_by_date, period_end,
    isp, sim_package, config_id, customer_name, customer_whatsapp, is_paid
  ) VALUES (
    v_uid, _plan_tier, v_price, now(), NULL,
    trim(_isp), nullif(trim(_sim_package), ''), v_config_id,
    trim(_customer_name), trim(_customer_whatsapp), false
  ) RETURNING id INTO v_sub_id;

  IF v_config_id IS NOT NULL THEN
    UPDATE public.configs
    SET is_assigned = true, assigned_to = v_uid, assigned_at = now()
    WHERE id = v_config_id;
  END IF;

  UPDATE public.profiles
  SET display_name = coalesce(nullif(trim(_customer_name), ''), display_name),
      whatsapp = coalesce(nullif(trim(_customer_whatsapp), ''), whatsapp)
  WHERE id = v_uid;

  RETURN v_sub_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.activate_package(plan_tier, text, text, text, text) TO authenticated;

-- 6. admin approval: mark paid for 30 days and record the verification
CREATE OR REPLACE FUNCTION public.approve_payment(_subscription_id uuid, _payment_id uuid DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT private.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  UPDATE public.subscriptions
  SET is_paid = true,
      paid_at = now(),
      pay_by_date = now(),
      period_end = now() + interval '30 days',
      cancelled = false
  WHERE id = _subscription_id;

  UPDATE public.payments
  SET status = 'approved', verified_by = auth.uid(), verified_at = now()
  WHERE (_payment_id IS NOT NULL AND id = _payment_id)
     OR (_payment_id IS NULL AND subscription_id = _subscription_id AND status = 'pending');
END;
$$;

GRANT EXECUTE ON FUNCTION public.approve_payment(uuid, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.reject_payment(_payment_id uuid, _note text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT private.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  UPDATE public.payments
  SET status = 'rejected', verified_by = auth.uid(), verified_at = now(),
      note = coalesce(_note, note)
  WHERE id = _payment_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.reject_payment(uuid, text) TO authenticated;

-- 7. store phone / whatsapp captured at signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, phone, whatsapp)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'whatsapp'
  );

  IF lower(NEW.email) = 'godfather.devup@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  END IF;

  RETURN NEW;
END;
$$;
