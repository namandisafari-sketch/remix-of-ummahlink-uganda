import { motion } from "framer-motion";
import { Bell, Heart, BookOpen, ArrowRight, Mic, MapPin, Sparkles, Calendar, Users } from "lucide-react";
import { Link } from "react-router-dom";
import HeroBanner from "@/components/HeroBanner";
import { useAuth } from "@/contexts/AuthContext";

const quickActions = [
  { icon: Bell, label: "Alerts", link: "/alerts", tint: "bg-urgent/10 text-urgent" },
  { icon: MapPin, label: "Mosques", link: "/map", tint: "bg-primary/10 text-primary" },
  { icon: Heart, label: "Donate", link: "/donations", tint: "bg-accent/20 text-accent-foreground" },
  { icon: BookOpen, label: "Library", link: "/resources", tint: "bg-primary/10 text-primary" },
  { icon: Mic, label: "Dawah", link: "/dawah", tint: "bg-accent/20 text-accent-foreground" },
  { icon: Sparkles, label: "More", link: "/more", tint: "bg-muted text-foreground" },
];

const features = [
  {
    icon: Bell,
    title: "Janaza & SOS",
    description: "Real-time funeral & urgent alerts.",
    link: "/alerts",
    tint: "bg-urgent/10 text-urgent",
  },
  {
    icon: Heart,
    title: "Transparent Giving",
    description: "Support mosque projects with full visibility.",
    link: "/donations",
    tint: "bg-primary/10 text-primary",
  },
  {
    icon: BookOpen,
    title: "Resource Library",
    description: "Islamic guides, audio & PDF notes.",
    link: "/resources",
    tint: "bg-accent/20 text-accent-foreground",
  },
  {
    icon: Mic,
    title: "Dawah Spreaders",
    description: "Top sheikhs & YouTube channels.",
    link: "/dawah",
    tint: "bg-primary/10 text-primary",
  },
  {
    icon: MapPin,
    title: "Masjid Map",
    description: "Find nearby mosques in real time.",
    link: "/map",
    tint: "bg-accent/20 text-accent-foreground",
  },
];

const stats = [
  { value: "50+", label: "Mosques", icon: MapPin },
  { value: "1.2K+", label: "Members", icon: Users },
  { value: "UGX 45M", label: "Raised", icon: Heart },
];

const HomePage = () => {
  const { user } = useAuth();
  const greetingName = (user?.user_metadata?.display_name as string) || user?.email?.split("@")[0] || "Friend";
  const hour = new Date().getHours();
  const salam = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="flex flex-col pb-6">
      {/* App-style greeting strip (mobile only) */}
      <section className="px-4 pt-3 md:hidden">
        <div className="flex items-center justify-between rounded-2xl border bg-card p-3 shadow-sm">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{salam}</p>
            <p className="truncate font-display text-base font-semibold text-foreground">
              As-salāmu ʿalaykum, <span className="text-primary">{greetingName}</span>
            </p>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Calendar className="h-5 w-5" />
          </div>
        </div>
      </section>

      {/* Hero (slimmer on mobile) */}
      <div className="mt-3 md:mt-0">
        <HeroBanner />
      </div>

      {/* Quick Actions — app-style icon grid */}
      <section className="-mt-2 px-4 md:px-6">
        <div className="mx-auto max-w-3xl rounded-2xl border bg-card p-3 shadow-emerald">
          <div className="grid grid-cols-6 gap-1 md:gap-3">
            {quickActions.map((a, i) => {
              const Icon = a.icon;
              return (
                <motion.div
                  key={a.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Link
                    to={a.link}
                    className="group flex flex-col items-center gap-1.5 rounded-xl py-2 transition-colors hover:bg-muted/60"
                  >
                    <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${a.tint} transition-transform group-active:scale-95 md:h-12 md:w-12`}>
                      <Icon className="h-5 w-5 md:h-6 md:w-6" />
                    </span>
                    <span className="text-[10.5px] font-medium text-foreground md:text-xs">{a.label}</span>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats — compact horizontal strip */}
      <section className="mt-4 px-4 md:px-6">
        <div className="mx-auto grid max-w-3xl grid-cols-3 overflow-hidden rounded-2xl border bg-card shadow-sm">
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className={`flex flex-col items-center gap-1 px-2 py-3 ${i < stats.length - 1 ? "border-r" : ""}`}
              >
                <Icon className="h-4 w-4 text-primary" />
                <p className="font-display text-base font-bold text-foreground md:text-xl">{s.value}</p>
                <p className="text-[10px] text-muted-foreground md:text-xs">{s.label}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Features — section header + horizontal scroll on mobile, grid on md+ */}
      <section className="mt-6 md:px-6">
        <div className="mb-3 flex items-center justify-between px-4 md:px-0">
          <div>
            <h2 className="font-display text-lg font-bold text-foreground md:text-2xl">Explore</h2>
            <p className="text-xs text-muted-foreground md:text-sm">Everything in one place</p>
          </div>
          <Link to="/more" className="text-xs font-medium text-primary md:text-sm">
            See all
          </Link>
        </div>

        {/* Mobile: horizontal snap carousel */}
        <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 scrollbar-none md:hidden">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="snap-start"
              >
                <Link
                  to={f.link}
                  className="flex h-32 w-44 flex-col justify-between rounded-2xl border bg-card p-3 shadow-sm transition-shadow active:shadow-emerald"
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${f.tint}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-sm font-semibold text-foreground">{f.title}</h3>
                    <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">{f.description}</p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Desktop: grid */}
        <div className="hidden md:mx-auto md:grid md:max-w-5xl md:grid-cols-2 md:gap-3 lg:grid-cols-3">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <Link to={f.link} className="group block">
                  <div className="flex items-center gap-3 rounded-xl border bg-card p-4 transition-shadow hover:shadow-emerald">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${f.tint}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-display text-base font-semibold text-foreground">{f.title}</h3>
                      <p className="text-xs text-muted-foreground">{f.description}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-primary transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Community CTA — app-card style */}
      <section className="mt-6 px-4 md:px-6">
        <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl bg-gradient-gold geometric-pattern">
          <div className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-background/30 text-accent-foreground">
              <Users className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-display text-base font-bold text-accent-foreground md:text-lg">Join the Community</h3>
              <p className="text-xs text-accent-foreground/80 md:text-sm">Stay informed, give, and learn together.</p>
            </div>
            <Link
              to={user ? "/alerts" : "/auth"}
              className="shrink-0 rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background shadow-sm transition-transform active:scale-95"
            >
              {user ? "Open" : "Join"}
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-6 px-4 text-center text-[10px] text-muted-foreground md:text-xs">
        <p>© 2026 UmmahLink Uganda</p>
        <p className="mt-0.5">Works offline • Mobile-first • Transparent</p>
      </footer>
    </div>
  );
};

export default HomePage;
