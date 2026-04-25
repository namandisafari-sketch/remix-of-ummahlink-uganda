import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMyOperator } from "@/hooks/useMyOperator";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Plus, Trash2, Edit3, Package as PackageIcon } from "lucide-react";
import { fmtUgxFull } from "@/lib/format";
import { toast } from "sonner";

const emptyPackage = {
  name: "", type: "umrah", tier: "standard",
  price_ugx: 0, duration_days: 14, departure_month: "", departure_date: "",
  hotel_makkah: "", hotel_madinah: "", description: "",
  includes: [] as string[], seats_available: null as number | null,
  image_url: "", active: true,
};

const OperatorPackages = () => {
  const { data: operator } = useMyOperator();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(emptyPackage);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [includesInput, setIncludesInput] = useState("");

  const { data: packages, isLoading } = useQuery({
    queryKey: ["my-packages", operator?.id],
    enabled: !!operator?.id,
    queryFn: async () => {
      const { data, error } = await supabase.from("tour_packages").select("*").eq("operator_id", operator!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const openNew = () => {
    setForm(emptyPackage);
    setIncludesInput("");
    setEditingId(null);
    setOpen(true);
  };

  const openEdit = (p: any) => {
    setForm({ ...emptyPackage, ...p });
    setIncludesInput((p.includes ?? []).join(", "));
    setEditingId(p.id);
    setOpen(true);
  };

  const save = async () => {
    if (!operator) return;
    if (!form.name.trim()) return toast.error("Package name required");
    const includes = includesInput.split(",").map((s: string) => s.trim()).filter(Boolean);
    const payload: any = {
      ...form,
      includes,
      price_ugx: Number(form.price_ugx) || 0,
      duration_days: form.duration_days ? Number(form.duration_days) : null,
      seats_available: form.seats_available ? Number(form.seats_available) : null,
      departure_date: form.departure_date || null,
      operator_id: operator.id,
    };
    const { error } = editingId
      ? await supabase.from("tour_packages").update(payload).eq("id", editingId)
      : await supabase.from("tour_packages").insert(payload);
    if (error) return toast.error(error.message);
    toast.success(editingId ? "Package updated" : "Package added");
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["my-packages", operator.id] });
  };

  const del = async (id: string) => {
    if (!confirm("Delete this package? Bookings linked to it will keep their data.")) return;
    const { error } = await supabase.from("tour_packages").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["my-packages", operator!.id] });
  };

  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Packages</h1>
          <p className="text-sm text-muted-foreground">{packages?.length ?? 0} packages</p>
        </div>
        <Button onClick={openNew}><Plus className="mr-1 h-4 w-4" />Add package</Button>
      </div>

      {packages?.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-sm text-muted-foreground">
          <PackageIcon className="mx-auto mb-2 h-10 w-10 text-muted-foreground/50" />
          No packages yet. Add your first one.
        </CardContent></Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {packages?.map((p: any) => (
            <Card key={p.id}>
              <CardContent className="p-4">
                <p className="font-semibold">{p.name}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  <Badge>{p.type.toUpperCase()}</Badge>
                  <Badge variant="outline" className="capitalize">{p.tier}</Badge>
                  {p.departure_month && <Badge variant="outline">{p.departure_month}</Badge>}
                  {!p.active && <Badge variant="secondary">Hidden</Badge>}
                </div>
                <p className="mt-2 font-bold text-primary">{fmtUgxFull(p.price_ugx)}</p>
                {p.seats_available !== null && <p className="text-xs text-muted-foreground">{p.seats_available} seats</p>}
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => openEdit(p)}><Edit3 className="mr-1 h-3 w-3" />Edit</Button>
                  <Button size="sm" variant="outline" className="text-destructive" onClick={() => del(p.id)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader><DialogTitle>{editingId ? "Edit package" : "New package"}</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <Field label="Package name *" v={form.name} onChange={(v: any) => setForm({ ...form, name: v })} />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hajj">Hajj</SelectItem>
                    <SelectItem value="umrah">Umrah</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Tier</Label>
                <Select value={form.tier} onValueChange={(v) => setForm({ ...form, tier: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="economy">Economy</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="vip">VIP</SelectItem>
                    <SelectItem value="family">Family</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Price (UGX) *" v={form.price_ugx} onChange={(v: any) => setForm({ ...form, price_ugx: v })} type="number" />
              <Field label="Duration (days)" v={form.duration_days} onChange={(v: any) => setForm({ ...form, duration_days: v })} type="number" />
              <Field label="Departure month" v={form.departure_month} onChange={(v: any) => setForm({ ...form, departure_month: v })} placeholder="e.g. Mar" />
              <Field label="Departure date" v={form.departure_date} onChange={(v: any) => setForm({ ...form, departure_date: v })} type="date" />
              <Field label="Seats available" v={form.seats_available ?? ""} onChange={(v: any) => setForm({ ...form, seats_available: v })} type="number" />
              <Field label="Image URL" v={form.image_url} onChange={(v: any) => setForm({ ...form, image_url: v })} placeholder="https://..." />
              <Field label="Hotel in Makkah" v={form.hotel_makkah} onChange={(v: any) => setForm({ ...form, hotel_makkah: v })} />
              <Field label="Hotel in Madinah" v={form.hotel_madinah} onChange={(v: any) => setForm({ ...form, hotel_madinah: v })} />
            </div>
            <div>
              <Label className="text-xs">Includes (comma-separated)</Label>
              <Input value={includesInput} onChange={(e) => setIncludesInput(e.target.value)} placeholder="Visa, Flight, Transport, Meals" />
            </div>
            <div>
              <Label className="text-xs">Description</Label>
              <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <Button onClick={save}>{editingId ? "Save changes" : "Add package"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const Field = ({ label, v, onChange, type = "text", placeholder }: any) => (
  <div>
    <Label className="text-xs">{label}</Label>
    <Input type={type} value={v} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
  </div>
);

export default OperatorPackages;
