import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Megaphone, Upload, X } from "lucide-react";
import { useImamProfile } from "@/hooks/useImamProfile";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CATEGORY_OPTIONS } from "@/components/notifications/CategoryBadge";

type Scope = "village" | "parish" | "subcounty" | "constituency" | "district" | "region" | "nationwide";

const SCOPE_DESC: Record<Scope, string> = {
  village: "Only people in your village",
  parish: "Everyone in your parish",
  subcounty: "Everyone in your subcounty",
  constituency: "Everyone in your constituency",
  district: "Everyone in your district",
  region: "Everyone in your region",
  nationwide: "Every UmmahLink user (use sparingly)",
};

const NotificationComposePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { imam, isImam, loading: imamLoading } = useImamProfile();

  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("meeting");
  const [urgent, setUrgent] = useState(false);
  const [eventTime, setEventTime] = useState("");
  const [locationText, setLocationText] = useState("");
  const [mapsLink, setMapsLink] = useState("");
  const [scope, setScope] = useState<Scope>("parish");
  const [allowRsvp, setAllowRsvp] = useState(true);
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!imamLoading && !isImam) {
      toast.error("Only verified imams can post notifications");
      navigate("/imam/apply");
    }
  }, [imamLoading, isImam, navigate]);

  // Pre-fill default location text from imam's mosque
  useEffect(() => {
    if (imam && !locationText) setLocationText(imam.mosque_name);
  }, [imam, locationText]);

  const handlePoster = (file: File | null) => {
    setPosterFile(file);
    if (posterPreview) URL.revokeObjectURL(posterPreview);
    setPosterPreview(file ? URL.createObjectURL(file) : null);
  };

  const uploadPoster = async (): Promise<string | null> => {
    if (!posterFile || !user) return null;
    const ext = posterFile.name.split(".").pop() ?? "jpg";
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("notification-posters")
      .upload(path, posterFile, { upsert: false, contentType: posterFile.type });
    if (error) throw error;
    const { data } = supabase.storage.from("notification-posters").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !imam) return;
    if (!title.trim() || !body.trim()) {
      toast.error("Title and message are required");
      return;
    }
    if (scope !== "nationwide") {
      const target = imam[`${scope}` as keyof typeof imam];
      if (!target) {
        toast.error(`Your imam profile is missing a ${scope}. Update it first or pick a wider scope.`);
        return;
      }
    }

    setLoading(true);
    try {
      const posterUrl = await uploadPoster();

      const { error } = await supabase.from("mosque_notifications").insert({
        imam_user_id: user.id,
        mosque_name: imam.mosque_name,
        masjid_id: imam.masjid_id ?? null,
        title: title.trim(),
        body: body.trim(),
        category,
        urgent,
        poster_url: posterUrl,
        event_time: eventTime.trim() || null,
        location_text: locationText.trim() || null,
        maps_link: mapsLink.trim() || null,
        scope,
        target_region: imam.region ?? null,
        target_district: imam.district ?? null,
        target_constituency: imam.constituency ?? null,
        target_subcounty: imam.subcounty ?? null,
        target_parish: imam.parish ?? null,
        target_village: imam.village ?? null,
        allow_rsvp: allowRsvp,
      });
      if (error) throw error;
      toast.success("Notification posted to your community");
      navigate("/notifications");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to post");
    } finally {
      setLoading(false);
    }
  };

  if (imamLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!imam) return null;

  return (
    <div className="px-4 py-6 md:px-6 md:py-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-2xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
            <Megaphone className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">Post a notification</h1>
            <p className="text-sm text-muted-foreground">
              Posting as <strong>{imam.full_name}</strong> · {imam.mosque_name}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Message</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Title *</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  maxLength={150}
                  placeholder="e.g., Friday meeting at the mosque"
                />
              </div>

              <div>
                <Label>Message *</Label>
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  required
                  rows={4}
                  maxLength={2000}
                  placeholder="Details about the event, agenda, what to bring..."
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Category *</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Event time</Label>
                  <Input
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    placeholder="Friday, 2:00 PM"
                  />
                </div>
              </div>

              <div>
                <Label>Location</Label>
                <Input
                  value={locationText}
                  onChange={(e) => setLocationText(e.target.value)}
                  placeholder={imam.mosque_name}
                />
              </div>

              <div>
                <Label>Google Maps link</Label>
                <Input
                  value={mapsLink}
                  onChange={(e) => setMapsLink(e.target.value)}
                  placeholder="https://maps.google.com/..."
                />
              </div>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-lg">Reach</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Who should see this? *</Label>
                <Select value={scope} onValueChange={(v) => setScope(v as Scope)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="village">Village {imam.village ? `· ${imam.village}` : ""}</SelectItem>
                    <SelectItem value="parish">Parish {imam.parish ? `· ${imam.parish}` : ""}</SelectItem>
                    <SelectItem value="subcounty">Subcounty {imam.subcounty ? `· ${imam.subcounty}` : ""}</SelectItem>
                    <SelectItem value="constituency">Constituency {imam.constituency ? `· ${imam.constituency}` : ""}</SelectItem>
                    <SelectItem value="district">District {imam.district ? `· ${imam.district}` : ""}</SelectItem>
                    <SelectItem value="region">Region {imam.region ? `· ${imam.region}` : ""}</SelectItem>
                    <SelectItem value="nationwide">Nationwide (everyone)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="mt-1 text-xs text-muted-foreground">{SCOPE_DESC[scope]}</p>
              </div>

              <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Mark as urgent</p>
                  <p className="text-xs text-muted-foreground">Highlights on home page banner</p>
                </div>
                <Switch checked={urgent} onCheckedChange={setUrgent} />
              </div>

              <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Allow RSVPs</p>
                  <p className="text-xs text-muted-foreground">Let users confirm attendance</p>
                </div>
                <Switch checked={allowRsvp} onCheckedChange={setAllowRsvp} />
              </div>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-lg">Poster (optional)</CardTitle>
            </CardHeader>
            <CardContent>
              {posterPreview ? (
                <div className="relative">
                  <img src={posterPreview} alt="Poster preview" className="max-h-72 w-full rounded-lg object-cover" />
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="absolute right-2 top-2"
                    onClick={() => handlePoster(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 p-6 text-center transition hover:bg-muted/60">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                  <p className="text-sm text-foreground">Click to upload poster image</p>
                  <p className="text-xs text-muted-foreground">JPG / PNG / WEBP — max 5MB</p>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f && f.size > 5 * 1024 * 1024) {
                        toast.error("File must be under 5MB");
                        return;
                      }
                      handlePoster(f ?? null);
                    }}
                  />
                </label>
              )}
            </CardContent>
          </Card>

          <div className="mt-4 flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => navigate("/notifications")}>
              Cancel
            </Button>
            <Button type="submit" variant="hero" className="flex-1" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Post notification"}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default NotificationComposePage;
