import { motion } from "framer-motion";
import { Bell, Heart, BookOpen, ArrowRight, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

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
      <section className="relative overflow-hidden bg-gradient-emerald geometric-pattern">
        <div className="container relative z-10 py-16 md:py-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-2xl text-center"
          >
            <h1 className="font-display text-4xl font-bold tracking-tight text-primary-foreground md:text-6xl">
              Strengthening the{" "}
              <span className="text-gradient-gold">Ummah</span> in Uganda
            </h1>
            <p className="mt-5 text-lg text-primary-foreground/80">
              A community platform for real-time alerts, transparent giving, and shared Islamic knowledge.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link to="/alerts">
                <Button variant="gold" size="lg" className="gap-2">
                  <Bell className="h-4 w-4" /> View Alerts
                </Button>
              </Link>
              <Link to="/donations">
                <Button variant="hero" size="lg" className="gap-2 border border-primary-foreground/20 bg-transparent hover:bg-primary-foreground/10">
                  <Heart className="h-4 w-4" /> Donate Now
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
        {/* Decorative wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" className="w-full">
            <path d="M0 60V30C360 0 720 60 1080 30C1260 15 1380 15 1440 20V60H0Z" fill="hsl(140 20% 98%)" />
          </svg>
        </div>
      </section>

      {/* Stats */}
      <section className="container -mt-2 mb-12">
        <div className="grid grid-cols-3 gap-4 rounded-xl border bg-card p-6 shadow-emerald">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="font-display text-2xl font-bold text-primary md:text-3xl">{stat.value}</p>
              <p className="text-xs text-muted-foreground md:text-sm">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="container pb-16">
        <div className="mb-8 text-center">
          <h2 className="font-display text-3xl font-bold text-foreground">How We Serve</h2>
          <p className="mt-2 text-muted-foreground">Three pillars connecting our community</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
              >
                <Link to={feature.link} className="group block h-full">
                  <div className="flex h-full flex-col rounded-xl border bg-card p-6 transition-shadow hover:shadow-emerald">
                    <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-lg ${feature.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="mb-2 font-display text-xl font-semibold text-foreground">{feature.title}</h3>
                    <p className="flex-1 text-sm text-muted-foreground">{feature.description}</p>
                    <div className="mt-4 flex items-center gap-1 text-sm font-medium text-primary transition-transform group-hover:translate-x-1">
                      Explore <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-gold geometric-pattern">
        <div className="container py-16 text-center">
          <Users className="mx-auto mb-4 h-10 w-10 text-accent-foreground/70" />
          <h2 className="font-display text-3xl font-bold text-accent-foreground">Join the UmmahLink Community</h2>
          <p className="mx-auto mt-3 max-w-md text-accent-foreground/70">
            Stay informed, give transparently, and share knowledge with your fellow Muslims in Uganda.
          </p>
          <Link to="/alerts">
            <Button variant="hero" size="lg" className="mt-6">
              Get Started
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card py-8">
        <div className="container text-center text-sm text-muted-foreground">
          <p>© 2026 UmmahLink Uganda. Built with ❤️ for the Ummah.</p>
          <p className="mt-1">Works offline • Mobile-first • Transparent</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
