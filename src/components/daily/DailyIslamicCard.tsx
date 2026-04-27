import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Clock, Moon, BookOpen, Loader2 } from "lucide-react";
import { useDailyVerse, useHijriDate, usePrayerTimes, getNextPrayer } from "@/hooks/useLiveIslamicData";

const formatCountdown = (target: Date) => {
  const ms = target.getTime() - Date.now();
  if (ms <= 0) return "now";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const DailyIslamicCard = () => {
  const { data: prayer, isLoading: loadingPrayer } = usePrayerTimes();
  const { data: hijri } = useHijriDate();
  const { data: verse, isLoading: loadingVerse } = useDailyVerse();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 60000);
    return () => clearInterval(t);
  }, []);

  const next = prayer ? getNextPrayer(prayer.timings) : null;

  return (
    <section className="mt-4 px-4 md:px-6">
      <div className="mx-auto max-w-3xl space-y-3">
        {/* Prayer + Hijri row */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border bg-gradient-to-br from-primary/10 to-primary/5 p-3 shadow-sm"
          >
            <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-primary">
              <Clock className="h-3 w-3" /> Next Prayer
            </div>
            {loadingPrayer || !next ? (
              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" /> Loading…
              </div>
            ) : (
              <>
                <p className="mt-1 font-display text-lg font-bold text-foreground">{next.name}</p>
                <p className="text-xs text-muted-foreground">
                  {next.time} • in <span className="font-semibold text-primary">{formatCountdown(next.date)}</span>
                </p>
              </>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-2xl border bg-gradient-to-br from-accent/20 to-accent/5 p-3 shadow-sm"
          >
            <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-accent-foreground">
              <Moon className="h-3 w-3" /> Hijri Today
            </div>
            {hijri ? (
              <>
                <p className="mt-1 font-display text-lg font-bold text-foreground">
                  {hijri.day} {hijri.monthName}
                </p>
                <p className="text-xs text-muted-foreground">{hijri.year} AH • {hijri.weekday}</p>
              </>
            ) : (
              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" /> …
              </div>
            )}
          </motion.div>
        </div>

        {/* All 5 prayer times strip */}
        {prayer && (
          <div className="grid grid-cols-5 overflow-hidden rounded-2xl border bg-card shadow-sm">
            {(["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"] as const).map((p, i) => (
              <div
                key={p}
                className={`flex flex-col items-center px-1 py-2 ${i < 4 ? "border-r" : ""} ${
                  next?.name === p ? "bg-primary/10" : ""
                }`}
              >
                <span className="text-[10px] font-medium text-muted-foreground">{p}</span>
                <span className="font-display text-xs font-bold text-foreground md:text-sm">
                  {prayer.timings[p]}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Daily Verse */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border bg-card p-4 shadow-emerald"
        >
          <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-primary">
            <BookOpen className="h-3 w-3" /> Verse of the Day
          </div>
          {loadingVerse || !verse ? (
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> Loading verse…
            </div>
          ) : (
            <>
              <p
                dir="rtl"
                lang="ar"
                className="mt-2 text-right font-display text-lg leading-loose text-foreground"
              >
                {verse.arabic}
              </p>
              <p className="mt-2 text-sm italic leading-relaxed text-muted-foreground">
                "{verse.english}"
              </p>
              <p className="mt-2 text-[11px] font-medium text-primary">
                — Surah {verse.surah} ({verse.surahNumber}:{verse.ayah})
              </p>
            </>
          )}
        </motion.div>
      </div>
    </section>
  );
};

export default DailyIslamicCard;
