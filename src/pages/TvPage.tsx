import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tv, Radio, Loader2, PlayCircle } from "lucide-react";
import { useState } from "react";

interface TvItem {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  type: string;
  platform: string;
  is_live: boolean;
  scheduled_at: string | null;
  views: number;
}

const getEmbedUrl = (url: string, platform: string) => {
  try {
    if (platform === "youtube" || url.includes("youtu")) {
      const m = url.match(/(?:youtube\.com\/(?:watch\?v=|live\/|embed\/)|youtu\.be\/)([\w-]+)/);
      if (m) return `https://www.youtube.com/embed/${m[1]}?autoplay=1&rel=0`;
    }
    if (platform === "facebook" || url.includes("facebook")) {
      return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&autoplay=1`;
    }
    return url;
  } catch {
    return url;
  }
};

const getThumb = (item: TvItem) => {
  if (item.thumbnail_url) return item.thumbnail_url;
  const m = item.video_url.match(/(?:youtube\.com\/(?:watch\?v=|live\/|embed\/)|youtu\.be\/)([\w-]+)/);
  if (m) return `https://i.ytimg.com/vi/${m[1]}/hqdefault.jpg`;
  return null;
};

const TvPage = () => {
  const [active, setActive] = useState<TvItem | null>(null);

  const { data: items, isLoading } = useQuery({
    queryKey: ["tv-content"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tv_content")
        .select("*")
        .eq("active", true)
        .order("is_live", { ascending: false })
        .order("sort_order")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as TvItem[];
    },
  });

  const liveItems = items?.filter((i) => i.is_live) ?? [];
  const videoItems = items?.filter((i) => !i.is_live) ?? [];

  return (
    <div className="px-4 py-6 md:px-6 md:py-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Tv className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">UmmahLink TV</h1>
            <p className="text-sm text-muted-foreground">Live streams, lectures, and Islamic videos</p>
          </div>
        </div>
      </motion.div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}

      {/* Active player */}
      {active && (
        <Card className="mb-6 overflow-hidden">
          <div className="aspect-video w-full bg-black">
            <iframe
              src={getEmbedUrl(active.video_url, active.platform)}
              title={active.title}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              className="h-full w-full"
            />
          </div>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="font-display text-lg font-bold text-foreground">{active.title}</h2>
                {active.description && <p className="mt-1 text-sm text-muted-foreground">{active.description}</p>}
              </div>
              {active.is_live && <Badge className="gap-1 bg-urgent text-urgent-foreground"><Radio className="h-3 w-3" /> LIVE</Badge>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Live now */}
      {liveItems.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 flex items-center gap-2 font-display text-xl font-bold text-foreground">
            <Radio className="h-5 w-5 text-urgent" /> Live Now
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {liveItems.map((item) => (
              <TvCard key={item.id} item={item} onPlay={() => setActive(item)} />
            ))}
          </div>
        </section>
      )}

      {/* Videos */}
      {videoItems.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-xl font-bold text-foreground">Videos</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {videoItems.map((item) => (
              <TvCard key={item.id} item={item} onPlay={() => setActive(item)} />
            ))}
          </div>
        </section>
      )}

      {!isLoading && (items?.length ?? 0) === 0 && (
        <div className="py-16 text-center">
          <Tv className="mx-auto mb-3 h-12 w-12 text-muted-foreground/40" />
          <p className="text-muted-foreground">No videos yet. Check back soon, in shaa Allah.</p>
        </div>
      )}
    </div>
  );
};

const TvCard = ({ item, onPlay }: { item: TvItem; onPlay: () => void }) => {
  const thumb = getThumb(item);
  return (
    <button onClick={onPlay} className="group text-left">
      <Card className="overflow-hidden transition hover:shadow-lg">
        <div className="relative aspect-video w-full overflow-hidden bg-muted">
          {thumb ? (
            <img src={thumb} alt={item.title} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" />
          ) : (
            <div className="flex h-full w-full items-center justify-center"><Tv className="h-8 w-8 text-muted-foreground/40" /></div>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition group-hover:opacity-100">
            <PlayCircle className="h-12 w-12 text-white" />
          </div>
          {item.is_live && (
            <Badge className="absolute left-2 top-2 gap-1 bg-urgent text-urgent-foreground">
              <Radio className="h-3 w-3" /> LIVE
            </Badge>
          )}
        </div>
        <CardContent className="p-3">
          <p className="line-clamp-2 font-semibold text-foreground">{item.title}</p>
          {item.description && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.description}</p>}
        </CardContent>
      </Card>
    </button>
  );
};

export default TvPage;
