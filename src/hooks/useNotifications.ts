import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type MosqueNotification = {
  id: string;
  imam_user_id: string;
  mosque_name: string;
  title: string;
  body: string;
  category: string;
  urgent: boolean;
  poster_url: string | null;
  event_time: string | null;
  event_at: string | null;
  location_text: string | null;
  maps_link: string | null;
  scope: string;
  target_region: string | null;
  target_district: string | null;
  target_constituency: string | null;
  target_subcounty: string | null;
  target_parish: string | null;
  target_village: string | null;
  allow_rsvp: boolean;
  active: boolean;
  expires_at: string | null;
  created_at: string;
};

type Prefs = {
  region: string | null;
  district: string | null;
  constituency: string | null;
  subcounty: string | null;
  parish: string | null;
  village: string | null;
};

const matchesUserLocation = (n: MosqueNotification, prefs: Prefs | null) => {
  if (n.scope === "nationwide") return true;
  if (!prefs) return n.scope === "nationwide";

  switch (n.scope) {
    case "region":
      return !!n.target_region && n.target_region === prefs.region;
    case "district":
      return !!n.target_district && n.target_district === prefs.district;
    case "constituency":
      return !!n.target_constituency && n.target_constituency === prefs.constituency;
    case "subcounty":
      return !!n.target_subcounty && n.target_subcounty === prefs.subcounty;
    case "parish":
      return !!n.target_parish && n.target_parish === prefs.parish;
    case "village":
      return !!n.target_village && n.target_village === prefs.village;
    default:
      return false;
  }
};

export const useRelevantNotifications = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["relevant-notifications", user?.id],
    queryFn: async () => {
      const [{ data: notifs, error }, prefsRes, readsRes] = await Promise.all([
        supabase
          .from("mosque_notifications")
          .select("*")
          .eq("active", true)
          .order("created_at", { ascending: false })
          .limit(100),
        user
          ? supabase
              .from("user_preferences")
              .select("region, district, constituency, subcounty, parish, village")
              .eq("user_id", user.id)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
        user
          ? supabase
              .from("notification_reads")
              .select("notification_id")
              .eq("user_id", user.id)
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (error) throw error;

      const prefs = (prefsRes.data ?? null) as Prefs | null;
      const readIds = new Set((readsRes.data ?? []).map((r: any) => r.notification_id));

      const relevant = (notifs ?? []).filter((n) =>
        matchesUserLocation(n as MosqueNotification, prefs)
      ) as MosqueNotification[];

      return {
        notifications: relevant,
        unreadCount: relevant.filter((n) => !readIds.has(n.id)).length,
        readIds,
      };
    },
  });
};
