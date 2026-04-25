import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search, Plus, Phone, MessageCircle, Briefcase, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserLocation } from "@/hooks/useUserLocation";
import { toast } from "sonner";

const CATEGORIES = [
  { value: "quran_tutor", label: "Qur'an Tutor" },
  { value: "tutor", label: "Academic Tutor" },
  { value: "tailor", label: "Tailor" },
  { value: "carpenter", label: "Carpenter" },
  { value: "mechanic", label: "Mechanic" },
  { value: "medical", label: "Medical / Nursing" },
  { value: "beauty", label: "Beauty / Henna" },
  { value: "tech", label: "Tech / Repairs" },
  { value: "other", label: "Other" },
];

const SkillExchangePage = () => {
  const { user } = useAuth();
  const { data: loc } = useUserLocation();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [open, setOpen] = useState(false);

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ["skills", category, loc?.district],
    queryFn: async () => {
      let q = supabase.from("skill_listings").select("*").eq("active", true).order("created_at", { ascending: false }).limit(80);
      if (category !== "all") q = q.eq("category", category);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const filtered = listings.filter((l: any) => {
    if (search) {
      const blob = [l.title, l.description, l.parish, l.district].filter(Boolean).join(" ").toLowerCase();
      if (!blob.includes(search.toLowerCase())) return false;
    }
    return true;
  });

  return (
    <div className="px-4 py-4 md:px-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-bold">Skill Exchange</h1>
          <p className="text-xs text-muted-foreground">Find local skills · Offer yours</p>
        </div>
        {user && <NewListingDialog open={open} setOpen={setOpen} loc={loc ?? null} onCreated={() => qc.invalidateQueries({ queryKey: ["skills"] })} />}
      </div>

      <div className="mb-3 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {isLoading && <p className="col-span-full text-center text-sm text-muted-foreground py-8">Loading…</p>}
        {!isLoading && filtered.length === 0 && (
          <div className="col-span-full rounded-2xl border bg-card p-8 text-center text-sm text-muted-foreground">
            <Briefcase className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
            No listings yet.
          </div>
        )}
        {filtered.map((l: any, i: number) => {
          const cat = CATEGORIES.find((c) => c.value === l.category);
          return (
            <motion.div key={l.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="overflow-hidden rounded-2xl border bg-card shadow-sm">
              {l.image_url && <img src={l.image_url} alt={l.title} className="h-28 w-full object-cover" />}
              <div className="p-3">
                <div className="flex flex-wrap items-center gap-1">
                  <Badge variant="secondary" className="text-[10px]">{cat?.label ?? l.category}</Badge>
                  {l.parish && <Badge variant="outline" className="text-[10px]">{l.parish}</Badge>}
                </div>
                <h3 className="mt-1.5 font-semibold text-sm">{l.title}</h3>
                {l.description && <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{l.description}</p>}
                {l.price_text && <p className="mt-1 text-xs font-medium text-primary">{l.price_text}</p>}
                <div className="mt-2 flex gap-1.5">
                  {l.contact_phone && (
                    <a href={`tel:${l.contact_phone}`}>
                      <Button size="sm" variant="outline" className="h-7 gap-1 text-[11px]"><Phone className="h-3 w-3" /> Call</Button>
                    </a>
                  )}
                  {l.whatsapp && (
                    <a href={`https://wa.me/${l.whatsapp.replace(/[^0-9]/g, "")}`} target="_blank" rel="noreferrer">
                      <Button size="sm" variant="outline" className="h-7 gap-1 text-[11px]"><MessageCircle className="h-3 w-3" /> Chat</Button>
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

const NewListingDialog = ({ open, setOpen, loc, onCreated }: any) => {
  const { user } = useAuth();
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "other",
    price_text: "",
    contact_phone: "",
    whatsapp: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const m = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sign in required");
      let image_url: string | null = null;
      if (file) {
        setUploading(true);
        const path = `${user.id}/skill-${Date.now()}-${file.name}`;
        const { error: upErr } = await supabase.storage.from("community").upload(path, file);
        if (upErr) throw upErr;
        image_url = supabase.storage.from("community").getPublicUrl(path).data.publicUrl;
      }
      const { error } = await supabase.from("skill_listings").insert({
        user_id: user.id,
        title: form.title,
        description: form.description || null,
        category: form.category,
        price_text: form.price_text || null,
        contact_phone: form.contact_phone || null,
        whatsapp: form.whatsapp || null,
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
      toast.success("Listing published");
      setOpen(false);
      setForm({ title: "", description: "", category: "other", price_text: "", contact_phone: "", whatsapp: "" });
      setFile(null);
      onCreated();
    },
    onError: (e: any) => toast.error(e.message),
    onSettled: () => setUploading(false),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> List skill</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Offer your skill</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Title</Label>
            <Input className="mt-1.5" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Qur'an memorization tutor" />
          </div>
          <div>
            <Label>Category</Label>
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea className="mt-1.5" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <Label>Price (text)</Label>
            <Input className="mt-1.5" value={form.price_text} onChange={(e) => setForm({ ...form, price_text: e.target.value })} placeholder="UGX 20,000/hour or Free / Negotiable" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Phone</Label>
              <Input className="mt-1.5" value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} placeholder="07xx" />
            </div>
            <div>
              <Label>WhatsApp</Label>
              <Input className="mt-1.5" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="+2567…" />
            </div>
          </div>
          <div>
            <Label className="flex items-center gap-2"><ImagePlus className="h-4 w-4" /> Photo (optional)</Label>
            <Input className="mt-1.5" type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => m.mutate()} disabled={!form.title || m.isPending || uploading}>
            {m.isPending || uploading ? "Saving…" : "Publish"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SkillExchangePage;
