import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Users, Building2, ExternalLink, Loader2 } from "lucide-react";
import { CategoryBadge } from "./CategoryBadge";
import type { MosqueNotification } from "@/hooks/useNotifications";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useState, useEffect } from "react";

interface Props {
  notification: MosqueNotification;
  isUnread?: boolean;
}

const SCOPE_LABEL: Record<string, string> = {
  nationwide: "Nationwide",
  region: "Region",
  district: "District",
  constituency: "Constituency",
  subcounty: "Subcounty",
  parish: "Parish",
  village: "Village",
};

const NotificationCard = ({ notification: n, isUnread }: Props) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [rsvpLoading, setRsvpLoading] = useState(false);

  // Fetch RSVP count + my RSVP state
  const { data: rsvpData } = useQuery({
    queryKey: ["rsvps", n.id, user?.id ?? "anon"],
    queryFn: async () => {
      const [countRes, mineRes] = await Promise.all([
        supabase.from("notification_rsvps").select("*", { count: "exact", head: true }).eq("notification_id", n.id),
        user
          ? supabase
              .from("notification_rsvps")
              .select("id")
              .eq("notification_id", n.id)
              .eq("user_id", user.id)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
      ]);
      return {
        count: countRes.count ?? 0,
        mine: !!mineRes.data,
      };
    },
  });

  // Mark as read on view (once)
  useEffect(() => {
    if (!user || !isUnread) return;
    supabase
      .from("notification_reads")
      .insert({ notification_id: n.id, user_id: user.id })
      .then(() => qc.invalidateQueries({ queryKey: ["relevant-notifications"] }));
  }, [user, isUnread, n.id, qc]);

  const toggleRsvp = async () => {
    if (!user) {
      toast.error("Please sign in to RSVP");
      return;
    }
    setRsvpLoading(true);
    try {
      if (rsvpData?.mine) {
        const { error } = await supabase
          .from("notification_rsvps")
          .delete()
          .eq("notification_id", n.id)
          .eq("user_id", user.id);
        if (error) throw error;
        toast.success("RSVP removed");
      } else {
        const { error } = await supabase
          .from("notification_rsvps")
          .insert({ notification_id: n.id, user_id: user.id });
        if (error) throw error;
        toast.success("You're attending — Insha'Allah");
      }
      qc.invalidateQueries({ queryKey: ["rsvps", n.id] });
    } catch (e: any) {
      toast.error(e.message ?? "Failed to update RSVP");
    } finally {
      setRsvpLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className={n.urgent ? "border-urgent/30 shadow-md" : ""}>
        {n.urgent && <div className="h-1 w-full bg-urgent animate-pulse-urgent" />}

        {n.poster_url && (
          <div className="aspect-[16/9] w-full overflow-hidden bg-muted">
            <img src={n.poster_url} alt={n.title} loading="lazy" className="h-full w-full object-cover" />
          </div>
        )}

        <CardContent className="space-y-3 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <CategoryBadge category={n.category} />
            {isUnread && (
              <Badge variant="default" className="bg-primary text-primary-foreground">New</Badge>
            )}
            <Badge variant="outline" className="text-[10px]">
              {SCOPE_LABEL[n.scope] ?? n.scope}
            </Badge>
          </div>

          <div>
            <h3 className="font-display text-lg font-semibold text-foreground leading-tight">{n.title}</h3>
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <Building2 className="h-3 w-3" /> {n.mosque_name}
            </p>
          </div>

          <p className="whitespace-pre-line text-sm text-foreground/85">{n.body}</p>

          <div className="space-y-1.5 text-sm">
            {n.event_time && (
              <div className="flex items-center gap-2 text-foreground">
                <Clock className="h-4 w-4 text-muted-foreground" />
                {n.event_time}
              </div>
            )}
            {n.location_text && (
              <div className="flex items-center gap-2 text-foreground">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                {n.maps_link ? (
                  <a
                    href={n.maps_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline decoration-primary/30 hover:decoration-primary inline-flex items-center gap-1"
                  >
                    {n.location_text} <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  n.location_text
                )}
              </div>
            )}
          </div>

          {n.allow_rsvp && (
            <div className="flex items-center justify-between border-t pt-3">
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                {rsvpData?.count ?? 0} attending
              </p>
              <Button
                size="sm"
                variant={rsvpData?.mine ? "outline" : "hero"}
                disabled={rsvpLoading}
                onClick={toggleRsvp}
              >
                {rsvpLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : rsvpData?.mine ? (
                  "✓ Attending"
                ) : (
                  "I'll attend"
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default NotificationCard;
