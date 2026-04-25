import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, CheckCircle2, XCircle, MapPin, Phone, Mail, Building2 } from "lucide-react";
import { toast } from "sonner";

const STATUS_FILTERS = ["pending", "approved", "rejected"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

const AdminImamApplications = () => {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<StatusFilter>("pending");
  const [selected, setSelected] = useState<any>(null);
  const [notes, setNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-imam-applications", filter],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("imam_applications")
        .select("*")
        .eq("status", filter)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const openReview = (app: any) => {
    setSelected(app);
    setNotes(app.admin_notes ?? "");
  };

  const approve = async () => {
    if (!selected) return;
    setActionLoading(true);
    try {
      // 1. Create imam profile
      const { error: profErr } = await supabase.from("imam_profiles").upsert(
        {
          user_id: selected.user_id,
          full_name: selected.full_name,
          mosque_name: selected.mosque_name,
          masjid_id: selected.masjid_id ?? null,
          region: selected.region,
          district: selected.district,
          constituency: selected.constituency,
          subcounty: selected.subcounty,
          parish: selected.parish,
          village: selected.village,
          contact_phone: selected.contact_phone,
          whatsapp: selected.whatsapp,
          active: true,
          verified: true,
        },
        { onConflict: "user_id" }
      );
      if (profErr) throw profErr;

      // 2. Grant 'imam' role
      const { error: roleErr } = await supabase
        .from("user_roles")
        .insert({ user_id: selected.user_id, role: "imam" });
      // ignore unique constraint conflict
      if (roleErr && !roleErr.message.includes("duplicate")) throw roleErr;

      // 3. Update application
      const { data: { user } } = await supabase.auth.getUser();
      const { error: updErr } = await supabase
        .from("imam_applications")
        .update({
          status: "approved",
          admin_notes: notes || null,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", selected.id);
      if (updErr) throw updErr;

      toast.success(`${selected.full_name} is now a verified imam`);
      setSelected(null);
      qc.invalidateQueries({ queryKey: ["admin-imam-applications"] });
    } catch (err: any) {
      toast.error(err.message ?? "Failed to approve");
    } finally {
      setActionLoading(false);
    }
  };

  const reject = async () => {
    if (!selected) return;
    setActionLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("imam_applications")
        .update({
          status: "rejected",
          admin_notes: notes || null,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", selected.id);
      if (error) throw error;
      toast.success("Application rejected");
      setSelected(null);
      qc.invalidateQueries({ queryKey: ["admin-imam-applications"] });
    } catch (err: any) {
      toast.error(err.message ?? "Failed to reject");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="font-display text-xl">Imam applications</CardTitle>
          <div className="flex gap-1">
            {STATUS_FILTERS.map((s) => (
              <Button
                key={s}
                size="sm"
                variant={filter === s ? "default" : "outline"}
                onClick={() => setFilter(s)}
                className="capitalize"
              >
                {s}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : data?.length === 0 ? (
          <p className="py-12 text-center text-muted-foreground">No {filter} applications.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {data?.map((app) => (
              <Card key={app.id} className="border-border/60">
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground">{app.full_name}</p>
                      <p className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Building2 className="h-3 w-3" /> {app.mosque_name}
                      </p>
                    </div>
                    <Badge
                      variant={
                        app.status === "approved" ? "default" : app.status === "rejected" ? "urgent" : "secondary"
                      }
                      className="capitalize"
                    >
                      {app.status}
                    </Badge>
                  </div>

                  <div className="space-y-1 text-xs text-muted-foreground">
                    {app.district && (
                      <p className="flex items-center gap-1.5">
                        <MapPin className="h-3 w-3" />
                        {[app.parish, app.subcounty, app.district].filter(Boolean).join(", ")}
                      </p>
                    )}
                    <p className="flex items-center gap-1.5">
                      <Phone className="h-3 w-3" />
                      {app.contact_phone}
                    </p>
                    {app.email && (
                      <p className="flex items-center gap-1.5 truncate">
                        <Mail className="h-3 w-3" />
                        {app.email}
                      </p>
                    )}
                  </div>

                  <Button size="sm" variant="outline" className="w-full" onClick={() => openReview(app)}>
                    Review
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Review application</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="space-y-1 text-sm">
                <p><span className="text-muted-foreground">Name:</span> <strong>{selected.full_name}</strong></p>
                <p><span className="text-muted-foreground">Mosque:</span> <strong>{selected.mosque_name}</strong></p>
                <p><span className="text-muted-foreground">Phone:</span> {selected.contact_phone}</p>
                {selected.whatsapp && <p><span className="text-muted-foreground">WhatsApp:</span> {selected.whatsapp}</p>}
                {selected.email && <p><span className="text-muted-foreground">Email:</span> {selected.email}</p>}
                <p>
                  <span className="text-muted-foreground">Location:</span>{" "}
                  {[selected.village, selected.parish, selected.subcounty, selected.constituency, selected.district, selected.region]
                    .filter(Boolean)
                    .join(", ") || "—"}
                </p>
              </div>

              {selected.bio && (
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Bio</p>
                  <p className="text-sm text-foreground">{selected.bio}</p>
                </div>
              )}
              {selected.credentials && (
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Credentials</p>
                  <p className="text-sm text-foreground">{selected.credentials}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium">Admin notes (optional)</label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
              </div>

              {selected.status === "pending" && (
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" disabled={actionLoading} onClick={reject}>
                    {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><XCircle className="mr-1 h-4 w-4" /> Reject</>}
                  </Button>
                  <Button variant="hero" className="flex-1" disabled={actionLoading} onClick={approve}>
                    {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle2 className="mr-1 h-4 w-4" /> Approve</>}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default AdminImamApplications;
