import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

const AdminAlerts = () => {
  const queryClient = useQueryClient();

  const { data: alerts, isLoading } = useQuery({
    queryKey: ["admin-alerts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alerts_janaza")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const toggleActive = async (alert: any) => {
    const { error } = await supabase
      .from("alerts_janaza")
      .update({ active: !alert.active })
      .eq("id", alert.id);
    if (error) toast.error(error.message);
    else {
      toast.success(alert.active ? "Alert hidden" : "Alert shown");
      queryClient.invalidateQueries({ queryKey: ["admin-alerts"] });
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this alert permanently?")) return;
    const { error } = await supabase.from("alerts_janaza").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Alert deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-alerts"] });
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="font-display text-xl">Community Alerts</CardTitle>
      </CardHeader>
      <CardContent>
        {alerts?.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No alerts yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts?.map((alert) => (
                  <TableRow key={alert.id} className={!alert.active ? "opacity-50" : ""}>
                    <TableCell className="font-medium max-w-[200px] truncate">{alert.title}</TableCell>
                    <TableCell>
                      <Badge variant={alert.type === "sos" ? "urgent" : "default"}>
                        {alert.type === "sos" ? "SOS" : "Janaza"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{alert.location}</TableCell>
                    <TableCell className="text-muted-foreground">{alert.time}</TableCell>
                    <TableCell>
                      <Badge variant={alert.active ? "default" : "secondary"}>
                        {alert.active ? "Active" : "Hidden"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => toggleActive(alert)} title={alert.active ? "Hide" : "Show"}>
                          {alert.active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(alert.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminAlerts;
