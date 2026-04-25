import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useMyOperator } from "@/hooks/useMyOperator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, BadgeCheck } from "lucide-react";
import { toast } from "sonner";

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60);

const OperatorProfile = () => {
  const { user } = useAuth();
  const { data: operator } = useMyOperator();
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({
    name: "", slug: "", bio: "", logo_url: "", hero_url: "",
    city: "", district: "", license_no: "", license_authority: "",
    contact_phone: "", whatsapp: "", email: "", website: "",
  });

  useEffect(() => {
    if (operator) setForm({
      name: operator.name ?? "", slug: operator.slug ?? "", bio: operator.bio ?? "",
      logo_url: operator.logo_url ?? "", hero_url: operator.hero_url ?? "",
      city: operator.city ?? "", district: operator.district ?? "",
      license_no: operator.license_no ?? "", license_authority: operator.license_authority ?? "",
      contact_phone: operator.contact_phone ?? "", whatsapp: operator.whatsapp ?? "",
      email: operator.email ?? "", website: operator.website ?? "",
    });
  }, [operator]);

  const save = async () => {
    if (!user || !operator) return;
    if (!form.name.trim()) return toast.error("Company name required");
    setSaving(true);
    const slug = form.slug.trim() || slugify(form.name);
    const { error } = await supabase.from("tour_operators").update({ ...form, slug }).eq("id", operator.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Profile updated");
    qc.invalidateQueries({ queryKey: ["my-operator", user.id] });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Company profile</h1>
          <p className="text-sm text-muted-foreground">How pilgrims see your company</p>
        </div>
        {operator?.verified && <Badge className="gap-1"><BadgeCheck className="h-3 w-3" />Verified</Badge>}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Details</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <Field label="Company name *" v={form.name} onChange={(v: any) => setForm({ ...form, name: v, slug: form.slug || slugify(v) })} />
          <Field label="URL slug" v={form.slug} onChange={(v: any) => setForm({ ...form, slug: slugify(v) })} placeholder="my-travel" />
          <Field label="City" v={form.city} onChange={(v: any) => setForm({ ...form, city: v })} />
          <Field label="District" v={form.district} onChange={(v: any) => setForm({ ...form, district: v })} />
          <Field label="License number" v={form.license_no} onChange={(v: any) => setForm({ ...form, license_no: v })} />
          <Field label="License authority" v={form.license_authority} onChange={(v: any) => setForm({ ...form, license_authority: v })} />
          <Field label="Phone" v={form.contact_phone} onChange={(v: any) => setForm({ ...form, contact_phone: v })} placeholder="+2567…" />
          <Field label="WhatsApp" v={form.whatsapp} onChange={(v: any) => setForm({ ...form, whatsapp: v })} placeholder="+2567…" />
          <Field label="Email" v={form.email} onChange={(v: any) => setForm({ ...form, email: v })} type="email" />
          <Field label="Website" v={form.website} onChange={(v: any) => setForm({ ...form, website: v })} placeholder="https://" />
          <Field label="Logo URL" v={form.logo_url} onChange={(v: any) => setForm({ ...form, logo_url: v })} placeholder="https://..." />
          <Field label="Hero image URL" v={form.hero_url} onChange={(v: any) => setForm({ ...form, hero_url: v })} placeholder="https://..." />
          <div className="md:col-span-2">
            <Label className="text-xs">Bio</Label>
            <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={4} maxLength={1500} />
          </div>
          <div className="md:col-span-2">
            <Button onClick={save} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save changes
            </Button>
            {!operator?.verified && (
              <p className="mt-2 text-xs text-muted-foreground">
                ⓘ Verification is granted by admins after license review.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const Field = ({ label, v, onChange, type = "text", placeholder }: any) => (
  <div>
    <Label className="text-xs">{label}</Label>
    <Input type={type} value={v} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
  </div>
);

export default OperatorProfile;
