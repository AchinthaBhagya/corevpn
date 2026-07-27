-- Monthly plans + pay-later subscriptions
CREATE TYPE public.plan_tier AS ENUM ('basic', 'standard', 'premium');

CREATE TABLE public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tier public.plan_tier NOT NULL UNIQUE,
  name text NOT NULL,
  data_gb integer,
  price_lkr integer NOT NULL,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.plans TO anon;
GRANT SELECT ON public.plans TO authenticated;
GRANT ALL ON public.plans TO service_role;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active plans" ON public.plans
  FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage plans" ON public.plans
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER plans_set_updated_at BEFORE UPDATE ON public.plans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.plans (tier, name, data_gb, price_lkr, description, sort_order) VALUES
  ('basic',    'Basic',    100,  200, '100 GB monthly data', 1),
  ('standard', 'Standard', 200,  300, '200 GB monthly data', 2),
  ('premium',  'Premium',  NULL, 500, 'Unlimited data',      3);

-- Subscriptions: user picks a plan, promises to pay by a date, gets access meanwhile
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_tier public.plan_tier NOT NULL,
  price_lkr integer NOT NULL,
  is_paid boolean NOT NULL DEFAULT false,
  paid_at timestamptz,
  pay_by_date timestamptz NOT NULL,
  period_end timestamptz,
  cancelled boolean NOT NULL DEFAULT false,
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX subscriptions_user_idx ON public.subscriptions(user_id);

GRANT SELECT, INSERT ON public.subscriptions TO authenticated;
GRANT UPDATE, DELETE ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own subscriptions" ON public.subscriptions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users create own subscriptions" ON public.subscriptions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND is_paid = false AND paid_at IS NULL);
CREATE POLICY "Users cancel own subscriptions" ON public.subscriptions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all subscriptions" ON public.subscriptions
  FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage subscriptions" ON public.subscriptions
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER subscriptions_set_updated_at BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Users must not mark themselves as paid or change money fields
CREATE OR REPLACE FUNCTION public.prevent_subscription_payment_tampering()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF private.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  NEW.is_paid := OLD.is_paid;
  NEW.paid_at := OLD.paid_at;
  NEW.price_lkr := OLD.price_lkr;
  NEW.plan_tier := OLD.plan_tier;
  NEW.pay_by_date := OLD.pay_by_date;
  NEW.period_end := OLD.period_end;
  NEW.user_id := OLD.user_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER subscriptions_prevent_tampering BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.prevent_subscription_payment_tampering();

-- Access check: paid & within period, OR unpaid but still inside the promised-payment window
CREATE OR REPLACE FUNCTION private.has_plan_access(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions s
    WHERE s.user_id = _user_id
      AND s.cancelled = false
      AND (
        (s.is_paid = true AND (s.period_end IS NULL OR s.period_end > now()))
        OR (s.is_paid = false AND s.pay_by_date > now())
      )
  );
$$;

REVOKE ALL ON FUNCTION private.has_plan_access(uuid) FROM PUBLIC, anon, authenticated;

-- Premium configs unlock for anyone with active plan access
DROP POLICY IF EXISTS "Authenticated users view active configs" ON public.configs;
CREATE POLICY "Authenticated users view active configs" ON public.configs
  FOR SELECT TO authenticated
  USING (
    is_active = true
    AND (expire_date IS NULL OR expire_date > now())
    AND (
      requires_premium = false
      OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_premium = true)
      OR private.has_plan_access(auth.uid())
    )
  );