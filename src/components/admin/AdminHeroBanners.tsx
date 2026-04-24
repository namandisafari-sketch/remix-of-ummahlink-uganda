import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Loader2, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  badge: string | null;
  cta_label: string | null;
  cta_link: string | null;
  image_url: string | null;
  variant: string;
  active: boolean;
  sort_order: number;
}

const empty = {
  title: "", subtitle: "", badge: "", cta_label: "", cta_link: "",
  image_url: "", variant: "emerald", active: true, sort_order: 0,
};

const AdminHeroBanners = () => {
  const [items, setItems] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("hero_banners").select("*").order("sort_order", { ascending: true });
    if (error) toast({ title: "Failed to load", description: error.message, variant: "destructive" });
    setItems(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null); setForm(empty); setOpen(true);
  };

  const openEdit = (b: Banner) => {
    setEditing(b);
    setForm({
      title: b.title, subtitle: b.subtitle ?? "", badge: b.badge ?? "",
      cta_label: b.cta_label ?? "", cta_link: b.cta_link ?? "",
      image_url: b.image_url ?? "", variant: b.variant, active: b.active, sort_order: b.sort_order,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.title.trim()) {
      toast({ title: "Title required", variant: "destructive" }); return;
    }
    setSaving(true);
    const payload = {
      title: form.title,
      subtitle: form.subtitle || null,
      badge: form.badge || null,
      cta_label: form.cta_label || null,
      cta_link: form.cta_link || null,
      image_url: form.image_url || null,
      variant: form.variant,
      active: form.active,
      sort_order: Number(form.sort_order) || 0,
    };
    const { error } = editing
      ? await supabase.from("hero_banners").update(payload).eq("id", editing.id)
      : await supabase.from("hero_banners").insert(payload);
    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" }); return;
    }
    toast({ title: editing ? "Banner updated" : "Banner created" });
    setOpen(false); load();
  };

  const toggleActive = async (b: Banner) => {
    const { error } = await supabase.from("hero_banners").update({ active: !b.active }).eq("id", b.id);
    if (error) toast({ title: "Update failed", description: error.message, variant: "destructive" });
    else load();
  };

  const remove = async (b: Banner) => {
    if (!confirm(`Delete banner "${b.title}"?`)) return;
    const { error } = await supabase.from("hero_banners").delete().eq("id", b.id);
    if (error) toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    else { toast({ title: "Banner deleted" }); load(); }
  };

  return (
    <div className="mt-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Manage homepage hero slides — news, updates and campaigns.</p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> New Banner</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Banner" : "Create Banner"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3">
              <div>
                <Label>Title *</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <Label>Subtitle</Label>
                <Textarea value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Badge</Label>
                  <Input placeholder="New, Update..." value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })} />
                </div>
                <div>
                  <Label>Variant</Label>
                  <Select value={form.variant} onValueChange={(v) => setForm({ ...form, variant: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="emerald">Emerald</SelectItem>
                      <SelectItem value="gold">Gold</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>CTA Label</Label>
                  <Input value={form.cta_label} onChange={(e) => setForm({ ...form, cta_label: e.target.value })} />
                </div>
                <div>
                  <Label>CTA Link</Label>
                  <Input placeholder="/donations" value={form.cta_link} onChange={(e) => setForm({ ...form, cta_link: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Image URL (optional)</Label>
                <Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 items-center gap-3">
                <div>
                  <Label>Sort Order</Label>
                  <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
                  <Label>Active</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={save} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No banners yet. Create one to feature it on the homepage.
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((b) => (
            <div key={b.id} className="flex items-start justify-between gap-3 rounded-lg border bg-card p-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-display font-semibold text-foreground">{b.title}</span>
                  {b.badge && <Badge variant="secondary">{b.badge}</Badge>}
                  <Badge variant="outline" className="text-xs capitalize">{b.variant}</Badge>
                  <span className="text-xs text-muted-foreground">#{b.sort_order}</span>
                  {!b.active && <Badge variant="outline" className="text-xs">Hidden</Badge>}
                </div>
                {b.subtitle && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{b.subtitle}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button size="icon" variant="ghost" onClick={() => toggleActive(b)} aria-label="Toggle">
                  {b.active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </Button>
                <Button size="icon" variant="ghost" onClick={() => openEdit(b)} aria-label="Edit">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => remove(b)} aria-label="Delete">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminHeroBanners;
