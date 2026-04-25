import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Mic, CheckCircle2, Clock, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AddressPicker, emptyAddress, type AddressValue } from "@/components/AddressPicker";
import { useImamProfile } from "@/hooks/useImamProfile";
import { useQuery } from "@tanstack/react-query";

const ImamApplyPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { isImam, loading: imamLoading } = useImamProfile();

  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [mosqueName, setMosqueName] = useState("");
  const [bio, setBio] = useState("");
  const [credentials, setCredentials] = useState("");
  const [address, setAddress] = useState<AddressValue>(emptyAddress);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user, navigate]);

  const { data: existing, isLoading: existingLoading, refetch } = useQuery({
    queryKey: ["my-imam-application", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("imam_applications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: prof }, { data: prefs }] = await Promise.all([
        supabase.from("profiles").select("display_name, phone").eq("user_id", user.id).maybeSingle(),
        supabase
          .from("user_preferences")
          .select("region, district, constituency, subcounty, parish, village")
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);
      if (prof) {
        setFullName((cur) => cur || prof.display_name || "");
        setPhone((cur) => cur || prof.phone || "");
      }
      setEmail((cur) => cur || user.email || "");
      if (prefs) {
        setAddress({
          region: prefs.region ?? "",
          district: prefs.district ?? "",
          constituency: prefs.constituency ?? "",
          subcounty: prefs.subcounty ?? "",
          parish: prefs.parish ?? "",
          village: prefs.village ?? "",
        });
      }
    })();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!fullName.trim() || !phone.trim() || !mosqueName.trim()) {
      toast.error("Please fill required fields");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from("imam_applications").insert({
        user_id: user.id,
        full_name: fullName.trim(),
        contact_phone: phone.trim(),
        whatsapp: whatsapp.trim() || null,
        email: email.trim() || null,
        mosque_name: mosqueName.trim(),
        region: address.region || null,
        district: address.district || null,
        constituency: address.constituency || null,
        subcounty: address.subcounty || null,
        parish: address.parish || null,
        village: address.village || null,
        bio: bio.trim() || null,
        credentials: credentials.trim() || null,
      });
      if (error) throw error;
      toast.success("Application submitted! Admin will review shortly.");
      refetch();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to submit");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || imamLoading || existingLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isImam) {
    return (
      <div className="px-4 py-8 md:px-6">
        <Card className="mx-auto max-w-xl">
          <CardContent className="space-y-3 p-6 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
            <h2 className="font-display text-2xl font-bold">You're a verified Imam</h2>
            <p className="text-sm text-muted-foreground">
              You can post community notifications to your parish or beyond.
            </p>
            <div className="flex justify-center gap-2 pt-2">
              <Button variant="hero" onClick={() => navigate("/notifications/new")}>
                Post a notification
              </Button>
              <Button variant="outline" onClick={() => navigate("/notifications")}>
                View feed
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (existing && existing.status === "pending") {
    return (
      <div className="px-4 py-8 md:px-6">
        <Card className="mx-auto max-w-xl">
          <CardContent className="space-y-3 p-6 text-center">
            <Clock className="mx-auto h-12 w-12 text-soft-gold" />
            <h2 className="font-display text-2xl font-bold">Application under review</h2>
            <p className="text-sm text-muted-foreground">
              Admin is reviewing your imam application for <strong>{existing.mosque_name}</strong>.
              You'll be notified once approved.
            </p>
            <Badge variant="outline">Submitted {new Date(existing.created_at).toLocaleDateString()}</Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 md:px-6 md:py-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-2xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
            <Mic className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">Become a verified Imam</h1>
            <p className="text-sm text-muted-foreground">
              Share calls-to-action and announcements with your community.
            </p>
          </div>
        </div>

        {existing && existing.status === "rejected" && (
          <Card className="mb-4 border-destructive/40">
            <CardContent className="flex items-start gap-3 p-4">
              <XCircle className="mt-0.5 h-5 w-5 text-destructive" />
              <div>
                <p className="font-semibold text-foreground">Previous application rejected</p>
                {existing.admin_notes && (
                  <p className="mt-1 text-sm text-muted-foreground">Admin note: {existing.admin_notes}</p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">You can submit a new application below.</p>
              </div>
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Application details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Full name *</Label>
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required maxLength={100} />
                </div>
                <div>
                  <Label>Contact phone *</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="+256..." />
                </div>
                <div>
                  <Label>WhatsApp</Label>
                  <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+256..." />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>

              <div>
                <Label>Mosque name *</Label>
                <Input
                  value={mosqueName}
                  onChange={(e) => setMosqueName(e.target.value)}
                  required
                  placeholder="e.g., Masjid Noor"
                  maxLength={150}
                />
              </div>

              <div className="space-y-2">
                <Label>Mosque location</Label>
                <p className="text-xs text-muted-foreground">
                  Members in these areas will receive your notifications by default.
                </p>
                <AddressPicker value={address} onChange={setAddress} />
              </div>

              <div>
                <Label>Credentials / qualifications</Label>
                <Textarea
                  value={credentials}
                  onChange={(e) => setCredentials(e.target.value)}
                  placeholder="Studied at... certified by..."
                  rows={2}
                  maxLength={500}
                />
              </div>

              <div>
                <Label>Brief bio</Label>
                <Textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="A short introduction shown to your community"
                  rows={3}
                  maxLength={1000}
                />
              </div>

              <Button type="submit" variant="hero" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit application"}
              </Button>
            </CardContent>
          </Card>
        </form>
      </motion.div>
    </div>
  );
};

export default ImamApplyPage;
