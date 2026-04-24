import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Loader2, Tv, Radio } from "lucide-react";
import { toast } from "sonner";

interface TvItem {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  type: string;
  platform: string;
  is_live: boolean;
  scheduled_at: string | null;
  sort_order: number;
  active: boolean;
}

const empty = {
  id: "",
  title: "",
  description: "",
  video_url: "",
  thumbnail_url: "",
  type: "video",
  platform: "youtube",
  is_live: false,
  scheduled_at: "",
  sort_order: 0,
  active: true,
};

const AdminTv = () => {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<typeof empty>(empty);
  const [saving, setSaving] = useState(false);

  const { data: items, isLoading } = useQuery({
    queryKey: ["admin-tv"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tv_content").select("*").order("sort_order").order("created_at", { ascending: false });
      if (error) throw error;
      return data as TvItem[];
    },
  });

  const startNew = () => { setForm(empty); setOpen(true); };
  const startEdit = (i: TvItem) => {
    setForm({
      id: i.id,
      title: i.title,
      description: i.description ?? "",
      video_url: i.video_url,
      thumbnail_url: i.thumbnail_url ?? "",
      type: i.type,
      platform: i.platform,
      is_live: i.is_live,
      scheduled_at: i.scheduled_at ?? "",
      sort_order: i.sort_order,
      active: i.active,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.title || !form.video_url) return toast.error("Title and video URL are required");
    setSaving(true);
    const payload: any = {
      title: form.title,
      description: form.description || null,
      video_url: form.video_url,
      thumbnail_url: form.thumbnail_url || null,
      type: form.type,
      platform: form.platform,
      is_live: form.is_live,
      scheduled_at: form.scheduled_at || null,
      sort_order: Number(form.sort_order) || 0,
      active: form.active,
    };
    const { error } = form.id
      ? await supabase.from("tv_content").update(payload).eq("id", form.id)
      : await supabase.from("tv_content").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(form.id ? "Updated" : "Added");
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["admin-tv"] });
    qc.invalidateQueries({ queryKey: ["tv-content"] });
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this video?")) return;
    const { error } = await supabase.from("tv_content").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["admin-tv"] });
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-display text-xl">UmmahLink TV</CardTitle>
        <Button variant="hero" size="sm" className="gap-2" onClick={startNew}><Plus className="h-4 w-4" /> Add Video / Live</Button>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items?.map((i) => (
            <Card key={i.id} className="overflow-hidden">
              {i.thumbnail_url && <img src={i.thumbnail_url} alt={i.title} loading="lazy" className="h-32 w-full object-cover" />}
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-foreground">{i.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{i.platform}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {i.is_live && <Badge className="gap-1 bg-urgent text-urgent-foreground text-[10px]"><Radio className="h-3 w-3" /> LIVE</Badge>}
                    <Badge variant={i.active ? "default" : "outline"} className="text-[10px]">{i.active ? "Active" : "Hidden"}</Badge>
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-1">
                  <Button size="sm" variant="outline" onClick={() => startEdit(i)}><Pencil className="h-3 w-3" /> Edit</Button>
                  <Button size="sm" variant="outline" onClick={() => remove(i.id)} className="text-urgent hover:text-urgent"><Trash2 className="h-3 w-3" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {items?.length === 0 && (
            <p className="col-span-full py-10 text-center text-sm text-muted-foreground">No TV content yet.</p>
          )}
        </div>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader><DialogTitle>{form.id ? "Edit Item" : "New Video / Live"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>Video URL * (YouTube, Facebook…)</Label><Input value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} placeholder="https://youtube.com/watch?v=… or live/…" /></div>
            <div><Label>Thumbnail URL (optional, auto from YouTube)</Label><Input value={form.thumbnail_url} onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })} /></div>
            <div><Label>Description</Label><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Platform</Label>
                <select value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="youtube">YouTube</option>
                  <option value="facebook">Facebook</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <Label>Type</Label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="video">Video</option>
                  <option value="lecture">Lecture</option>
                  <option value="khutbah">Khutbah</option>
                  <option value="recitation">Recitation</option>
                </select>
              </div>
              <div><Label>Scheduled At</Label><Input type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} /></div>
              <div><Label>Sort Order</Label><Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} /></div>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_live} onChange={(e) => setForm({ ...form, is_live: e.target.checked })} /> Mark as LIVE</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Active</label>
            </div>
            <Button onClick={save} disabled={saving} className="w-full">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : form.id ? "Update" : "Create"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default AdminTv;
