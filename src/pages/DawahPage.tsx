import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Youtube, BadgeCheck, Users, PlayCircle, Trophy, Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface Sheikh {
  id: string;
  rank: number;
  name: string;
  title: string | null;
  country: string | null;
  image_url: string | null;
  channel_name: string | null;
  channel_url: string;
  subscribers: string | null;
  description: string | null;
  verified: boolean;
}

const rankBadge = (rank: number) => {
  if (rank === 1) return "bg-accent text-accent-foreground";
  if (rank === 2) return "bg-muted text-foreground";
  if (rank === 3) return "bg-accent/60 text-accent-foreground";
  return "bg-primary/10 text-primary";
};

const DawahPage = () => {
  const [sheikhs, setSheikhs] = useState<Sheikh[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("sheikhs")
        .select("id,rank,name,title,country,image_url,channel_name,channel_url,subscribers,description,verified")
        .eq("active", true)
        .order("rank", { ascending: true });
      setSheikhs((data ?? []) as Sheikh[]);
      setLoading(false);
    };
    load();
    const channel = supabase
      .channel("sheikhs_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "sheikhs" }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="flex flex-col">
      <section className="relative overflow-hidden bg-gradient-emerald geometric-pattern">
        <div className="relative z-10 px-5 py-10 text-center text-primary-foreground md:py-14">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary-foreground/15 ring-1 ring-primary-foreground/25">
            <Trophy className="h-7 w-7" />
          </div>
          <h1 className="font-display text-2xl font-bold md:text-4xl">Dawah Spreaders</h1>
          <p className="mx-auto mt-2 max-w-xl text-sm opacity-90 md:text-base">
            Top-ranking sheikhs and scholars sharing knowledge, inspiration and guidance worldwide.
          </p>
        </div>
        <svg viewBox="0 0 1440 60" fill="none" className="w-full">
          <path d="M0 60V30C360 0 720 60 1080 30C1260 15 1380 15 1440 20V60H0Z" className="fill-background" />
        </svg>
      </section>

      <section className="px-4 py-6 md:px-6 md:py-10">
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : sheikhs.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">No sheikhs listed yet.</p>
        ) : (
          <div className="mx-auto grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sheikhs.map((s, i) => (
              <motion.article
                key={s.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.35 }}
                className="group relative flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-shadow hover:shadow-emerald"
              >
                <div className={`absolute left-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold shadow-md ${rankBadge(s.rank)}`}>
                  {s.rank <= 3 ? <Star className="h-4 w-4" /> : `#${s.rank}`}
                </div>
                <div className="relative h-44 w-full overflow-hidden bg-muted">
                  {s.image_url && (
                    <img src={s.image_url} alt={`${s.name} profile`} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  )}
                  <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-card to-transparent" />
                </div>
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <div>
                    <h2 className="flex items-center gap-1 font-display text-base font-bold text-foreground">
                      {s.name}
                      {s.verified && <BadgeCheck className="h-4 w-4 text-primary" />}
                    </h2>
                    <p className="text-xs text-muted-foreground">{s.title}</p>
                  </div>
                  {s.description && <p className="line-clamp-2 text-xs text-muted-foreground">{s.description}</p>}
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                    {s.country && <span className="rounded-full bg-muted px-2 py-0.5">{s.country}</span>}
                    {s.subscribers && <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" /> {s.subscribers}</span>}
                  </div>
                  <a href={s.channel_url} target="_blank" rel="noopener noreferrer" className="mt-3">
                    <Button variant="outline" size="sm" className="w-full gap-2">
                      <Youtube className="h-4 w-4 text-destructive" />
                      Visit YouTube
                      <PlayCircle className="ml-auto h-4 w-4 text-primary" />
                    </Button>
                  </a>
                </div>
              </motion.article>
            ))}
          </div>
        )}
        <p className="mx-auto mt-6 max-w-2xl text-center text-xs text-muted-foreground">
          Rankings are curated by the UmmahLink team based on reach, content consistency and community impact.
        </p>
      </section>
    </div>
  );
};

export default DawahPage;
