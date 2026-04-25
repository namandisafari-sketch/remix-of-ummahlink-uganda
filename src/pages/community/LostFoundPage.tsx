import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search, Plus, Phone, CheckCircle2, MapPin, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserLocation } from "@/hooks/useUserLocation";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const CATEGORIES = ["phone", "wallet", "document", "child", "pet", "clothing", "keys", "other"];

const LostFoundPage = () => {
  const { user } = useAuth();
  const { data: loc } = useUserLocation();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"lost" | "found">("lost");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["lf-items", tab, loc?.parish, loc?.district],
    queryFn: async () => {
      let q = supabase
        .from("lost_found_items")
        .select("*")
        .eq("kind", tab)
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(60);

      // Prioritise parish/district scope
      if (loc?.district) q = q.or(`district.eq.${loc.district},parish.eq.${loc.parish ?? "__none__"}`);

      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const filtered = search
    ? items.filter((i: any) =>
        [i.title, i.description, i.location_text, i.category].filter(Boolean).join(" ").toLowerCase().includes(search.toLowerCase())
      )
    : items;

  return (
    <div className="px-4 py-4 md:px-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-bold">Lost &amp; Found</h1>
          <p className="text-xs text-muted-foreground">Parish-scoped board · Reunite belongings</p>
        </div>
        {user && <NewItemDialog open={open} setOpen={setOpen} defaultKind={tab} loc={loc ?? null} onCreated={() => qc.invalidateQueries({ queryKey: ["lf-items"] })} />}
      </div>

      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as "lost" | "found")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="lost">🔎 Lost</TabsTrigger>
          <TabsTrigger value="found">🎯 Found</TabsTrigger>
        </TabsList>
        <TabsContent value={tab} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {isLoading && <p className="col-span-full text-center text-sm text-muted-foreground py-8">Loading…</p>}
          {!isLoading && filtered.length === 0 && (
            <div className="col-span-full rounded-2xl border bg-card p-8 text-center text-sm text-muted-foreground">
              Nothing here yet.
            </div>
          )}
          {filtered.map((item: any, i: number) => (
            <motion.div key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <ItemCard item={item} onResolve={() => qc.invalidateQueries({ queryKey: ["lf-items"] })} />
            </motion.div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

const ItemCard = ({ item, onResolve }: { item: any; onResolve: () => void }) => {
  const { user } = useAuth();
  const isOwner = user?.id === item.user_id;

  const markResolved = async () => {
    const { error } = await supabase.from("lost_found_items").update({ status: "resolved" }).eq("id", item.id);
    if (error) toast.error(error.message);
    else { toast.success("Marked as resolved"); onResolve(); }
  };

  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      {item.image_url ? (
        <img src={item.image_url} alt={item.title} className="h-32 w-full object-cover" />
      ) : (
        <div className="flex h-32 w-full items-center justify-center bg-muted text-muted-foreground">
          <Search className="h-8 w-8" />
        </div>
      )}
      <div className="p-3">
        <div className="flex flex-wrap items-center gap-1">
          <Badge variant="secondary" className="text-[10px]">{item.category ?? "Other"}</Badge>
          {item.parish && <Badge variant="outline" className="text-[10px]">{item.parish}</Badge>}
        </div>
        <h3 className="mt-1.5 font-semibold text-sm">{item.title}</h3>
        {item.description && <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{item.description}</p>}
        {item.location_text && (
          <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
            <MapPin className="h-3 w-3" /> {item.location_text}
          </p>
        )}
        <p className="mt-1 text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}</p>
        <div className="mt-2 flex gap-1.5">
          {item.contact_phone && (
            <a href={`tel:${item.contact_phone}`}>
              <Button size="sm" variant="outline" className="h-7 gap-1 text-[11px]">
                <Phone className="h-3 w-3" /> Call
              </Button>
            </a>
          )}
          {isOwner && (
            <Button size="sm" variant="ghost" className="h-7 gap-1 text-[11px]" onClick={markResolved}>
              <CheckCircle2 className="h-3 w-3" /> Resolve
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

const NewItemDialog = ({ open, setOpen, defaultKind, loc, onCreated }: any) => {
  const { user } = useAuth();
  const [form, setForm] = useState({
    kind: defaultKind,
    category: "phone",
    title: "",
    description: "",
    location_text: "",
    contact_phone: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const m = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sign in required");
      let image_url: string | null = null;
      if (file) {
        setUploading(true);
        const path = `${user.id}/lf-${Date.now()}-${file.name}`;
        const { error: upErr } = await supabase.storage.from("community").upload(path, file);
        if (upErr) throw upErr;
        image_url = supabase.storage.from("community").getPublicUrl(path).data.publicUrl;
      }
      const { error } = await supabase.from("lost_found_items").insert({
        user_id: user.id,
        kind: form.kind,
        category: form.category,
        title: form.title,
        description: form.description || null,
        location_text: form.location_text || null,
        contact_phone: form.contact_phone || null,
        image_url,
        region: loc?.region ?? null,
        district: loc?.district ?? null,
        constituency: loc?.constituency ?? null,
        subcounty: loc?.subcounty ?? null,
        parish: loc?.parish ?? null,
        village: loc?.village ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Posted");
      setOpen(false);
      setForm((f) => ({ ...f, title: "", description: "", location_text: "" }));
      setFile(null);
      onCreated();
    },
    onError: (e: any) => toast.error(e.message),
    onSettled: () => setUploading(false),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> Post</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Report lost or found item</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Type</Label>
              <Select value={form.kind} onValueChange={(v) => setForm({ ...form, kind: v as any })}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="lost">I lost something</SelectItem>
                  <SelectItem value="found">I found something</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Title</Label>
            <Input className="mt-1.5" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Black wallet near Old Kampala" />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea className="mt-1.5" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <Label>Where</Label>
            <Input className="mt-1.5" value={form.location_text} onChange={(e) => setForm({ ...form, location_text: e.target.value })} placeholder="Mosque entrance, market…" />
          </div>
          <div>
            <Label>Contact phone</Label>
            <Input className="mt-1.5" value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} placeholder="07xx" />
          </div>
          <div>
            <Label className="flex items-center gap-2"><ImagePlus className="h-4 w-4" /> Photo (optional)</Label>
            <Input className="mt-1.5" type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => m.mutate()} disabled={!form.title || m.isPending || uploading}>
            {m.isPending || uploading ? "Posting…" : "Post"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LostFoundPage;
