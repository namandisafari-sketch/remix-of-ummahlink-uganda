import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, MapPin, Check, X, Trash2, Clock, User } from "lucide-react";
import { toast } from "sonner";

interface Submission {
  id: string;
  user_id: string;
  name: string;
  address: string | null;
  city: string | null;
  district: string | null;
  latitude: number;
  longitude: number;
  imam_name: string | null;
  contact_phone: string | null;
  description: string | null;
  status: "pending" | "approved" | "rejected";
  admin_notes: string | null;
  created_at: string;
}

const AdminSubmissions = () => {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"pending" | "approved" | "rejected">("pending");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const { data: submissions, isLoading } = useQuery({
    queryKey: ["admin-submissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("masjid_submissions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Submission[];
    },
  });

  const approve = async (s: Submission) => {
    setBusy(s.id);
    // Insert into masjids
    const { error: insErr } = await supabase.from("masjids").insert({
      name: s.name,
      address: s.address,
      city: s.city,
      district: s.district,
      latitude: s.latitude,
      longitude: s.longitude,
      imam_name: s.imam_name,
      contact_phone: s.contact_phone,
      description: s.description,
      verified: true,
      active: true,
    });
    if (insErr) {
      setBusy(null);
      return toast.error(insErr.message);
    }
    const { error: upErr } = await supabase
      .from("masjid_submissions")
      .update({ status: "approved", admin_notes: notes[s.id] || null, reviewed_at: new Date().toISOString() })
      .eq("id", s.id);
    setBusy(null);
    if (upErr) return toast.error(upErr.message);
    toast.success(`${s.name} added to the map`);
    qc.invalidateQueries({ queryKey: ["admin-submissions"] });
    qc.invalidateQueries({ queryKey: ["masjids"] });
    qc.invalidateQueries({ queryKey: ["admin-masjids"] });
  };

  const reject = async (s: Submission) => {
    setBusy(s.id);
    const { error } = await supabase
      .from("masjid_submissions")
      .update({ status: "rejected", admin_notes: notes[s.id] || null, reviewed_at: new Date().toISOString() })
      .eq("id", s.id);
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success("Rejected");
    qc.invalidateQueries({ queryKey: ["admin-submissions"] });
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this submission record?")) return;
    const { error } = await supabase.from("masjid_submissions").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin-submissions"] });
  };

  if (isLoading) return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  const filtered = submissions?.filter((s) => s.status === tab) ?? [];
  const counts = {
    pending: submissions?.filter((s) => s.status === "pending").length ?? 0,
    approved: submissions?.filter((s) => s.status === "approved").length ?? 0,
    rejected: submissions?.filter((s) => s.status === "rejected").length ?? 0,
  };

  return (
    <div className="mt-4">
      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList>
          <TabsTrigger value="pending" className="gap-1"><Clock className="h-3 w-3" /> Pending <Badge variant="secondary" className="ml-1">{counts.pending}</Badge></TabsTrigger>
          <TabsTrigger value="approved" className="gap-1"><Check className="h-3 w-3" /> Approved <Badge variant="secondary" className="ml-1">{counts.approved}</Badge></TabsTrigger>
          <TabsTrigger value="rejected" className="gap-1"><X className="h-3 w-3" /> Rejected <Badge variant="secondary" className="ml-1">{counts.rejected}</Badge></TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          <div className="grid gap-3 md:grid-cols-2">
            {filtered.map((s) => (
              <Card key={s.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="flex items-center gap-1 truncate font-semibold text-foreground"><MapPin className="h-4 w-4 text-primary" /> {s.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{s.address || s.city}</p>
                      <p className="text-[10px] text-muted-foreground">{s.latitude.toFixed(4)}, {s.longitude.toFixed(4)}</p>
                    </div>
                    <Badge variant={s.status === "pending" ? "default" : s.status === "approved" ? "secondary" : "outline"}>{s.status}</Badge>
                  </div>
                  {s.description && <p className="mt-2 text-sm text-foreground/80">{s.description}</p>}
                  <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground">
                    <User className="h-3 w-3" /> Submitted {new Date(s.created_at).toLocaleDateString()}
                  </div>

                  {s.status === "pending" ? (
                    <>
                      <Textarea
                        value={notes[s.id] || ""}
                        onChange={(e) => setNotes({ ...notes, [s.id]: e.target.value })}
                        placeholder="Optional admin note…"
                        className="mt-2 min-h-[50px] text-xs"
                      />
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <Button size="sm" onClick={() => approve(s)} disabled={busy === s.id} className="gap-1">
                          {busy === s.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />} Approve
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => reject(s)} disabled={busy === s.id} className="gap-1">
                          <X className="h-3 w-3" /> Reject
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="mt-3 flex items-center justify-between">
                      {s.admin_notes && <p className="text-xs italic text-muted-foreground">"{s.admin_notes}"</p>}
                      <Button size="sm" variant="ghost" onClick={() => remove(s.id)} className="ml-auto text-urgent hover:text-urgent">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            {filtered.length === 0 && <p className="col-span-full py-10 text-center text-sm text-muted-foreground">No {tab} submissions.</p>}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSubmissions;
