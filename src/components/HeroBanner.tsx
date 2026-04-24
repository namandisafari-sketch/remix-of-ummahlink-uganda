import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.svg";

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  badge: string | null;
  cta_label: string | null;
  cta_link: string | null;
  image_url: string | null;
  variant: string;
}

const variantBg: Record<string, string> = {
  emerald: "bg-gradient-emerald",
  gold: "bg-gradient-gold",
  urgent: "bg-gradient-to-br from-urgent via-urgent/90 to-urgent/70",
};

const variantText: Record<string, string> = {
  emerald: "text-primary-foreground",
  gold: "text-accent-foreground",
  urgent: "text-urgent-foreground",
};

const HeroBanner = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("hero_banners")
        .select("id,title,subtitle,badge,cta_label,cta_link,image_url,variant")
        .eq("active", true)
        .order("sort_order", { ascending: true });
      setBanners(data ?? []);
      setLoading(false);
    };
    load();

    const channel = supabase
      .channel("hero_banners_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "hero_banners" }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (banners.length < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % banners.length), 6000);
    return () => clearInterval(t);
  }, [banners.length]);

  if (loading || banners.length === 0) {
    return (
      <section className="relative h-[320px] animate-pulse bg-muted md:h-[420px]" aria-hidden />
    );
  }

  const banner = banners[index];
  const bg = variantBg[banner.variant] ?? variantBg.emerald;
  const text = variantText[banner.variant] ?? variantText.emerald;

  const next = () => setIndex((i) => (i + 1) % banners.length);
  const prev = () => setIndex((i) => (i - 1 + banners.length) % banners.length);

  return (
    <section className={`relative overflow-hidden geometric-pattern ${bg}`}>
      {banner.image_url && (
        <div
          className="absolute inset-0 opacity-20"
          style={{ backgroundImage: `url(${banner.image_url})`, backgroundSize: "cover", backgroundPosition: "center" }}
        />
      )}
      <div className="relative z-10 px-5 py-10 md:py-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={banner.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.5 }}
            className={`mx-auto max-w-2xl text-center ${text}`}
          >
            {banner.badge && (
              <span className="mb-3 inline-flex items-center gap-1 rounded-full bg-background/15 px-3 py-1 text-xs font-semibold backdrop-blur">
                <Sparkles className="h-3 w-3" /> {banner.badge}
              </span>
            )}
            <img src={logo} alt="UmmahLink" className="mx-auto mb-3 h-14 w-14 rounded-xl bg-background/10 p-1.5 shadow-lg md:h-20 md:w-20" />
            <h1 className="font-display text-2xl font-bold tracking-tight md:text-4xl lg:text-5xl">
              {banner.title}
            </h1>
            {banner.subtitle && (
              <p className="mt-3 text-sm opacity-90 md:text-base">{banner.subtitle}</p>
            )}
            {banner.cta_label && banner.cta_link && (
              <div className="mt-5 flex justify-center">
                <Link to={banner.cta_link}>
                  <Button variant={banner.variant === "gold" ? "hero" : "gold"} size="lg" className="gap-2">
                    {banner.cta_label} <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {banners.length > 1 && (
          <>
            <div className="mt-6 flex items-center justify-center gap-2">
              {banners.map((b, i) => (
                <button
                  key={b.id}
                  aria-label={`Go to slide ${i + 1}`}
                  onClick={() => setIndex(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === index ? "w-8 bg-background/90" : "w-2 bg-background/40"
                  }`}
                />
              ))}
            </div>
            <button
              onClick={prev}
              aria-label="Previous slide"
              className="absolute left-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-background/15 p-2 text-current backdrop-blur hover:bg-background/25 md:block"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={next}
              aria-label="Next slide"
              className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-background/15 p-2 text-current backdrop-blur hover:bg-background/25 md:block"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 60" fill="none" className="w-full">
          <path d="M0 60V30C360 0 720 60 1080 30C1260 15 1380 15 1440 20V60H0Z" className="fill-background" />
        </svg>
      </div>
    </section>
  );
};

export default HeroBanner;
