import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useImamProfile = () => {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["my-imam-profile", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("imam_profiles")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  return {
    imam: query.data,
    isImam: !!query.data && query.data.active,
    loading: query.isLoading,
    refetch: query.refetch,
  };
};
