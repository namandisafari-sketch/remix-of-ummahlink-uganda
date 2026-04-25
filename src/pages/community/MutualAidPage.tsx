import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { HeartHandshake, Plus, Phone, MessageCircle, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserLocation } from "@/hooks/useUserLocation";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const CATEGORIES = [
  { value: "ride", label: "Ride / Transport" },
  { value: "meal", label: "Meal / Food" },
  { value: "blood", label: "Blood Donation" },
  { value: "medical", label: "Medical Help" },
  { value: "financial", label: "Financial" },
  { value: "childcare", label: "Childcare" },
  { value: "general", label: "General" },
];

const SCOPES = [
  { value: "village", label: "My village" },
  { value: "parish", label: "My parish" },
  { value: "subcounty", label: "My subcounty" },
  { value: "district", label: "My district" },
  { value: "region", label: "My region" },
  { value: "nationwide", label: "Nationwide" },
];

const MutualAidPage = () => {
  const { user } = useAuth();
  const { data: loc } = useUserLocation();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"request" | "offer">("request");
  const [open, setOpen] = useState(false);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["aid-posts", tab, loc?.parish, loc?.district],
    queryFn: async () => {
      let q = supabase
        .from("community_aid_posts")
        .select("*")
        .eq("kind", tab)
        .eq("status", "open")
        .order("urgent", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(50);

      if (loc?.parish || loc?.district) {
        const parts: string[] = ["scope.eq.nationwide"];
        if (loc?.region) parts.push(`and(scope.eq.region,region.eq.${loc.region})`);
        if (loc?.district) parts.push(`and(scope.eq.district,district.eq.${loc.district})`);
        if (loc?.subcounty) parts.push(`and(scope.eq.subcounty,subcounty.eq.${loc.subcounty})`);
        if (loc?.parish) parts.push(`and(scope.eq.parish,parish.eq.${loc.parish})`);
        if (loc?.village) parts.push(`and(scope.eq.village,village.eq.${loc.village})`);
        q = q.or(parts.join(","));
      }
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="px-4 py-4 md:px-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-bold">Mutual Aid</h1>
          <p className="text-xs text-muted-foreground">Help your neighbors · Get help when you need it</p>
        </div>
        {user && (
          <NewPostDialog open={open} setOpen={setOpen} defaultKind={tab} loc={loc ?? null} onCreated={() => qc.invalidateQueries({ queryKey: ["aid-posts"] })} />
        )}
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as "request" | "offer")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="request">🆘 Requests</TabsTrigger>
          <TabsTrigger value="offer">🤲 Offers</TabsTrigger>
        </TabsList>
        <TabsContent value={tab} className="mt-4 space-y-3">
          {isLoading && <p className="text-center text-sm text-muted-foreground py-8">Loading…</p>}
          {!isLoading && posts.length === 0 && (
            <div className="rounded-2xl border bg-card p-8 text-center">
              <HeartHandshake className="mx-auto h-10 w-10 text-muted-foreground/40" />
              <p className="mt-2 text-sm text-muted-foreground">No {tab}s in your area yet.</p>
              {user && <p className="mt-1 text-xs">Be the first to post.</p>}
            </div>
          )}
          {posts.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <PostCard post={p} onResolve={() => qc.invalidateQueries({ queryKey: ["aid-posts"] })} />
            </motion.div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

const PostCard = ({ post, onResolve }: { post: any; onResolve: () => void }) => {
  const { user } = useAuth();
  const isOwner = user?.id === post.user_id;
  const cat = CATEGORIES.find((c) => c.value === post.category);

  const markResolved = async () => {
    const { error } = await supabase.from("community_aid_posts").update({ status: "fulfilled" }).eq("id", post.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Marked as fulfilled");
      onResolve();
    }
  };

  return (
    <div className={`rounded-2xl border bg-card p-4 shadow-sm ${post.urgent ? "border-urgent/40" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {post.urgent && (
              <Badge variant="destructive" className="gap-1 text-[10px]">
                <AlertTriangle className="h-3 w-3" /> URGENT
              </Badge>
            )}
            <Badge variant="secondary" className="text-[10px]">{cat?.label ?? post.category}</Badge>
            <Badge variant="outline" className="text-[10px]">
              {post.scope === "nationwide" ? "Nationwide" : post[`target_${post.scope}`] ?? post[post.scope] ?? post.scope}
            </Badge>
          </div>
          <h3 className="mt-2 font-semibold text-foreground">{post.title}</h3>
          {post.description && <p className="mt-1 text-sm text-muted-foreground">{post.description}</p>}
          <p className="mt-2 text-[11px] text-muted-foreground">{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {post.contact_phone && (
          <a href={`tel:${post.contact_phone}`} className="inline-flex">
            <Button size="sm" variant="outline" className="gap-1.5">
              <Phone className="h-3.5 w-3.5" /> Call
            </Button>
          </a>
        )}
        {post.whatsapp && (
          <a href={`https://wa.me/${post.whatsapp.replace(/[^0-9]/g, "")}`} target="_blank" rel="noreferrer" className="inline-flex">
            <Button size="sm" variant="outline" className="gap-1.5">
              <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
            </Button>
          </a>
        )}
        {isOwner && post.status === "open" && (
          <Button size="sm" variant="ghost" className="gap-1.5" onClick={markResolved}>
            <CheckCircle2 className="h-3.5 w-3.5" /> Mark fulfilled
          </Button>
        )}
      </div>
    </div>
  );
};

const NewPostDialog = ({
  open,
  setOpen,
  defaultKind,
  loc,
  onCreated,
}: {
  open: boolean;
  setOpen: (b: boolean) => void;
  defaultKind: "request" | "offer";
  loc: any;
  onCreated: () => void;
}) => {
  const { user } = useAuth();
  const [form, setForm] = useState({
    kind: defaultKind,
    category: "general",
    title: "",
    description: "",
    contact_phone: "",
    whatsapp: "",
    urgent: false,
    scope: "parish",
  });

  const m = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sign in required");
      const payload: any = {
        user_id: user.id,
        kind: form.kind,
        category: form.category,
        title: form.title,
        description: form.description || null,
        contact_phone: form.contact_phone || null,
        whatsapp: form.whatsapp || null,
        urgent: form.urgent,
        scope: form.scope,
        region: loc?.region ?? null,
        district: loc?.district ?? null,
        constituency: loc?.constituency ?? null,
        subcounty: loc?.subcounty ?? null,
        parish: loc?.parish ?? null,
        village: loc?.village ?? null,
      };
      const { error } = await supabase.from("community_aid_posts").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Posted to your community");
      setOpen(false);
      setForm((f) => ({ ...f, title: "", description: "" }));
      onCreated();
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" /> Post
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New community post</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Type</Label>
              <Select value={form.kind} onValueChange={(v) => setForm({ ...form, kind: v as any })}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="request">🆘 Request help</SelectItem>
                  <SelectItem value="offer">🤲 Offer help</SelectItem>
                </SelectContent>
              </Select>
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
          </div>
          <div>
            <Label>Title</Label>
            <Input className="mt-1.5" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Need a ride to Mulago hospital" />
          </div>
          <div>
            <Label>Details</Label>
            <Textarea className="mt-1.5" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
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
            <Label>Visible to</Label>
            <Select value={form.scope} onValueChange={(v) => setForm({ ...form, scope: v })}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                {SCOPES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label className="text-sm">Mark as urgent</Label>
              <p className="text-[11px] text-muted-foreground">Pushed to top of feed</p>
            </div>
            <Switch checked={form.urgent} onCheckedChange={(c) => setForm({ ...form, urgent: c })} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => m.mutate()} disabled={!form.title || m.isPending}>
            {m.isPending ? "Posting…" : "Post"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MutualAidPage;
