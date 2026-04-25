import { useState } from "react";
import { motion } from "framer-motion";
import {
  Shield, Landmark, Bell, DollarSign, Loader2, Megaphone, Mic, Users,
  BookOpen, Settings, LayoutDashboard, MapPin, Inbox, Tv, Menu, Plane,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import AdminProjects from "@/components/admin/AdminProjects";
import AdminAlerts from "@/components/admin/AdminAlerts";
import AdminDonations from "@/components/admin/AdminDonations";
import AdminHeroBanners from "@/components/admin/AdminHeroBanners";
import AdminDashboard from "@/components/admin/AdminDashboard";
import AdminSheikhs from "@/components/admin/AdminSheikhs";
import AdminUsers from "@/components/admin/AdminUsers";
import AdminResources from "@/components/admin/AdminResources";
import AdminMosques from "@/components/admin/AdminMosques";
import AdminSubmissions from "@/components/admin/AdminSubmissions";
import AdminTv from "@/components/admin/AdminTv";
import AdminSettings from "@/components/admin/AdminSettings";
import AdminTours from "@/components/admin/AdminTours";
import AdminImamApplications from "@/components/admin/AdminImamApplications";

type SectionKey =
  | "dashboard" | "banners" | "projects" | "alerts" | "donations"
  | "sheikhs" | "tv" | "mosques" | "submissions" | "resources"
  | "users" | "settings" | "tours" | "imams";

const NAV: { key: SectionKey; label: string; icon: typeof Bell; group: string }[] = [
  { key: "dashboard", label: "Overview", icon: LayoutDashboard, group: "Insights" },
  { key: "users", label: "Users", icon: Users, group: "Insights" },
  { key: "banners", label: "Hero Banners", icon: Megaphone, group: "Content" },
  { key: "resources", label: "Library", icon: BookOpen, group: "Content" },
  { key: "tv", label: "TV", icon: Tv, group: "Content" },
  { key: "sheikhs", label: "Sheikhs", icon: Mic, group: "Content" },
  { key: "tours", label: "Hajj & Umrah", icon: Plane, group: "Community" },
  { key: "projects", label: "Projects", icon: Landmark, group: "Community" },
  { key: "donations", label: "Donations", icon: DollarSign, group: "Community" },
  { key: "alerts", label: "Alerts", icon: Bell, group: "Community" },
  { key: "mosques", label: "Mosques", icon: MapPin, group: "Community" },
  { key: "submissions", label: "Submissions", icon: Inbox, group: "Community" },
  { key: "imams", label: "Imam Applications", icon: Mic, group: "Community" },
  { key: "settings", label: "Settings", icon: Settings, group: "System" },
];

const SECTIONS: Record<SectionKey, { title: string; subtitle: string; render: () => JSX.Element }> = {
  dashboard:   { title: "Overview",       subtitle: "Live insights across your community",   render: () => <AdminDashboard /> },
  users:       { title: "User Management",subtitle: "Profiles, demographics & roles",        render: () => <AdminUsers /> },
  banners:     { title: "Hero Banners",   subtitle: "Rotate homepage messaging",             render: () => <AdminHeroBanners /> },
  resources:   { title: "Library",        subtitle: "Audios, videos & document insights",    render: () => <AdminResources /> },
  tv:          { title: "TV",             subtitle: "Live streams & on-demand video",        render: () => <AdminTv /> },
  sheikhs:     { title: "Sheikhs",        subtitle: "Curate the Dawah directory",            render: () => <AdminSheikhs /> },
  tours:       { title: "Hajj & Umrah",   subtitle: "Tour operators, packages & inquiries",  render: () => <AdminTours /> },
  projects:    { title: "Projects",       subtitle: "Mosque fundraising goals",              render: () => <AdminProjects /> },
  donations:   { title: "Donations",      subtitle: "Track & verify Pesapal transactions",   render: () => <AdminDonations /> },
  alerts:      { title: "Alerts",         subtitle: "Moderate Janaza & SOS posts",           render: () => <AdminAlerts /> },
  mosques:     { title: "Mosques",        subtitle: "Verified masjids on the map",           render: () => <AdminMosques /> },
  submissions: { title: "Submissions",    subtitle: "Review user-submitted masjids",         render: () => <AdminSubmissions /> },
  imams:       { title: "Imam Applications", subtitle: "Approve verified imams to post notifications", render: () => <AdminImamApplications /> },
  settings:    { title: "Settings",       subtitle: "App info, prayer defaults, flags",      render: () => <AdminSettings /> },
};

const NavList = ({ active, setActive, onPick }: {
  active: SectionKey;
  setActive: (s: SectionKey) => void;
  onPick?: () => void;
}) => {
  const groups = Array.from(new Set(NAV.map((n) => n.group)));
  return (
    <nav className="space-y-5 p-2">
      {groups.map((g) => (
        <div key={g}>
          <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">{g}</p>
          <div className="space-y-0.5">
            {NAV.filter((n) => n.group === g).map((n) => {
              const Icon = n.icon;
              const isActive = active === n.key;
              return (
                <button
                  key={n.key}
                  onClick={() => { setActive(n.key); onPick?.(); }}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-foreground/80 hover:bg-muted",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{n.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
};

const AdminPage = () => {
  const { user } = useAuth();
  const { isAdmin, loading } = useIsAdmin();
  const navigate = useNavigate();
  const [active, setActive] = useState<SectionKey>("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) { navigate("/auth"); return null; }

  if (!isAdmin) {
    return (
      <div className="container flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Shield className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
          <h2 className="font-display text-2xl font-bold text-foreground">Access Denied</h2>
          <p className="mt-2 text-muted-foreground">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  const section = SECTIONS[active];

  return (
    <div className="flex min-h-[calc(100vh-4rem)] gap-0">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r bg-card/50 md:block">
        <div className="sticky top-0 flex h-full flex-col">
          <div className="flex items-center gap-2 border-b px-4 py-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Shield className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">Admin Portal</p>
              <p className="truncate text-[11px] text-muted-foreground">Full control</p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <NavList active={active} setActive={setActive} />
          </div>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex items-center gap-3 border-b bg-background/95 px-4 py-3 backdrop-blur md:px-6 md:py-4">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <div className="flex items-center gap-2 border-b px-4 py-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                  <Shield className="h-4 w-4 text-primary-foreground" />
                </div>
                <p className="text-sm font-semibold">Admin Portal</p>
              </div>
              <NavList active={active} setActive={setActive} onPick={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>
          <div className="min-w-0">
            <h1 className="truncate font-display text-lg font-bold text-foreground md:text-xl">{section.title}</h1>
            <p className="truncate text-xs text-muted-foreground">{section.subtitle}</p>
          </div>
        </header>

        <motion.main
          key={active}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="flex-1 px-4 py-4 md:px-6 md:py-6"
        >
          {section.render()}
        </motion.main>
      </div>
    </div>
  );
};

export default AdminPage;
