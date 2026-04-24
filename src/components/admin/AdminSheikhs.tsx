import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Pencil, Trash2, BadgeCheck, Loader2, Youtube } from "lucide-react";
import { toast } from "sonner";

interface Sheikh {
  id: string;
  name: string;
  title: string | null;
  country: string | null;
  description: string | null;
  image_url: string | null;
  channel_name: string | null;
  channel_url: string;
  subscribers: string | null;
  rank: number;
  verified: boolean;
  active: boolean;
}

const empty = {
  name: "", title: "", country: "", description: "",
  image_url: "", channel_name: "", channel_url: "",
  subscribers: "", rank: 100, verified: false, active: true,
};

const AdminSheikhs = () => {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<typeof empty & { id?: string }>(empty);

  const { data: sheikhs, isLoading } = useQuery({
    queryKey: ["admin-sheikhs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sheikhs")
        .select("*")
        .order("rank", { ascending: true });
      if (error) throw error;
      return data as Sheikh[];
    },
  });

  const reset = () => { setForm(empty); setOpen(false); };

  const save = async () => {
    if (!form.name.trim() || !form.channel_url.trim()) {
      toast.error("Name and YouTube URL are required");
      return;
    }
    const payload = { ...form };
    delete (payload as any).id;
    const { error } = form.id
      ? await supabase.from("sheikhs").update(payload).eq("id", form.id)
      : await supabase.from("sheikhs").insert(payload);
    if (error) return toast.error(error.message);
    toast.success(form.id ? "Sheikh updated" : "Sheikh added");
    qc.invalidateQueries({ queryKey: ["admin-sheikhs"] });
    reset();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this sheikh?")) return;
    const { error } = await supabase.from("sheikhs").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Removed");
    qc.invalidateQueries({ queryKey: ["admin-sheikhs"] });
  };

  const toggle = async (s: Sheikh, field: "active" | "verified") => {
    const patch = field === "active" ? { active: !s.active } : { verified: !s.verified };
    const { error } = await supabase.from("sheikhs").update(patch).eq("id", s.id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin-sheikhs"] });
  };

  if (isLoading) {
    return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="mt-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{sheikhs?.length ?? 0} sheikhs</p>
        <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : reset())}>
          <DialogTrigger asChild>
            <Button onClick={() => setForm(empty)} size="sm" className="gap-1">
              <Plus className="h-4 w-4" /> Add Sheikh
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{form.id ? "Edit" : "Add"} sheikh</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
                <div><Label>Country</Label><Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} /></div>
                <div><Label>Subscribers (e.g. 1.2M)</Label><Input value={form.subscribers} onChange={(e) => setForm({ ...form, subscribers: e.target.value })} /></div>
                <div><Label>Channel name</Label><Input value={form.channel_name} onChange={(e) => setForm({ ...form, channel_name: e.target.value })} /></div>
                <div><Label>Rank</Label><Input type="number" value={form.rank} onChange={(e) => setForm({ ...form, rank: Number(e.target.value) })} /></div>
              </div>
              <div><Label>YouTube URL *</Label><Input value={form.channel_url} onChange={(e) => setForm({ ...form, channel_url: e.target.value })} placeholder="https://youtube.com/@channel" /></div>
              <div><Label>Profile image URL</Label><Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} /></div>
              <div><Label>Description</Label><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm"><Switch checked={form.verified} onCheckedChange={(v) => setForm({ ...form, verified: v })} /> Verified</label>
                <label className="flex items-center gap-2 text-sm"><Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} /> Active</label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={reset}>Cancel</Button>
              <Button onClick={save}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sheikhs?.map((s) => (
          <Card key={s.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {s.image_url && <img src={s.image_url} alt={s.name} className="h-full w-full object-cover" loading="lazy" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <p className="truncate font-semibold text-foreground">{s.name}</p>
                    {s.verified && <BadgeCheck className="h-4 w-4 shrink-0 text-primary" />}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{s.title ?? "—"}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1">
                    <Badge variant="outline" className="text-[10px]">#{s.rank}</Badge>
                    {s.country && <Badge variant="secondary" className="text-[10px]">{s.country}</Badge>}
                    <Badge variant={s.active ? "default" : "outline"} className="text-[10px]">
                      {s.active ? "Live" : "Hidden"}
                    </Badge>
                  </div>
                </div>
              </div>
              <a href={s.channel_url} target="_blank" rel="noopener noreferrer" className="mt-3 flex items-center gap-1 text-xs text-primary hover:underline">
                <Youtube className="h-3 w-3 text-destructive" /> {s.channel_name || "Visit channel"}
              </a>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => { setForm({ ...empty, ...s }); setOpen(true); }}>
                  <Pencil className="h-3 w-3" /> Edit
                </Button>
                <Button size="sm" variant="outline" onClick={() => toggle(s, "active")}>
                  {s.active ? "Hide" : "Show"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => remove(s.id)} className="text-destructive">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {sheikhs?.length === 0 && (
          <p className="col-span-full py-10 text-center text-sm text-muted-foreground">No sheikhs yet — add the first one.</p>
        )}
      </div>
    </div>
  );
};

export default AdminSheikhs;
