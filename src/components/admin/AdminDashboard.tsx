import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Bell, Heart, BookOpen, Users, Mic, Megaphone, Landmark, DollarSign,
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

  const fmt = (n: number) => new Intl.NumberFormat().format(n);

  return (
    <div className="space-y-6 mt-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Overview</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Users} label="Registered users" value={fmt(stats?.users ?? 0)} accent="bg-primary/10 text-primary" />
          <StatCard icon={Bell} label="Alerts posted" value={fmt(stats?.alerts ?? 0)} accent="bg-destructive/10 text-destructive" />
          <StatCard icon={Landmark} label="Mosque projects" value={fmt(stats?.projects ?? 0)} accent="bg-accent/30 text-accent-foreground" />
          <StatCard icon={DollarSign} label="Completed donations" value={fmt(stats?.donations ?? 0)} accent="bg-primary/10 text-primary" />
          <StatCard icon={Heart} label="UGX raised" value={`UGX ${fmt(stats?.totalRaised ?? 0)}`} accent="bg-accent/30 text-accent-foreground" />
          <StatCard icon={Megaphone} label="Hero banners" value={fmt(stats?.banners ?? 0)} accent="bg-primary/10 text-primary" />
          <StatCard icon={Mic} label="Sheikhs listed" value={fmt(stats?.sheikhs ?? 0)} accent="bg-primary/10 text-primary" />
          <StatCard icon={BookOpen} label={`Resources · ${fmt(stats?.downloads ?? 0)} downloads`} value={fmt(stats?.resources ?? 0)} accent="bg-accent/30 text-accent-foreground" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick guide</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
          <p>• <span className="text-foreground font-medium">Banners</span> — rotate hero messages on the homepage.</p>
          <p>• <span className="text-foreground font-medium">Projects</span> — manage mosque fundraising goals.</p>
          <p>• <span className="text-foreground font-medium">Alerts</span> — moderate Janaza & SOS posts.</p>
          <p>• <span className="text-foreground font-medium">Donations</span> — track & verify Pesapal transactions.</p>
          <p>• <span className="text-foreground font-medium">Sheikhs</span> — curate the Dawah directory.</p>
          <p>• <span className="text-foreground font-medium">Resources</span> — moderate uploaded library content.</p>
          <p>• <span className="text-foreground font-medium">Users</span> — assign/revoke admin & moderator roles.</p>
          <p>• <span className="text-foreground font-medium">Settings</span> — app info, prayer defaults, feature flags.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
