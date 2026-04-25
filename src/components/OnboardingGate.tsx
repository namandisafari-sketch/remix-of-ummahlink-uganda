import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const EXEMPT_PATHS = ["/onboarding", "/auth"];

const OnboardingGate = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [checkedFor, setCheckedFor] = useState<string | null>(null);

  useEffect(() => {
    if (loading || !user) return;
    if (EXEMPT_PATHS.includes(location.pathname)) return;
    if (checkedFor === user.id) return;

    (async () => {
      const { data } = await supabase
        .from("user_preferences")
        .select("onboarding_completed")
        .eq("user_id", user.id)
        .maybeSingle();
      setCheckedFor(user.id);
      if (!data?.onboarding_completed) {
        navigate("/onboarding", { replace: true });
      }
    })();
  }, [user, loading, location.pathname, navigate, checkedFor]);

  return null;
};

export default OnboardingGate;
