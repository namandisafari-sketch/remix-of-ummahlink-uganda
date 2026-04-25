import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const PUBLIC_PATHS = ["/auth"];
const ONBOARDING_PATH = "/onboarding";

const OnboardingGate = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [checkedFor, setCheckedFor] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;

    // Not signed in → force to /auth (except already there)
    if (!user) {
      if (!PUBLIC_PATHS.includes(location.pathname)) {
        navigate("/auth", { replace: true });
      }
      return;
    }

    // Signed in but on /auth → move forward (gate will re-check onboarding)
    if (location.pathname === ONBOARDING_PATH) return;
    if (checkedFor === user.id && location.pathname !== "/auth") return;

    (async () => {
      const { data } = await supabase
        .from("user_preferences")
        .select("onboarding_completed")
        .eq("user_id", user.id)
        .maybeSingle();
      setCheckedFor(user.id);
      if (!data?.onboarding_completed) {
        navigate("/onboarding", { replace: true });
      } else if (location.pathname === "/auth") {
        navigate("/", { replace: true });
      }
    })();
  }, [user, loading, location.pathname, navigate, checkedFor]);

  return null;
};

export default OnboardingGate;
