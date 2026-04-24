import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Loader2, MapPin, Trash2, Pencil, BadgeCheck } from "lucide-react";
import { toast } from "sonner";

interface MasjidRow {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  district: string | null;
  latitude: number;
  longitude: number;
  imam_name: string | null;
  contact_phone: string | null;
  description: string | null;
  verified: boolean;
  active: boolean;
}

const empty = {
  id: "",
  name: "",
  address: "",
  city: "Kampala",
  district: "",
  latitude: 0.3163,
  longitude: 32.5650,
  imam_name: "",
  contact_phone: "",
  description: "",
  verified: false,
  active: true,
};

const AdminMosques = () => {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<typeof empty>(empty);
  const [saving, setSaving] = useState(false);

  const { data: masjids, isLoading } = useQuery({
    queryKey: ["admin-masjids"],
    queryFn: async () => {
      const { data, error } = await supabase.from("masjids").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as MasjidRow[];
    },
  });

  const startEdit = (m?: MasjidRow) => {
    setForm(m ? { ...empty, ...m, address: m.address ?? "", city: m.city ?? "", district: m.district ?? "", imam_name: m.imam_name ?? "", contact_phone: m.contact_phone ?? "", description: m.description ?? "" } : empty);
    setOpen(true);
  };

  const save = async () => {
    if (!form.name || !form.latitude || !form.longitude) return toast.error("Name and coordinates are required");
    setSaving(true);
    const payload = {
      name: form.name,
      address: form.address || null,
      city: form.city || null,
      district: form.district || null,
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      imam_name: form.imam_name || null,
      contact_phone: form.contact_phone || null,
      description: form.description || null,
      verified: form.verified,
      active: form.active,
    };
    const { error } = form.id
      ? await supabase.from("masjids").update(payload).eq("id", form.id)
      : await supabase.from("masjids").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(form.id ? "Mosque updated" : "Mosque added");
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["admin-masjids"] });
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this mosque? Reviews will also be removed.")) return;
    const { error } = await supabase.from("masjids").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["admin-masjids"] });
  };

  if (isLoading) return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="mt-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{masjids?.length ?? 0} mosques on the map</p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => startEdit()} size="sm" className="gap-1"><Plus className="h-4 w-4" /> Add Mosque</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{form.id ? "Edit Mosque" : "Add Mosque"}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Address</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>City</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
                <div><Label>District</Label><Input value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Latitude *</Label><Input type="number" step="0.000001" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: parseFloat(e.target.value) })} /></div>
                <div><Label>Longitude *</Label><Input type="number" step="0.000001" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: parseFloat(e.target.value) })} /></div>
              </div>
              <p className="text-[11px] text-muted-foreground">Tip: right-click on Google Maps to copy coordinates.</p>
              <div><Label>Imam name</Label><Input value={form.imam_name} onChange={(e) => setForm({ ...form, imam_name: e.target.value })} /></div>
              <div><Label>Contact phone</Label><Input value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} /></div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="flex items-center justify-between rounded-md border p-2"><Label>Verified</Label><Switch checked={form.verified} onCheckedChange={(v) => setForm({ ...form, verified: v })} /></div>
              <div className="flex items-center justify-between rounded-md border p-2"><Label>Active (visible)</Label><Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} /></div>
              <Button onClick={save} disabled={saving} className="w-full">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {masjids?.map((m) => (
          <Card key={m.id}>
            <CardContent className="p-4">
              <div className="flex items-start gap-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"><MapPin className="h-4 w-4" /></div>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1 truncate font-semibold text-foreground">{m.name} {m.verified && <BadgeCheck className="h-3.5 w-3.5 text-primary" />}</p>
                  <p className="truncate text-xs text-muted-foreground">{m.address || m.city}</p>
                  <p className="text-[10px] text-muted-foreground">{m.latitude.toFixed(4)}, {m.longitude.toFixed(4)}</p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button size="sm" variant="outline" onClick={() => startEdit(m)}><Pencil className="h-3 w-3" /> Edit</Button>
                <Button size="sm" variant="outline" onClick={() => remove(m.id)} className="text-urgent hover:text-urgent"><Trash2 className="h-3 w-3" /> Delete</Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {masjids?.length === 0 && <p className="col-span-full py-10 text-center text-sm text-muted-foreground">No mosques yet — add the first one.</p>}
      </div>
    </div>
  );
};

export default AdminMosques;
