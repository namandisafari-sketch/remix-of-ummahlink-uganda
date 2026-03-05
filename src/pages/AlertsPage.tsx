import { motion } from "framer-motion";
import { MapPin, Clock, Phone, Droplets, AlertTriangle, Plus, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import CreateAlertDialog from "@/components/CreateAlertDialog";
import { useState } from "react";

const AlertsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);

  const { data: alerts, isLoading, refetch } = useQuery({
    queryKey: ["alerts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alerts_janaza")
        .select("*")
        .eq("active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="container py-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Janaza & SOS Alerts</h1>
          <p className="mt-1 text-muted-foreground">Real-time community alerts. Cached for offline viewing.</p>
        </div>
        <Button
          variant="hero"
          size="sm"
          className="gap-2"
          onClick={() => user ? setShowCreate(true) : navigate("/auth")}
        >
          <Plus className="h-4 w-4" /> Post Alert
        </Button>
      </motion.div>

      {isLoading ? (
        <div className="mt-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : alerts && alerts.length === 0 ? (
        <div className="mt-12 text-center text-muted-foreground">
          <AlertTriangle className="mx-auto mb-3 h-10 w-10 opacity-40" />
          <p>No active alerts right now. Alhamdulillah.</p>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {alerts?.map((alert, i) => {
            const isJanaza = alert.type === "janaza";
            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className={`relative overflow-hidden ${alert.urgent ? "border-urgent/30" : ""}`}>
                  {alert.urgent && (
                    <div className="absolute right-0 top-0 h-1 w-full bg-urgent animate-pulse-urgent" />
                  )}
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg">{alert.title}</CardTitle>
                      <Badge variant={isJanaza ? "default" : "urgent"}>
                        {isJanaza ? "Janaza" : "SOS"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {alert.description && (
                      <p className="text-sm text-muted-foreground">{alert.description}</p>
                    )}
                    <div className="flex flex-col gap-2 text-sm">
                      <div className="flex items-center gap-2 text-foreground">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {alert.time}
                      </div>
                      <div className="flex items-center gap-2 text-foreground">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        {alert.maps_link ? (
                          <a href={alert.maps_link} target="_blank" rel="noopener noreferrer"
                            className="underline decoration-primary/30 hover:decoration-primary">
                            {alert.location}
                          </a>
                        ) : alert.location}
                      </div>
                      <div className="flex items-center gap-2 text-foreground">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <a href={`tel:${alert.contact}`} className="underline decoration-primary/30 hover:decoration-primary">
                          {alert.contact}
                        </a>
                      </div>
                    </div>

                    {alert.type === "sos" && (
                      <Button variant="urgent" size="sm" className="mt-2 w-full gap-2">
                        <Droplets className="h-4 w-4" /> I Can Help
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      <CreateAlertDialog open={showCreate} onOpenChange={setShowCreate} onCreated={refetch} />
    </div>
  );
};

export default AlertsPage;
