import { motion } from "framer-motion";
import { Bell, Heart, BookOpen, ArrowRight, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import HeroBanner from "@/components/HeroBanner";

const features = [
  {
    icon: Bell,
    title: "Janaza & SOS Alerts",
    description: "Real-time funeral announcements and urgent community needs delivered instantly.",
    link: "/alerts",
    color: "bg-urgent/10 text-urgent",
  },
  {
    icon: Heart,
    title: "Transparent Donations",
    description: "Support mosque projects with full visibility on how funds are used.",
    link: "/donations",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: BookOpen,
    title: "Resource Library",
    description: "Access Islamic guides, PDF notes, and audio lectures shared by the community.",
    link: "/resources",
    color: "bg-accent/20 text-accent-foreground",
  },
];

const stats = [
  { value: "50+", label: "Mosques Connected" },
  { value: "1,200+", label: "Community Members" },
  { value: "UGX 45M", label: "Funds Raised" },
];

const HomePage = () => {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <HeroBanner />

      {/* Stats */}
      <section className="-mt-2 px-4 pb-6 md:px-6">
        <div className="mx-auto grid max-w-3xl grid-cols-3 gap-2 rounded-xl border bg-card p-4 shadow-emerald md:gap-4 md:p-6">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="font-display text-lg font-bold text-primary md:text-2xl">{stat.value}</p>
              <p className="text-[10px] leading-tight text-muted-foreground md:text-sm">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-4 pb-8 md:px-6">
        <div className="mb-4 text-center">
          <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">How We Serve</h2>
          <p className="mt-1 text-sm text-muted-foreground md:text-base">Three pillars connecting our community</p>
        </div>
        <div className="mx-auto flex max-w-5xl flex-col gap-3 md:grid md:grid-cols-3">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
              >
                <Link to={feature.link} className="group block">
                  <div className="flex items-center gap-3 rounded-xl border bg-card p-4 transition-shadow hover:shadow-emerald">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${feature.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-display text-base font-semibold text-foreground">{feature.title}</h3>
                      <p className="text-xs text-muted-foreground">{feature.description}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-primary transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-gold geometric-pattern">
        <div className="px-5 py-10 text-center">
          <Users className="mx-auto mb-3 h-8 w-8 text-accent-foreground/70" />
          <h2 className="font-display text-2xl font-bold text-accent-foreground">Join the Community</h2>
          <p className="mx-auto mt-2 text-sm text-accent-foreground/70">
            Stay informed, give transparently, and share knowledge.
          </p>
          <Link to="/alerts">
            <Button variant="hero" size="lg" className="mt-5 w-full">
              Get Started
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card py-6">
        <div className="px-4 text-center text-xs text-muted-foreground">
          <p>© 2026 UmmahLink Uganda</p>
          <p className="mt-1">Works offline • Mobile-first • Transparent</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
