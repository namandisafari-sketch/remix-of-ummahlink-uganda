import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type UserLocation = {
  region: string | null;
  district: string | null;
  constituency: string | null;
  subcounty: string | null;
  parish: string | null;
  village: string | null;
};

export const useUserLocation = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-location", user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<UserLocation | null> => {
      const { data, error } = await supabase
        .from("user_preferences")
        .select("region, district, constituency, subcounty, parish, village")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data ?? null;
    },
  });
};
