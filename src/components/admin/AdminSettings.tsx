import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

interface AppInfo { name: string; tagline: string; contact_email: string; contact_phone: string }
interface PrayerDefaults { fajr: string; dhuhr: string; asr: string; maghrib: string; isha: string }
interface FeatureFlags { prayer_prompt: boolean; donations: boolean; alerts: boolean; resources: boolean; dawah: boolean }

const AdminSettings = () => {
  const qc = useQueryClient();
  const [info, setInfo] = useState<AppInfo>({ name: "", tagline: "", contact_email: "", contact_phone: "" });
  const [prayer, setPrayer] = useState<PrayerDefaults>({ fajr: "", dhuhr: "", asr: "", maghrib: "", isha: "" });
  const [flags, setFlags] = useState<FeatureFlags>({ prayer_prompt: true, donations: true, alerts: true, resources: true, dawah: true });

  const { data, isLoading } = useQuery({
    queryKey: ["app-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("app_settings").select("key, value");
      if (error) throw error;
      const map: Record<string, any> = {};
      (data ?? []).forEach((r: any) => { map[r.key] = r.value; });
      return map;
    },
  });

  useEffect(() => {
    if (!data) return;
    if (data.app_info) setInfo({ ...info, ...data.app_info });
    if (data.prayer_defaults) setPrayer({ ...prayer, ...data.prayer_defaults });
    if (data.feature_flags) setFlags({ ...flags, ...data.feature_flags });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const save = async (key: string, value: any) => {
    const { error } = await supabase.from("app_settings").upsert({ key, value }, { onConflict: "key" });
    if (error) return toast.error(error.message);
    toast.success("Saved");
    qc.invalidateQueries({ queryKey: ["app-settings"] });
  };

  if (isLoading) return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="mt-4 grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle className="text-base">App Info</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div><Label>Name</Label><Input value={info.name} onChange={(e) => setInfo({ ...info, name: e.target.value })} /></div>
          <div><Label>Tagline</Label><Input value={info.tagline} onChange={(e) => setInfo({ ...info, tagline: e.target.value })} /></div>
          <div><Label>Contact email</Label><Input type="email" value={info.contact_email} onChange={(e) => setInfo({ ...info, contact_email: e.target.value })} /></div>
          <div><Label>Contact phone</Label><Input value={info.contact_phone} onChange={(e) => setInfo({ ...info, contact_phone: e.target.value })} /></div>
          <Button onClick={() => save("app_info", info)} className="w-full gap-1"><Save className="h-4 w-4" /> Save app info</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Prayer Time Defaults</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {(["fajr", "dhuhr", "asr", "maghrib", "isha"] as const).map((k) => (
            <div key={k} className="flex items-center gap-3">
              <Label className="w-20 capitalize">{k}</Label>
              <Input type="time" value={prayer[k]} onChange={(e) => setPrayer({ ...prayer, [k]: e.target.value })} />
            </div>
          ))}
          <Button onClick={() => save("prayer_defaults", prayer)} className="w-full gap-1"><Save className="h-4 w-4" /> Save prayer defaults</Button>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader><CardTitle className="text-base">Feature Flags</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(Object.keys(flags) as Array<keyof FeatureFlags>).map((k) => (
            <div key={k} className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2">
              <Label className="capitalize">{k.replace("_", " ")}</Label>
              <Switch checked={flags[k]} onCheckedChange={(v) => setFlags({ ...flags, [k]: v })} />
            </div>
          ))}
          <div className="sm:col-span-2 lg:col-span-3">
            <Button onClick={() => save("feature_flags", flags)} className="w-full gap-1"><Save className="h-4 w-4" /> Save feature flags</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSettings;
