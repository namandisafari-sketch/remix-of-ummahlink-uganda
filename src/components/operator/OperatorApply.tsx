import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Building2, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Link } from "react-router-dom";

const applicationSchema = z.object({
  company_name: z.string().trim().min(2).max(120),
  contact_phone: z.string().trim().min(7).max(20),
  whatsapp: z.string().trim().max(20).optional().or(z.literal("")),
  email: z.string().trim().email().max(255).optional().or(z.literal("")),
  city: z.string().trim().max(100).optional().or(z.literal("")),
  district: z.string().trim().max(100).optional().or(z.literal("")),
  license_no: z.string().trim().max(60).optional().or(z.literal("")),
  license_authority: z.string().trim().max(120).optional().or(z.literal("")),
  bio: z.string().trim().max(2000).optional().or(z.literal("")),
  website: z.string().trim().max(255).optional().or(z.literal("")),
});

const empty = {
  company_name: "", contact_phone: "", whatsapp: "", email: "",
  city: "", district: "", license_no: "", license_authority: "",
  bio: "", website: "",
};

export const OperatorApply = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [form, setForm] = useState(empty);
  const [submitting, setSubmitting] = useState(false);

  const { data: existing, isLoading } = useQuery({
    queryKey: ["my-operator-application", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("operator_applications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const submit = async () => {
    const parsed = applicationSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("operator_applications").insert({
      user_id: user!.id,
      ...parsed.data,
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Application submitted! Admin will review shortly.");
    qc.invalidateQueries({ queryKey: ["my-operator-application", user?.id] });
  };

  if (isLoading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  if (existing) {
    const StatusIcon = existing.status === "approved" ? CheckCircle2 : existing.status === "rejected" ? XCircle : Clock;
    const tone = existing.status === "approved" ? "text-green-600" : existing.status === "rejected" ? "text-destructive" : "text-amber-600";
    return (
      <div className="mx-auto flex min-h-screen max-w-xl items-center px-4 py-10">
        <Card className="w-full">
          <CardHeader className="text-center">
            <div className={`mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-muted ${tone}`}>
              <StatusIcon className="h-6 w-6" />
            </div>
            <CardTitle className="capitalize">Application {existing.status}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-center">
            <p className="text-sm text-muted-foreground">{existing.company_name}</p>
            {existing.status === "pending" && <p className="text-sm">Your application is under review. We'll notify you once approved.</p>}
            {existing.status === "rejected" && existing.admin_notes && (
              <p className="rounded-lg bg-muted p-3 text-sm"><span className="font-medium">Reason:</span> {existing.admin_notes}</p>
            )}
            {existing.status === "approved" && (
              <p className="text-sm text-muted-foreground">Refresh the page — your operator dashboard should be available now.</p>
            )}
            <Button asChild variant="outline" className="mt-4">
              <Link to="/">Back to App</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:py-12">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <Building2 className="h-7 w-7 text-primary" />
        </div>
        <h1 className="font-display text-2xl font-bold">Become a Tour Operator</h1>
        <p className="mt-1 text-sm text-muted-foreground">Apply to list your Hajj & Umrah company on the platform.</p>
        <Badge variant="outline" className="mt-2">Reviewed by admin within 24-48h</Badge>
      </div>

      <Card>
        <CardContent className="space-y-4 p-5 md:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Company name *" v={form.company_name} onChange={(v) => setForm({ ...form, company_name: v })} />
            <Field label="Contact phone *" v={form.contact_phone} onChange={(v) => setForm({ ...form, contact_phone: v })} placeholder="+256..." />
            <Field label="WhatsApp" v={form.whatsapp} onChange={(v) => setForm({ ...form, whatsapp: v })} placeholder="+256..." />
            <Field label="Email" v={form.email} onChange={(v) => setForm({ ...form, email: v })} type="email" />
            <Field label="City" v={form.city} onChange={(v) => setForm({ ...form, city: v })} />
            <Field label="District" v={form.district} onChange={(v) => setForm({ ...form, district: v })} />
            <Field label="License number" v={form.license_no} onChange={(v) => setForm({ ...form, license_no: v })} />
            <Field label="License authority" v={form.license_authority} onChange={(v) => setForm({ ...form, license_authority: v })} placeholder="Ministry of Tourism" />
            <div className="sm:col-span-2">
              <Field label="Website" v={form.website} onChange={(v) => setForm({ ...form, website: v })} placeholder="https://..." />
            </div>
            <div className="sm:col-span-2">
              <Label className="mb-1 block text-sm">About your company</Label>
              <Textarea rows={4} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Years of experience, packages you offer, etc." />
            </div>
          </div>
          <Button className="w-full" size="lg" onClick={submit} disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit application"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

const Field = ({ label, v, onChange, type = "text", placeholder }: any) => (
  <div>
    <Label className="mb-1 block text-sm">{label}</Label>
    <Input type={type} value={v} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
  </div>
);
