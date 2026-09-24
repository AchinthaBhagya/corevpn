REVOKE EXECUTE ON FUNCTION public.activate_package(plan_tier, text, text, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.approve_payment(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.reject_payment(uuid, text) FROM PUBLIC, anon;

CREATE OR REPLACE FUNCTION public.activate_package(_plan_tier plan_tier, _isp text, _sim_package text, _customer_name text, _customer_whatsapp text)
 RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_price integer;
  v_config_id uuid;
  v_sub_id uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF coalesce(trim(_customer_name), '') = '' OR coalesce(trim(_customer_whatsapp), '') = '' THEN
    RAISE EXCEPTION 'Name and WhatsApp number are required';
  END IF;
  IF length(_customer_name) > 100 OR length(coalesce(_sim_package,'')) > 100 OR length(coalesce(_isp,'')) > 30 THEN
    RAISE EXCEPTION 'Input too long';
  END IF;
  IF trim(_customer_whatsapp) !~ '^\+?[0-9 ]{9,16}$' THEN
    RAISE EXCEPTION 'Invalid WhatsApp number';
  END IF;
  IF lower(trim(_isp)) NOT IN ('dialog','hutch','mobitel','slt','airtel') THEN
    RAISE EXCEPTION 'Invalid ISP';
  END IF;
  -- Prevent draining the config pool: max one unpaid pending order per user
  IF EXISTS (SELECT 1 FROM public.subscriptions WHERE user_id = v_uid AND is_paid = false AND cancelled = false) THEN
    RAISE EXCEPTION 'You already have a pending order. Please complete payment or wait for admin review.';
  END IF;

  SELECT price_lkr INTO v_price FROM public.plans
  WHERE tier = _plan_tier AND is_active = true ORDER BY sort_order LIMIT 1;
  IF v_price IS NULL THEN RAISE EXCEPTION 'Plan not available'; END IF;

  SELECT id INTO v_config_id FROM public.configs
  WHERE is_active = true AND is_assigned = false
    AND lower(isp) = lower(trim(_isp))
    AND (_sim_package IS NULL OR trim(_sim_package) = '' OR lower(package_name) = lower(trim(_sim_package)))
    AND (expire_date IS NULL OR expire_date > now())
  ORDER BY created_at LIMIT 1 FOR UPDATE SKIP LOCKED;

  INSERT INTO public.subscriptions (user_id, plan_tier, price_lkr, pay_by_date, period_end,
    isp, sim_package, config_id, customer_name, customer_whatsapp, is_paid)
  VALUES (v_uid, _plan_tier, v_price, now(), NULL, trim(_isp), nullif(trim(_sim_package), ''),
    v_config_id, trim(_customer_name), trim(_customer_whatsapp), false)
  RETURNING id INTO v_sub_id;

  IF v_config_id IS NOT NULL THEN
    UPDATE public.configs SET is_assigned = true, assigned_to = v_uid, assigned_at = now() WHERE id = v_config_id;
  END IF;

  UPDATE public.profiles
  SET display_name = coalesce(nullif(trim(_customer_name), ''), display_name),
      whatsapp = coalesce(nullif(trim(_customer_whatsapp), ''), whatsapp)
  WHERE id = v_uid;
  RETURN v_sub_id;
END;
$function$;
REVOKE EXECUTE ON FUNCTION public.activate_package(plan_tier, text, text, text, text) FROM PUBLIC, anon;