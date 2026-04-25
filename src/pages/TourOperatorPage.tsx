import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Loader2, MapPin, BadgeCheck, Star, Phone, MessageCircle, Mail, Globe,
  Plane, Calendar, Hotel, Users as UsersIcon, ArrowLeft, Send, Building2,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const fmtUgx = (n: number) => `UGX ${new Intl.NumberFormat().format(n)}`;

const inquirySchema = z.object({
  name: z.string().trim().min(2, "Name too short").max(100),
  phone: z.string().trim().min(7, "Enter a valid phone").max(20),
  email: z.string().trim().email().max(255).optional().or(z.literal("")),
  message: z.string().trim().max(1000).optional().or(z.literal("")),
});

const TourOperatorPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [inquiryPackage, setInquiryPackage] = useState<any | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const { data: operator, isLoading } = useQuery({
    queryKey: ["tour-operator", slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await supabase.from("tour_operators").select("*").eq("slug", slug!).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: packages } = useQuery({
    queryKey: ["tour-packages", operator?.id],
    enabled: !!operator?.id,
    queryFn: async () => {
      const { data, error } = await supabase.from("tour_packages").select("*").eq("operator_id", operator!.id).eq("active", true).order("price_ugx");
      if (error) throw error;
      return data;
    },
  });

  const { data: reviews } = useQuery({
    queryKey: ["tour-reviews", operator?.id],
    enabled: !!operator?.id,
    queryFn: async () => {
      const { data: rs, error } = await supabase.from("tour_reviews").select("*").eq("operator_id", operator!.id).order("created_at", { ascending: false });
      if (error) throw error;
      const userIds = Array.from(new Set((rs ?? []).map((r: any) => r.user_id)));
      const profMap = new Map<string, string>();
      if (userIds.length > 0) {
        const { data: profs } = await supabase.from("profiles").select("user_id, display_name").in("user_id", userIds);
        (profs ?? []).forEach((p: any) => profMap.set(p.user_id, p.display_name || "Anonymous"));
      }
      return (rs ?? []).map((r: any) => ({ ...r, author: profMap.get(r.user_id) || "Anonymous" }));
    },
  });

  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!operator) return (
    <div className="px-4 py-16 text-center">
      <Building2 className="mx-auto mb-2 h-10 w-10 text-muted-foreground/50" />
      <p className="text-sm text-muted-foreground">Operator not found.</p>
      <Link to="/hajj-umrah" className="mt-3 inline-block"><Button variant="outline" size="sm">Back to operators</Button></Link>
    </div>
  );

  const avgRating = reviews && reviews.length > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  const openInquiry = (pkg: any | null) => {
    setInquiryPackage(pkg);
    setForm((f) => ({ ...f, message: pkg ? `Hi, I'm interested in your "${pkg.name}" package.` : f.message }));
    setInquiryOpen(true);
  };

  const submitInquiry = async () => {
    const parsed = inquirySchema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.errors[0].message);
    setSubmitting(true);
    const { error } = await supabase.from("tour_inquiries").insert({
      operator_id: operator.id,
      package_id: inquiryPackage?.id ?? null,
      user_id: user?.id ?? null,
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || null,
      message: form.message.trim() || null,
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Inquiry sent! The operator will reach out shortly.");
    setInquiryOpen(false);
    setForm({ name: "", phone: "", email: "", message: "" });
  };

  const submitReview = async () => {
    if (!user) return toast.error("Please sign in to leave a review");
    setReviewSubmitting(true);
    const { error } = await supabase.from("tour_reviews").upsert({
      operator_id: operator.id,
      user_id: user.id,
      rating: reviewRating,
      comment: reviewComment.trim() || null,
    }, { onConflict: "operator_id,user_id" });
    setReviewSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Thanks for your review!");
    setReviewComment("");
    qc.invalidateQueries({ queryKey: ["tour-reviews", operator.id] });
  };

  const whatsappLink = operator.whatsapp
    ? `https://wa.me/${operator.whatsapp.replace(/[^\d]/g, "")}?text=${encodeURIComponent("Assalamu alaykum, I'm interested in your Hajj/Umrah packages.")}`
    : null;

  return (
    <div className="pb-8">
      {/* Hero */}
      <div className="relative h-44 overflow-hidden bg-gradient-to-br from-primary/30 to-accent/30 md:h-60">
        {operator.hero_url && (
          <img src={operator.hero_url} alt={operator.name} className="h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        <Link to="/hajj-umrah" className="absolute left-3 top-3">
          <Button size="icon" variant="secondary" className="h-9 w-9 rounded-full shadow"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
      </div>

      <div className="-mt-12 px-4 md:px-6">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="overflow-hidden">
            <CardContent className="p-4 md:p-5">
              <div className="flex items-start gap-3">
                {operator.logo_url ? (
                  <img src={operator.logo_url} alt="" className="h-16 w-16 shrink-0 rounded-xl border bg-card object-cover" />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <Building2 className="h-8 w-8 text-primary" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h1 className="truncate font-display text-xl font-bold md:text-2xl">{operator.name}</h1>
                    {operator.verified && <BadgeCheck className="h-5 w-5 shrink-0 text-primary" />}
                  </div>
                  {(operator.city || operator.district) && (
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />{[operator.city, operator.district].filter(Boolean).join(", ")}
                    </p>
                  )}
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {operator.verified && <Badge className="gap-1"><BadgeCheck className="h-3 w-3" />Verified</Badge>}
                    {operator.license_no && <Badge variant="outline" className="text-[10px]">License: {operator.license_no}</Badge>}
                    {operator.license_authority && <Badge variant="outline" className="text-[10px]">{operator.license_authority}</Badge>}
                    {avgRating > 0 && (
                      <Badge variant="outline" className="gap-1 text-[10px]">
                        <Star className="h-2.5 w-2.5 fill-soft-gold text-soft-gold" />
                        {avgRating.toFixed(1)} · {reviews?.length}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {operator.bio && <p className="mt-3 whitespace-pre-line text-sm text-foreground/90">{operator.bio}</p>}

              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {operator.contact_phone && (
                  <a href={`tel:${operator.contact_phone}`}><Button variant="outline" className="w-full gap-1"><Phone className="h-4 w-4" /> Call</Button></a>
                )}
                {whatsappLink && (
                  <a href={whatsappLink} target="_blank" rel="noopener noreferrer"><Button variant="outline" className="w-full gap-1"><MessageCircle className="h-4 w-4" /> WhatsApp</Button></a>
                )}
                {operator.email && (
                  <a href={`mailto:${operator.email}`}><Button variant="outline" className="w-full gap-1"><Mail className="h-4 w-4" /> Email</Button></a>
                )}
                {operator.website && (
                  <a href={operator.website} target="_blank" rel="noopener noreferrer"><Button variant="outline" className="w-full gap-1"><Globe className="h-4 w-4" /> Website</Button></a>
                )}
              </div>

              <Button className="mt-3 w-full gap-2" onClick={() => openInquiry(null)}>
                <Send className="h-4 w-4" /> Send inquiry
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Packages */}
        <section className="mt-6">
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold">
            <Plane className="h-5 w-5 text-primary" /> Packages
            <Badge variant="secondary">{packages?.length ?? 0}</Badge>
          </h2>
          {packages?.length === 0 ? (
            <p className="rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">No packages listed yet.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {packages?.map((p: any) => (
                <Card key={p.id} className="overflow-hidden">
                  {p.image_url && <img src={p.image_url} alt="" className="h-32 w-full object-cover" loading="lazy" />}
                  <CardContent className="space-y-2 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{p.name}</p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          <Badge>{p.type.toUpperCase()}</Badge>
                          <Badge variant="outline" className="capitalize">{p.tier}</Badge>
                          {p.departure_month && <Badge variant="outline" className="gap-1"><Calendar className="h-3 w-3" />{p.departure_month}</Badge>}
                          {p.duration_days && <Badge variant="outline">{p.duration_days} days</Badge>}
                        </div>
                      </div>
                      <p className="shrink-0 font-display text-base font-bold text-primary">{fmtUgx(Number(p.price_ugx))}</p>
                    </div>
                    {(p.hotel_makkah || p.hotel_madinah) && (
                      <div className="space-y-0.5 text-xs text-muted-foreground">
                        {p.hotel_makkah && <p className="flex items-center gap-1"><Hotel className="h-3 w-3" /> Makkah: {p.hotel_makkah}</p>}
                        {p.hotel_madinah && <p className="flex items-center gap-1"><Hotel className="h-3 w-3" /> Madinah: {p.hotel_madinah}</p>}
                      </div>
                    )}
                    {p.description && <p className="line-clamp-2 text-xs text-foreground/80">{p.description}</p>}
                    {p.includes?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {p.includes.slice(0, 4).map((inc: string) => <Badge key={inc} variant="secondary" className="text-[10px]">{inc}</Badge>)}
                        {p.includes.length > 4 && <Badge variant="secondary" className="text-[10px]">+{p.includes.length - 4}</Badge>}
                      </div>
                    )}
                    {p.seats_available !== null && p.seats_available !== undefined && (
                      <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <UsersIcon className="h-3 w-3" /> {p.seats_available} seats remaining
                      </p>
                    )}
                    <Button size="sm" className="w-full gap-1" onClick={() => openInquiry(p)}>
                      <Send className="h-3.5 w-3.5" /> Inquire about this package
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Reviews */}
        <section className="mt-6">
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold">
            <Star className="h-5 w-5 text-soft-gold" /> Reviews
            <Badge variant="secondary">{reviews?.length ?? 0}</Badge>
          </h2>

          {user && (
            <Card className="mb-3">
              <CardContent className="p-4">
                <p className="mb-2 text-sm font-medium">Leave a review</p>
                <div className="mb-2 flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} onClick={() => setReviewRating(n)} aria-label={`${n} stars`}>
                      <Star className={`h-6 w-6 ${n <= reviewRating ? "fill-soft-gold text-soft-gold" : "text-muted-foreground/40"}`} />
                    </button>
                  ))}
                </div>
                <Textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} placeholder="Share your experience…" rows={3} maxLength={500} />
                <Button size="sm" className="mt-2" onClick={submitReview} disabled={reviewSubmitting}>
                  {reviewSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit review"}
                </Button>
              </CardContent>
            </Card>
          )}

          {reviews?.length === 0 ? (
            <p className="rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">No reviews yet.</p>
          ) : (
            <div className="space-y-2">
              {reviews?.map((r: any) => (
                <Card key={r.id}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{r.author}</p>
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-soft-gold text-soft-gold" : "text-muted-foreground/30"}`} />
                        ))}
                      </div>
                    </div>
                    {r.comment && <p className="mt-1 text-sm text-foreground/90">{r.comment}</p>}
                    <p className="mt-1 text-[10px] text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Inquiry dialog */}
      <Dialog open={inquiryOpen} onOpenChange={setInquiryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send inquiry to {operator.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {inquiryPackage && (
              <div className="rounded-lg bg-muted/50 p-2 text-xs">
                <p className="font-medium">{inquiryPackage.name}</p>
                <p className="text-muted-foreground">{inquiryPackage.type.toUpperCase()} · {fmtUgx(Number(inquiryPackage.price_ugx))}</p>
              </div>
            )}
            <div>
              <Label className="text-xs">Your name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Phone *</Label>
              <Input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+2567…" />
            </div>
            <div>
              <Label className="text-xs">Email (optional)</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Message</Label>
              <Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={3} maxLength={1000} />
            </div>
            <Button onClick={submitInquiry} disabled={submitting} className="w-full gap-2">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send inquiry
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TourOperatorPage;
