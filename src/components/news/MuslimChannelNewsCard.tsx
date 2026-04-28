import { motion } from "framer-motion";
import { Newspaper, ExternalLink, PlayCircle } from "lucide-react";
import { useMuslimChannelNews } from "@/hooks/useMuslimChannelNews";
import { Skeleton } from "@/components/ui/skeleton";

const MuslimChannelNewsCard = () => {
  const { data, isLoading, isError } = useMuslimChannelNews();

  return (
    <section className="mt-6 px-4 md:px-6">
      <div className="mx-auto max-w-3xl rounded-2xl border bg-card p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Newspaper className="h-4.5 w-4.5" />
            </span>
            <div>
              <h3 className="font-display text-base font-bold text-foreground">
                Latest News
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Live from Muslim Channel Uganda
              </p>
            </div>
          </div>
          <a
            href="https://muslimchannelug.com/news"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs font-medium text-primary"
          >
            All <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        {isLoading && (
          <div className="flex gap-3 overflow-x-auto scrollbar-none">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-40 w-56 shrink-0 rounded-xl" />
            ))}
          </div>
        )}

        {isError && (
          <p className="py-4 text-center text-xs text-muted-foreground">
            Couldn't load news right now. Please try again later.
          </p>
        )}

        {data && data.length > 0 && (
          <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 scrollbar-none">
            {data.map((item, i) => (
              <motion.a
                key={item.id}
                href={item.watchUrl}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="group block w-56 shrink-0 snap-start overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-emerald"
              >
                <div className="relative aspect-video w-full overflow-hidden bg-muted">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-primary/10">
                      <Newspaper className="h-8 w-8 text-primary" />
                    </div>
                  )}
                  <span className="absolute bottom-1.5 right-1.5 flex items-center gap-1 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-semibold text-foreground">
                    <PlayCircle className="h-3 w-3 text-primary" /> Watch
                  </span>
                  {item.category && (
                    <span className="absolute left-1.5 top-1.5 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                      {item.category}
                    </span>
                  )}
                </div>
                <div className="p-2.5">
                  <h4 className="line-clamp-2 text-xs font-semibold text-foreground">
                    {item.title}
                  </h4>
                </div>
              </motion.a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default MuslimChannelNewsCard;
