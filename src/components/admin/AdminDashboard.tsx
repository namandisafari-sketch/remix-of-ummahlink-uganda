import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Bell, Heart, BookOpen, Users, Mic, Megaphone, Landmark, DollarSign,
  MapPin, Briefcase, Sparkles, TrendingUp,
} from "lucide-react";

const StatCard = ({
  icon: Icon, label, value, accent,
}: { icon: typeof Bell; label: string; value: string | number; accent: string }) => (
  <Card className="overflow-hidden">
    <CardContent className="flex items-center gap-3 p-4">
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${accent}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold leading-none text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </CardContent>
  </Card>
);

const TopList = ({
  title, icon: Icon, entries, emptyLabel,
}: { title: string; icon: typeof Bell; entries: [string, number][]; emptyLabel: string }) => {
  const max = Math.max(1, ...entries.map(([, n]) => n));
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Icon className="h-4 w-4 text-primary" /> {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {entries.length === 0
          ? <p className="py-4 text-center text-xs text-muted-foreground">{emptyLabel}</p>
          : entries.map(([k, n]) => (
            <div key={k} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="truncate font-medium">{k}</span>
                <span className="text-muted-foreground">{n}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(n / max) * 100}%` }} />
              </div>
            </div>
          ))}
      </CardContent>
    </Card>
  );
};

const tally = (rows: any[], pick: (r: any) => string | string[] | null | undefined) => {
  const m = new Map<string, number>();
  rows.forEach((r) => {
    const v = pick(r);
    const arr = Array.isArray(v) ? v : v ? [v] : [];
    arr.forEach((k) => k && m.set(k, (m.get(k) ?? 0) + 1));
  });
  return Array.from(m.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6);
};

const AdminDashboard = () => {
  const { data: stats } = useQuery({
    queryKey: ["admin-dashboard-stats"],
    queryFn: async () => {
      const [alerts, projects, donations, banners, sheikhs, resources, profiles] = await Promise.all([
        supabase.from("alerts_janaza").select("id", { count: "exact", head: true }),
        supabase.from("mosque_projects").select("id, raised", { count: "exact" }),
        supabase.from("donations").select("amount, status").eq("status", "completed"),
        supabase.from("hero_banners").select("id", { count: "exact", head: true }),
        supabase.from("sheikhs").select("id", { count: "exact", head: true }),
        supabase.from("shared_resources").select("id, downloads", { count: "exact" }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
      ]);
      const totalRaised = (donations.data ?? []).reduce((s, d: any) => s + Number(d.amount || 0), 0);
      const totalDownloads = (resources.data ?? []).reduce((s, r: any) => s + (r.downloads || 0), 0);
      return {
        alerts: alerts.count ?? 0,
        projects: projects.count ?? 0,
        donations: (donations.data ?? []).length,
        totalRaised,
        banners: banners.count ?? 0,
        sheikhs: sheikhs.count ?? 0,
        resources: resources.count ?? 0,
        downloads: totalDownloads,
        users: profiles.count ?? 0,
      };
    },
  });

  const { data: demo } = useQuery({
    queryKey: ["admin-demographics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_preferences")
        .select("district, region, hobbies, interests, age_range, account_purpose, has_business, business_category");
      if (error) throw error;
      const rows = data ?? [];
      return {
        total: rows.length,
        districts: tally(rows, (r) => r.district),
        regions: tally(rows, (r) => r.region),
        hobbies: tally(rows, (r) => r.hobbies),
        interests: tally(rows, (r) => r.interests),
        age: tally(rows, (r) => r.age_range),
        purpose: tally(rows, (r) => r.account_purpose),
        businessCats: tally(rows.filter((r: any) => r.has_business), (r) => r.business_category),
        businessTotal: rows.filter((r: any) => r.has_business).length,
      };
    },
  });

  const fmt = (n: number) => new Intl.NumberFormat().format(n);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-base">Overview</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Users} label="Registered users" value={fmt(stats?.users ?? 0)} accent="bg-primary/10 text-primary" />
          <StatCard icon={Bell} label="Alerts posted" value={fmt(stats?.alerts ?? 0)} accent="bg-destructive/10 text-destructive" />
          <StatCard icon={Landmark} label="Mosque projects" value={fmt(stats?.projects ?? 0)} accent="bg-accent/30 text-accent-foreground" />
          <StatCard icon={DollarSign} label="Completed donations" value={fmt(stats?.donations ?? 0)} accent="bg-primary/10 text-primary" />
          <StatCard icon={Heart} label="UGX raised" value={`UGX ${fmt(stats?.totalRaised ?? 0)}`} accent="bg-accent/30 text-accent-foreground" />
          <StatCard icon={Megaphone} label="Hero banners" value={fmt(stats?.banners ?? 0)} accent="bg-primary/10 text-primary" />
          <StatCard icon={Mic} label="Sheikhs listed" value={fmt(stats?.sheikhs ?? 0)} accent="bg-primary/10 text-primary" />
          <StatCard icon={BookOpen} label={`Library · ${fmt(stats?.downloads ?? 0)} dl/views`} value={fmt(stats?.resources ?? 0)} accent="bg-accent/30 text-accent-foreground" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-primary" /> Community insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-xs text-muted-foreground">
            Based on {demo?.total ?? 0} onboarded user{demo?.total === 1 ? "" : "s"} ·
            {" "}{demo?.businessTotal ?? 0} business owner{demo?.businessTotal === 1 ? "" : "s"}
          </p>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <TopList title="Top districts" icon={MapPin} entries={demo?.districts ?? []} emptyLabel="No district data yet" />
            <TopList title="Regions" icon={MapPin} entries={demo?.regions ?? []} emptyLabel="No region data yet" />
            <TopList title="Age groups" icon={Users} entries={demo?.age ?? []} emptyLabel="No age data yet" />
            <TopList title="Top hobbies" icon={Heart} entries={demo?.hobbies ?? []} emptyLabel="No hobby data yet" />
            <TopList title="Top interests" icon={Sparkles} entries={demo?.interests ?? []} emptyLabel="No interest data yet" />
            <TopList title="Account purposes" icon={Sparkles} entries={demo?.purpose ?? []} emptyLabel="No purpose data yet" />
            <TopList title="Business categories" icon={Briefcase} entries={demo?.businessCats ?? []} emptyLabel="No businesses yet" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Quick guide</CardTitle></CardHeader>
        <CardContent className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
          <p>• <span className="text-foreground font-medium">Users</span> — filter by district, hobby, role; view full profiles.</p>
          <p>• <span className="text-foreground font-medium">Library</span> — see downloads, likes & top performers.</p>
          <p>• <span className="text-foreground font-medium">Banners</span> — rotate hero messages on the homepage.</p>
          <p>• <span className="text-foreground font-medium">Projects</span> — manage mosque fundraising goals.</p>
          <p>• <span className="text-foreground font-medium">Alerts</span> — moderate Janaza & SOS posts.</p>
          <p>• <span className="text-foreground font-medium">Donations</span> — track & verify Pesapal transactions.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
