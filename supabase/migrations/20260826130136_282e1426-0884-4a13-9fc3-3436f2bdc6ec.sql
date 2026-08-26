REVOKE EXECUTE ON FUNCTION public.activate_package(plan_tier, text, text, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.approve_payment(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.reject_payment(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.activate_package(plan_tier, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_payment(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_payment(uuid, text) TO authenticated;