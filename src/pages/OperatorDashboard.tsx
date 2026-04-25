import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Loader2, Plus, Trash2, Building2, Plane, MessageCircle, BadgeCheck,
  Phone, Save, Edit3, Inbox,
} from "lucide-react";
import { toast } from "sonner";

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60);

const emptyOperator = {
  name: "", slug: "", bio: "", logo_url: "", hero_url: "",
  city: "", district: "", license_no: "", license_authority: "",
  contact_phone: "", whatsapp: "", email: "", website: "",
};

const emptyPackage = {
  name: "", type: "umrah", tier: "standard",
  price_ugx: 0, duration_days: 14, departure_month: "",
  hotel_makkah: "", hotel_madinah: "", description: "",
  includes: [] as string[], seats_available: null as number | null,
  image_url: "",
};

const OperatorDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [opForm, setOpForm] = useState(emptyOperator);
  const [savingOp, setSavingOp] = useState(false);
  const [pkgDialogOpen, setPkgDialogOpen] = useState(false);
  const [pkgForm, setPkgForm] = useState<any>(emptyPackage);
  const [editingPkgId, setEditingPkgId] = useState<string | null>(null);
  const [includesInput, setIncludesInput] = useState("");

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user, navigate]);

  const { data: operator, isLoading } = useQuery({
    queryKey: ["my-operator", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("tour_operators").select("*").eq("owner_user_id", user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (operator) setOpForm({
      name: operator.name ?? "", slug: operator.slug ?? "", bio: operator.bio ?? "",
      logo_url: operator.logo_url ?? "", hero_url: operator.hero_url ?? "",
      city: operator.city ?? "", district: operator.district ?? "",
      license_no: operator.license_no ?? "", license_authority: operator.license_authority ?? "",
      contact_phone: operator.contact_phone ?? "", whatsapp: operator.whatsapp ?? "",
      email: operator.email ?? "", website: operator.website ?? "",
    });
  }, [operator]);

  const { data: packages } = useQuery({
    queryKey: ["my-packages", operator?.id],
    enabled: !!operator?.id,
    queryFn: async () => {
      const { data, error } = await supabase.from("tour_packages").select("*").eq("operator_id", operator!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: inquiries } = useQuery({
    queryKey: ["my-inquiries", operator?.id],
    enabled: !!operator?.id,
    queryFn: async () => {
      const { data, error } = await supabase.from("tour_inquiries").select("*").eq("operator_id", operator!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const saveOperator = async () => {
    if (!user) return;
    if (!opForm.name.trim()) return toast.error("Company name required");
    setSavingOp(true);
    const slug = opForm.slug.trim() || slugify(opForm.name);
    if (operator) {
      const { error } = await supabase.from("tour_operators").update({ ...opForm, slug }).eq("id", operator.id);
      setSavingOp(false);
      if (error) return toast.error(error.message);
      toast.success("Profile updated");
    } else {
      const { error } = await supabase.from("tour_operators").insert({ ...opForm, slug, owner_user_id: user.id });
      setSavingOp(false);
      if (error) return toast.error(error.message);
      toast.success("Operator profile created!");
    }
    qc.invalidateQueries({ queryKey: ["my-operator", user.id] });
  };

  const openNewPackage = () => {
    setPkgForm(emptyPackage);
    setIncludesInput("");
    setEditingPkgId(null);
    setPkgDialogOpen(true);
  };

  const openEditPackage = (p: any) => {
    setPkgForm({ ...emptyPackage, ...p });
    setIncludesInput((p.includes ?? []).join(", "));
    setEditingPkgId(p.id);
    setPkgDialogOpen(true);
  };

  const savePackage = async () => {
    if (!operator) return;
    if (!pkgForm.name.trim()) return toast.error("Package name required");
    const includes = includesInput.split(",").map((s: string) => s.trim()).filter(Boolean);
    const payload = {
      ...pkgForm,
      includes,
      price_ugx: Number(pkgForm.price_ugx) || 0,
      duration_days: pkgForm.duration_days ? Number(pkgForm.duration_days) : null,
      seats_available: pkgForm.seats_available ? Number(pkgForm.seats_available) : null,
      operator_id: operator.id,
    };
    const { error } = editingPkgId
      ? await supabase.from("tour_packages").update(payload).eq("id", editingPkgId)
      : await supabase.from("tour_packages").insert(payload);
    if (error) return toast.error(error.message);
    toast.success(editingPkgId ? "Package updated" : "Package added");
    setPkgDialogOpen(false);
    qc.invalidateQueries({ queryKey: ["my-packages", operator.id] });
  };

  const deletePackage = async (id: string) => {
    if (!confirm("Delete this package?")) return;
    const { error } = await supabase.from("tour_packages").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Package deleted");
    qc.invalidateQueries({ queryKey: ["my-packages", operator!.id] });
  };

  const updateInquiryStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("tour_inquiries").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["my-inquiries", operator!.id] });
  };

  if (authLoading || isLoading) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="px-4 py-4 md:px-6 md:py-6">
      <div className="mb-4 flex items-center gap-2">
        <Building2 className="h-6 w-6 text-primary" />
        <div>
          <h1 className="font-display text-xl font-bold md:text-2xl">Operator Dashboard</h1>
          <p className="text-xs text-muted-foreground">Manage your Hajj & Umrah listing</p>
        </div>
        {operator?.verified && <Badge className="ml-auto gap-1"><BadgeCheck className="h-3 w-3" />Verified</Badge>}
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="packages">Packages {packages?.length ? `(${packages.length})` : ""}</TabsTrigger>
          <TabsTrigger value="inquiries">Inquiries {inquiries?.length ? `(${inquiries.length})` : ""}</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Company profile</CardTitle></CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              <Field label="Company name *" v={opForm.name} onChange={(v) => setOpForm({ ...opForm, name: v, slug: opForm.slug || slugify(v) })} />
              <Field label="URL slug" v={opForm.slug} onChange={(v) => setOpForm({ ...opForm, slug: slugify(v) })} placeholder="my-travel" />
              <Field label="City" v={opForm.city} onChange={(v) => setOpForm({ ...opForm, city: v })} />
              <Field label="District" v={opForm.district} onChange={(v) => setOpForm({ ...opForm, district: v })} />
              <Field label="License number" v={opForm.license_no} onChange={(v) => setOpForm({ ...opForm, license_no: v })} placeholder="e.g. UTB/12345" />
              <Field label="License authority" v={opForm.license_authority} onChange={(v) => setOpForm({ ...opForm, license_authority: v })} placeholder="Uganda Tourism Board" />
              <Field label="Phone" v={opForm.contact_phone} onChange={(v) => setOpForm({ ...opForm, contact_phone: v })} placeholder="+2567…" />
              <Field label="WhatsApp" v={opForm.whatsapp} onChange={(v) => setOpForm({ ...opForm, whatsapp: v })} placeholder="+2567…" />
              <Field label="Email" v={opForm.email} onChange={(v) => setOpForm({ ...opForm, email: v })} type="email" />
              <Field label="Website" v={opForm.website} onChange={(v) => setOpForm({ ...opForm, website: v })} placeholder="https://" />
              <Field label="Logo URL" v={opForm.logo_url} onChange={(v) => setOpForm({ ...opForm, logo_url: v })} placeholder="https://..." />
              <Field label="Hero image URL" v={opForm.hero_url} onChange={(v) => setOpForm({ ...opForm, hero_url: v })} placeholder="https://..." />
              <div className="md:col-span-2">
                <Label className="text-xs">Bio</Label>
                <Textarea value={opForm.bio} onChange={(e) => setOpForm({ ...opForm, bio: e.target.value })} rows={4} maxLength={1500} placeholder="Tell pilgrims about your company, experience, special services…" />
              </div>
              <div className="md:col-span-2">
                <Button onClick={saveOperator} disabled={savingOp} className="gap-2">
                  {savingOp ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {operator ? "Save changes" : "Create profile"}
                </Button>
                {!operator?.verified && operator && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    ⓘ Verification is granted by admins after license review.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="packages" className="mt-4">
          {!operator ? (
            <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">Create your operator profile first.</CardContent></Card>
          ) : (
            <>
              <Button onClick={openNewPackage} className="mb-3 gap-2"><Plus className="h-4 w-4" />Add package</Button>
              {packages?.length === 0 ? (
                <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">No packages yet.</CardContent></Card>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {packages?.map((p: any) => (
                    <Card key={p.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate font-semibold">{p.name}</p>
                            <div className="mt-1 flex flex-wrap gap-1">
                              <Badge>{p.type.toUpperCase()}</Badge>
                              <Badge variant="outline" className="capitalize">{p.tier}</Badge>
                              {p.departure_month && <Badge variant="outline">{p.departure_month}</Badge>}
                            </div>
                          </div>
                          <p className="font-bold text-primary">UGX {Number(p.price_ugx).toLocaleString()}</p>
                        </div>
                        <div className="mt-3 flex gap-2">
                          <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => openEditPackage(p)}><Edit3 className="h-3 w-3" />Edit</Button>
                          <Button size="sm" variant="outline" onClick={() => deletePackage(p.id)} className="text-destructive"><Trash2 className="h-3 w-3" /></Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="inquiries" className="mt-4">
          {!operator ? (
            <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">Create your operator profile first.</CardContent></Card>
          ) : inquiries?.length === 0 ? (
            <Card><CardContent className="py-10 text-center text-sm text-muted-foreground"><Inbox className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />No inquiries yet.</CardContent></Card>
          ) : (
            <div className="space-y-2">
              {inquiries?.map((i: any) => (
                <Card key={i.id}>
                  <CardContent className="space-y-2 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold">{i.name}</p>
                        <p className="flex items-center gap-1 text-xs text-muted-foreground"><Phone className="h-3 w-3" />{i.phone}</p>
                        {i.email && <p className="text-xs text-muted-foreground">{i.email}</p>}
                      </div>
                      <Select value={i.status} onValueChange={(v) => updateInquiryStatus(i.id, v)}>
                        <SelectTrigger className="h-7 w-28 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="contacted">Contacted</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                          <SelectItem value="spam">Spam</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {i.message && <p className="text-sm">{i.message}</p>}
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] text-muted-foreground">{new Date(i.created_at).toLocaleString()}</p>
                      <a href={`https://wa.me/${i.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline" className="gap-1"><MessageCircle className="h-3 w-3" />Reply on WhatsApp</Button>
                      </a>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Package dialog */}
      <Dialog open={pkgDialogOpen} onOpenChange={setPkgDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader><DialogTitle>{editingPkgId ? "Edit package" : "New package"}</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <Field label="Package name *" v={pkgForm.name} onChange={(v) => setPkgForm({ ...pkgForm, name: v })} />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Type</Label>
                <Select value={pkgForm.type} onValueChange={(v) => setPkgForm({ ...pkgForm, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hajj">Hajj</SelectItem>
                    <SelectItem value="umrah">Umrah</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Tier</Label>
                <Select value={pkgForm.tier} onValueChange={(v) => setPkgForm({ ...pkgForm, tier: v })}>
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
              <Field label="Price (UGX) *" v={pkgForm.price_ugx} onChange={(v) => setPkgForm({ ...pkgForm, price_ugx: v })} type="number" />
              <Field label="Duration (days)" v={pkgForm.duration_days} onChange={(v) => setPkgForm({ ...pkgForm, duration_days: v })} type="number" />
              <Field label="Departure month" v={pkgForm.departure_month} onChange={(v) => setPkgForm({ ...pkgForm, departure_month: v })} placeholder="e.g. Mar" />
              <Field label="Seats available" v={pkgForm.seats_available ?? ""} onChange={(v) => setPkgForm({ ...pkgForm, seats_available: v })} type="number" />
              <Field label="Hotel in Makkah" v={pkgForm.hotel_makkah} onChange={(v) => setPkgForm({ ...pkgForm, hotel_makkah: v })} />
              <Field label="Hotel in Madinah" v={pkgForm.hotel_madinah} onChange={(v) => setPkgForm({ ...pkgForm, hotel_madinah: v })} />
            </div>
            <Field label="Image URL" v={pkgForm.image_url} onChange={(v) => setPkgForm({ ...pkgForm, image_url: v })} placeholder="https://..." />
            <div>
              <Label className="text-xs">Includes (comma-separated)</Label>
              <Input value={includesInput} onChange={(e) => setIncludesInput(e.target.value)} placeholder="Visa, Flight, Transport, Meals" />
            </div>
            <div>
              <Label className="text-xs">Description</Label>
              <Textarea value={pkgForm.description} onChange={(e) => setPkgForm({ ...pkgForm, description: e.target.value })} rows={3} maxLength={1000} />
            </div>
            <Button onClick={savePackage} className="gap-2"><Save className="h-4 w-4" />Save package</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const Field = ({ label, v, onChange, type = "text", placeholder }: any) => (
  <div>
    <Label className="text-xs">{label}</Label>
    <Input type={type} value={v ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
  </div>
);

export default OperatorDashboard;
