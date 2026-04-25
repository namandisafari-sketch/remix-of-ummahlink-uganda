import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, CheckCircle2, XCircle, Clock, Building2, Phone, MessageCircle, ExternalLink } from "lucide-react";
import { toast } from "sonner";

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60);

const AdminOperatorApplications = () => {
  const qc = useQueryClient();
  const [reviewing, setReviewing] = useState<any>(null);
  const [notes, setNotes] = useState("");
  const [working, setWorking] = useState(false);

  const { data: apps, isLoading } = useQuery({
    queryKey: ["admin-operator-applications"],
    queryFn: async () => {
      const { data, error } = await (supabase.from("operator_applications") as any)
        .select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  const approve = async (app: any) => {
    setWorking(true);
    // 1. Create operator profile
    const slug = slugify(app.company_name) + "-" + Math.random().toString(36).slice(2, 6);
    const { data: op, error: opErr } = await supabase.from("tour_operators").insert({
      owner_user_id: app.user_id,
      name: app.company_name,
      slug,
      bio: app.bio,
      city: app.city,
      district: app.district,
      contact_phone: app.contact_phone,
      whatsapp: app.whatsapp,
      email: app.email,
      website: app.website,
      license_no: app.license_no,
      license_authority: app.license_authority,
      verified: true,
    }).select().single();
    if (opErr) {
      setWorking(false);
      return toast.error("Operator: " + opErr.message);
    }
    // 2. Grant operator role
    await (supabase.from("user_roles") as any).insert({ user_id: app.user_id, role: "operator" });
    // 3. Mark application approved
    const { error: updErr } = await (supabase.from("operator_applications") as any).update({
      status: "approved",
      reviewed_at: new Date().toISOString(),
      admin_notes: notes || null,
      created_operator_id: op.id,
    }).eq("id", app.id);
    setWorking(false);
    if (updErr) return toast.error(updErr.message);
    toast.success("Application approved & operator activated");
    setReviewing(null);
    setNotes("");
    qc.invalidateQueries({ queryKey: ["admin-operator-applications"] });
  };

  const reject = async (app: any) => {
    if (!notes.trim()) return toast.error("Please provide a reason in notes");
    setWorking(true);
    const { error } = await (supabase.from("operator_applications") as any).update({
      status: "rejected",
      reviewed_at: new Date().toISOString(),
      admin_notes: notes,
    }).eq("id", app.id);
    setWorking(false);
    if (error) return toast.error(error.message);
    toast.success("Application rejected");
    setReviewing(null);
    setNotes("");
    qc.invalidateQueries({ queryKey: ["admin-operator-applications"] });
  };

  if (isLoading) return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  const pending = apps?.filter((a) => a.status === "pending") ?? [];
  const approved = apps?.filter((a) => a.status === "approved") ?? [];
  const rejected = apps?.filter((a) => a.status === "rejected") ?? [];

  const renderList = (list: any[]) => {
    if (list.length === 0) return <p className="py-8 text-center text-sm text-muted-foreground">None.</p>;
    return (
      <div className="grid gap-3 md:grid-cols-2">
        {list.map((a) => {
          const StatusIcon = a.status === "approved" ? CheckCircle2 : a.status === "rejected" ? XCircle : Clock;
          const tone = a.status === "approved" ? "text-green-600" : a.status === "rejected" ? "text-destructive" : "text-amber-600";
          return (
            <Card key={a.id}>
              <CardContent className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                      <Building2 className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{a.company_name}</p>
                      <p className="truncate text-xs text-muted-foreground">{[a.city, a.district].filter(Boolean).join(", ") || "—"}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={`gap-1 text-[10px] capitalize ${tone}`}>
                    <StatusIcon className="h-3 w-3" />{a.status}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{a.contact_phone}</span>
                  {a.license_no && <Badge variant="outline" className="text-[10px]">Lic: {a.license_no}</Badge>}
                </div>
                {a.bio && <p className="line-clamp-2 text-xs text-muted-foreground">{a.bio}</p>}
                <p className="text-[10px] text-muted-foreground">{new Date(a.created_at).toLocaleString()}</p>
                {a.status === "pending" ? (
                  <Button size="sm" variant="outline" className="w-full" onClick={() => { setReviewing(a); setNotes(""); }}>
                    Review
                  </Button>
                ) : (
                  a.admin_notes && <p className="rounded bg-muted/50 p-2 text-xs"><span className="font-medium">Notes:</span> {a.admin_notes}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="pending">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({approved.length})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({rejected.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="pending" className="mt-3">{renderList(pending)}</TabsContent>
        <TabsContent value="approved" className="mt-3">{renderList(approved)}</TabsContent>
        <TabsContent value="rejected" className="mt-3">{renderList(rejected)}</TabsContent>
      </Tabs>

      <Dialog open={!!reviewing} onOpenChange={(o) => !o && setReviewing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{reviewing?.company_name}</DialogTitle></DialogHeader>
          {reviewing && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Info label="Phone" v={reviewing.contact_phone} />
                <Info label="WhatsApp" v={reviewing.whatsapp} />
                <Info label="Email" v={reviewing.email} />
                <Info label="Website" v={reviewing.website} link />
                <Info label="City" v={reviewing.city} />
                <Info label="District" v={reviewing.district} />
                <Info label="License #" v={reviewing.license_no} />
                <Info label="License authority" v={reviewing.license_authority} />
              </div>
              {reviewing.bio && (
                <div>
                  <p className="mb-1 text-xs font-medium">About</p>
                  <p className="rounded-lg bg-muted/50 p-3 text-sm">{reviewing.bio}</p>
                </div>
              )}
              <div>
                <p className="mb-1 text-xs font-medium">Admin notes (optional for approve, required for reject)</p>
                <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Reason or follow-up notes…" />
              </div>
              <div className="flex gap-2">
                <Button className="flex-1" onClick={() => approve(reviewing)} disabled={working}>
                  {working ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle2 className="mr-1 h-4 w-4" />Approve</>}
                </Button>
                <Button className="flex-1" variant="destructive" onClick={() => reject(reviewing)} disabled={working}>
                  <XCircle className="mr-1 h-4 w-4" />Reject
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const Info = ({ label, v, link }: any) => {
  if (!v) return <div><p className="text-[10px] text-muted-foreground">{label}</p><p className="text-muted-foreground">—</p></div>;
  return (
    <div>
      <p className="text-[10px] text-muted-foreground">{label}</p>
      {link ? (
        <a href={v} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
          {v} <ExternalLink className="h-3 w-3" />
        </a>
      ) : <p>{v}</p>}
    </div>
  );
};

export default AdminOperatorApplications;
