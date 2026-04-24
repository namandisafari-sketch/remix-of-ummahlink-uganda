import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Loader2, Upload, Image as ImageIcon, Video, X, MapPin } from "lucide-react";
import { toast } from "sonner";

const formatUGX = (amount: number) =>
  amount >= 1000000 ? `UGX ${(amount / 1000000).toFixed(1)}M` : `UGX ${(amount / 1000).toFixed(0)}K`;

interface Project {
  id: string;
  name: string;
  mosque: string;
  description: string | null;
  goal: number;
  raised: number;
  active: boolean;
  image_url: string | null;
  gallery: string[] | null;
  video_links: string[] | null;
  location: string | null;
  beneficiaries: number | null;
  deadline: string | null;
  category: string | null;
}

const empty = {
  id: "",
  name: "",
  mosque: "",
  description: "",
  goal: 1000000,
  image_url: "",
  gallery: [] as string[],
  video_links: [] as string[],
  location: "",
  beneficiaries: 0,
  deadline: "",
  category: "Construction",
  active: true,
};

const AdminProjects = () => {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<typeof empty>(empty);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [newGalleryUrl, setNewGalleryUrl] = useState("");
  const [newVideoUrl, setNewVideoUrl] = useState("");

  const { data: projects, isLoading } = useQuery({
    queryKey: ["admin-projects"],
    queryFn: async () => {
      const { data, error } = await supabase.from("mosque_projects").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Project[];
    },
  });

  const startNew = () => { setForm(empty); setOpen(true); };
  const startEdit = (p: Project) => {
    setForm({
      id: p.id,
      name: p.name,
      mosque: p.mosque,
      description: p.description ?? "",
      goal: p.goal,
      image_url: p.image_url ?? "",
      gallery: p.gallery ?? [],
      video_links: p.video_links ?? [],
      location: p.location ?? "",
      beneficiaries: p.beneficiaries ?? 0,
      deadline: p.deadline ?? "",
      category: p.category ?? "Construction",
      active: p.active,
    });
    setOpen(true);
  };

  const handleFileUpload = async (file: File, target: "main" | "gallery") => {
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("project-media").upload(path, file, { upsert: false });
    if (error) {
      setUploading(false);
      return toast.error(error.message);
    }
    const { data } = supabase.storage.from("project-media").getPublicUrl(path);
    setUploading(false);
    if (target === "main") setForm((f) => ({ ...f, image_url: data.publicUrl }));
    else setForm((f) => ({ ...f, gallery: [...f.gallery, data.publicUrl] }));
    toast.success("Image uploaded");
  };

  const save = async () => {
    if (!form.name || !form.mosque || !form.goal) return toast.error("Name, mosque, and goal are required");
    setSaving(true);
    const payload: any = {
      name: form.name,
      mosque: form.mosque,
      description: form.description || null,
      goal: Number(form.goal),
      image_url: form.image_url || null,
      gallery: form.gallery,
      video_links: form.video_links,
      location: form.location || null,
      beneficiaries: form.beneficiaries ? Number(form.beneficiaries) : null,
      deadline: form.deadline || null,
      category: form.category || null,
      active: form.active,
    };
    const { error } = form.id
      ? await supabase.from("mosque_projects").update(payload).eq("id", form.id)
      : await supabase.from("mosque_projects").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(form.id ? "Project updated" : "Project created");
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["admin-projects"] });
    qc.invalidateQueries({ queryKey: ["mosque-projects"] });
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this project?")) return;
    const { error } = await supabase.from("mosque_projects").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["admin-projects"] });
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-display text-xl">Mosque Projects</CardTitle>
        <Button variant="hero" size="sm" className="gap-2" onClick={startNew}><Plus className="h-4 w-4" /> Add Project</Button>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {projects?.map((p) => {
            const pct = p.goal > 0 ? Math.round((p.raised / p.goal) * 100) : 0;
            return (
              <Card key={p.id} className="overflow-hidden">
                {p.image_url && <img src={p.image_url} alt={p.name} className="h-32 w-full object-cover" loading="lazy" />}
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground">{p.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{p.mosque}</p>
                    </div>
                    <Badge variant={p.active ? "default" : "outline"} className="text-[10px]">{p.active ? "Active" : "Inactive"}</Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1 text-[10px] text-muted-foreground">
                    {p.category && <Badge variant="outline">{p.category}</Badge>}
                    {(p.gallery?.length ?? 0) > 0 && <span className="flex items-center gap-0.5"><ImageIcon className="h-3 w-3" /> {p.gallery!.length}</span>}
                    {(p.video_links?.length ?? 0) > 0 && <span className="flex items-center gap-0.5"><Video className="h-3 w-3" /> {p.video_links!.length}</span>}
                  </div>
                  <Progress value={Math.min(pct, 100)} className="mt-2 h-1.5" />
                  <p className="mt-1 text-[11px] text-muted-foreground">{formatUGX(p.raised)} / {formatUGX(p.goal)}</p>
                  <div className="mt-2 grid grid-cols-2 gap-1">
                    <Button size="sm" variant="outline" onClick={() => startEdit(p)}><Pencil className="h-3 w-3" /> Edit</Button>
                    <Button size="sm" variant="outline" onClick={() => remove(p.id)} className="text-urgent hover:text-urgent"><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader><DialogTitle>{form.id ? "Edit Project" : "New Project"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div><Label>Project Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Mosque *</Label><Input value={form.mosque} onChange={(e) => setForm({ ...form, mosque: e.target.value })} /></div>
              <div><Label>Category</Label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option>Construction</option><option>Renovation</option><option>Equipment</option><option>Education</option><option>Welfare</option><option>Other</option>
                </select>
              </div>
              <div><Label>Location <MapPin className="inline h-3 w-3" /></Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Kibuli, Kampala" /></div>
              <div><Label>Goal (UGX) *</Label><Input type="number" value={form.goal} onChange={(e) => setForm({ ...form, goal: Number(e.target.value) })} /></div>
              <div><Label>Beneficiaries</Label><Input type="number" value={form.beneficiaries} onChange={(e) => setForm({ ...form, beneficiaries: Number(e.target.value) })} /></div>
              <div><Label>Deadline</Label><Input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} /></div>
              <div className="flex items-end"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Active</label></div>
            </div>

            <div><Label>Description</Label><Textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the project, its purpose, and impact…" /></div>

            {/* Main image */}
            <div>
              <Label>Cover Image</Label>
              <div className="mt-1 flex items-center gap-2">
                {form.image_url ? (
                  <div className="relative h-24 w-32 overflow-hidden rounded border">
                    <img src={form.image_url} alt="cover" className="h-full w-full object-cover" />
                    <button type="button" onClick={() => setForm({ ...form, image_url: "" })} className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white"><X className="h-3 w-3" /></button>
                  </div>
                ) : (
                  <div className="flex h-24 w-32 items-center justify-center rounded border border-dashed text-xs text-muted-foreground">No image</div>
                )}
                <div className="flex flex-col gap-1">
                  <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], "main")} />
                  <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading} className="gap-1">
                    {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />} Upload
                  </Button>
                  <Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="…or paste image URL" className="text-xs" />
                </div>
              </div>
            </div>

            {/* Gallery */}
            <div>
              <Label>Gallery (extra images)</Label>
              <div className="mt-1 flex flex-wrap gap-2">
                {form.gallery.map((url, i) => (
                  <div key={i} className="relative h-16 w-16 overflow-hidden rounded border">
                    <img src={url} alt="" className="h-full w-full object-cover" />
                    <button type="button" onClick={() => setForm({ ...form, gallery: form.gallery.filter((_, idx) => idx !== i) })} className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white"><X className="h-2.5 w-2.5" /></button>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex gap-1">
                <Input value={newGalleryUrl} onChange={(e) => setNewGalleryUrl(e.target.value)} placeholder="Paste image URL" className="text-xs" />
                <Button type="button" size="sm" variant="outline" onClick={() => { if (newGalleryUrl) { setForm({ ...form, gallery: [...form.gallery, newGalleryUrl] }); setNewGalleryUrl(""); } }}>Add</Button>
              </div>
            </div>

            {/* Video links */}
            <div>
              <Label>Video Links (YouTube, Vimeo…)</Label>
              <div className="mt-1 space-y-1">
                {form.video_links.map((v, i) => (
                  <div key={i} className="flex items-center gap-1 rounded border bg-muted/50 px-2 py-1 text-xs">
                    <Video className="h-3 w-3 text-primary" />
                    <span className="flex-1 truncate">{v}</span>
                    <button type="button" onClick={() => setForm({ ...form, video_links: form.video_links.filter((_, idx) => idx !== i) })}><X className="h-3 w-3" /></button>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex gap-1">
                <Input value={newVideoUrl} onChange={(e) => setNewVideoUrl(e.target.value)} placeholder="https://youtube.com/watch?v=…" className="text-xs" />
                <Button type="button" size="sm" variant="outline" onClick={() => { if (newVideoUrl) { setForm({ ...form, video_links: [...form.video_links, newVideoUrl] }); setNewVideoUrl(""); } }}>Add</Button>
              </div>
            </div>

            <Button onClick={save} disabled={saving} className="w-full">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : form.id ? "Update Project" : "Create Project"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default AdminProjects;
