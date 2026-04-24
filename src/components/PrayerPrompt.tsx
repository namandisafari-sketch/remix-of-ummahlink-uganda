import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Check, X, Sunrise, Sun, Sunset, Stars, Settings2, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import adhanSrc from "@/assets/adhan.mp3";

type PrayerKey = "fajr" | "dhuhr" | "asr" | "maghrib" | "isha";

interface PrayerConfig {
  key: PrayerKey;
  label: string;
  time: string; // HH:mm
  enabled: boolean;
  Icon: typeof Sun;
  arabic: string;
}

const DEFAULTS: PrayerConfig[] = [
  { key: "fajr", label: "Fajr", arabic: "الفجر", time: "05:15", enabled: true, Icon: Sunrise },
  { key: "dhuhr", label: "Dhuhr", arabic: "الظهر", time: "12:45", enabled: true, Icon: Sun },
  { key: "asr", label: "Asr", arabic: "العصر", time: "16:00", enabled: true, Icon: Sun },
  { key: "maghrib", label: "Maghrib", arabic: "المغرب", time: "18:30", enabled: true, Icon: Sunset },
  { key: "isha", label: "Isha", arabic: "العشاء", time: "19:45", enabled: true, Icon: Stars },
];

const STORAGE_KEY = "ummahlink.prayerSchedule.v1";
const FIRED_KEY = "ummahlink.prayerFired.v1";

const loadSchedule = (): PrayerConfig[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Array<Pick<PrayerConfig, "key" | "time" | "enabled">>;
    return DEFAULTS.map((d) => {
      const found = parsed.find((p) => p.key === d.key);
      return found ? { ...d, time: found.time, enabled: found.enabled } : d;
    });
  } catch {
    return DEFAULTS;
  }
};

const todayKey = () => new Date().toISOString().slice(0, 10);

const PrayerPrompt = () => {
  const [open, setOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [schedule, setSchedule] = useState<PrayerConfig[]>(loadSchedule);
  const [activePrayer, setActivePrayer] = useState<PrayerConfig | null>(null);

  // Save schedule
  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(schedule.map(({ key, time, enabled }) => ({ key, time, enabled })))
    );
  }, [schedule]);

  // Pick the most recent prayer (within last 90 min) on fresh load
  const initialPrayer = useMemo(() => {
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const candidates = schedule
      .filter((p) => p.enabled)
      .map((p) => {
        const [h, m] = p.time.split(":").map(Number);
        return { p, mins: h * 60 + m };
      })
      .filter(({ mins }) => nowMin - mins >= 0 && nowMin - mins <= 90)
      .sort((a, b) => b.mins - a.mins);
    return candidates[0]?.p ?? null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fresh-load prompt
  useEffect(() => {
    const t = setTimeout(() => {
      setActivePrayer(initialPrayer);
      setOpen(true);
    }, 600);
    return () => clearTimeout(t);
  }, [initialPrayer]);

  // Adhan audio
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [muted, setMuted] = useState<boolean>(() => localStorage.getItem("ummahlink.adhan.muted") === "1");

  useEffect(() => {
    if (!audioRef.current) {
      const a = new Audio(adhanSrc);
      a.preload = "auto";
      audioRef.current = a;
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("ummahlink.adhan.muted", muted ? "1" : "0");
    if (muted && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [muted]);

  const playAdhan = () => {
    const a = audioRef.current;
    if (!a || muted) return;
    a.currentTime = 0;
    a.play().catch(() => {
      // Browsers block autoplay until user interacts — silent fail.
    });
  };

  const stopAdhan = () => {
    const a = audioRef.current;
    if (!a) return;
    a.pause();
    a.currentTime = 0;
  };

  // Schedule checker — fire once per prayer per day
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, "0");
      const mm = String(now.getMinutes()).padStart(2, "0");
      const current = `${hh}:${mm}`;
      const fired: Record<string, string[]> = JSON.parse(
        localStorage.getItem(FIRED_KEY) || "{}"
      );
      const key = todayKey();
      const firedToday = fired[key] || [];
      const due = schedule.find((p) => p.enabled && p.time === current && !firedToday.includes(p.key));
      if (due) {
        fired[key] = [...firedToday, due.key];
        localStorage.setItem(FIRED_KEY, JSON.stringify({ [key]: fired[key] }));
        setActivePrayer(due);
        setOpen(true);
        playAdhan();
      }
    };
    const id = setInterval(tick, 30_000);
    tick();
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schedule, muted]);

  const close = () => {
    stopAdhan();
    setOpen(false);
    setShowSettings(false);
  };

  const updatePrayer = (key: PrayerKey, patch: Partial<Pick<PrayerConfig, "time" | "enabled">>) => {
    setSchedule((prev) => prev.map((p) => (p.key === key ? { ...p, ...patch } : p)));
  };

  const HeaderIcon = activePrayer?.Icon ?? Moon;
  const headerTitle = activePrayer ? `${activePrayer.label} time` : "Wasadde?";
  const headerSub = activePrayer ? `It's time for ${activePrayer.label} (${activePrayer.arabic})` : "Did you pray?";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-foreground/40 px-4 pb-6 backdrop-blur-sm sm:items-center sm:pb-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
        >
          <motion.div
            role="dialog"
            aria-labelledby="prayer-prompt-title"
            onClick={(e) => e.stopPropagation()}
            initial={{ y: 80, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 60, opacity: 0, scale: 0.97 }}
            transition={{ type: "spring", damping: 22, stiffness: 260 }}
            className="relative w-full max-w-sm overflow-hidden rounded-2xl border bg-card shadow-emerald"
          >
            <button
              onClick={close}
              aria-label="Dismiss"
              className="absolute right-3 top-3 z-10 rounded-full bg-primary-foreground/15 p-1.5 text-primary-foreground/90 backdrop-blur-sm transition-colors hover:bg-primary-foreground/25"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Calming gradient header with soft glowing orbs */}
            <div className="relative overflow-hidden px-5 pb-6 pt-8 text-center">
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(160deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.85) 45%, hsl(160 60% 25%) 100%)",
                }}
              />
              {/* Soft ambient orbs */}
              <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-primary-foreground/10 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-12 -right-8 h-44 w-44 rounded-full bg-accent/20 blur-3xl" />
              <div className="pointer-events-none absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-foreground/5 blur-2xl" />

              <div className="relative">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary-foreground/15 ring-1 ring-primary-foreground/25 backdrop-blur-sm">
                  <HeaderIcon className="h-7 w-7 text-primary-foreground" />
                </div>
                <h2
                  id="prayer-prompt-title"
                  className="font-display text-2xl font-bold text-primary-foreground"
                >
                  {headerTitle}
                </h2>
                <p className="mt-1 text-sm text-primary-foreground/85">{headerSub}</p>
              </div>
            </div>

            {!showSettings ? (
              <div className="space-y-2 p-5">
                <Button variant="hero" size="lg" className="w-full" onClick={close}>
                  <Check className="h-4 w-4" /> Yes, Alhamdulillah
                </Button>
                <Button variant="outline" size="lg" className="w-full" onClick={close}>
                  Not yet — remind me
                </Button>
                <button
                  onClick={() => setShowSettings(true)}
                  className="flex w-full items-center justify-center gap-1.5 pt-1 text-xs font-medium text-primary hover:underline"
                >
                  <Settings2 className="h-3.5 w-3.5" /> Set prayer schedule
                </button>
                <p className="pt-1 text-center text-[11px] text-muted-foreground">
                  "Indeed, prayer prohibits immorality and wrongdoing." — Qur'an 29:45
                </p>
              </div>
            ) : (
              <div className="space-y-3 p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">Daily prayer schedule</p>
                  <button
                    onClick={() => setSchedule(DEFAULTS)}
                    className="text-[11px] text-muted-foreground hover:text-primary"
                  >
                    Reset
                  </button>
                </div>
                <div className="space-y-2">
                  {schedule.map((p) => {
                    const Icon = p.Icon;
                    return (
                      <div
                        key={p.key}
                        className="flex items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2"
                      >
                        <Icon className="h-4 w-4 shrink-0 text-primary" />
                        <Label className="flex-1 text-sm font-medium" htmlFor={`time-${p.key}`}>
                          {p.label}
                        </Label>
                        <Input
                          id={`time-${p.key}`}
                          type="time"
                          value={p.time}
                          onChange={(e) => updatePrayer(p.key, { time: e.target.value })}
                          className="h-8 w-[110px] text-xs"
                          disabled={!p.enabled}
                        />
                        <Switch
                          checked={p.enabled}
                          onCheckedChange={(v) => updatePrayer(p.key, { enabled: v })}
                        />
                      </div>
                    );
                  })}
                </div>
                <Button variant="hero" size="lg" className="w-full" onClick={() => setShowSettings(false)}>
                  Save & close
                </Button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PrayerPrompt;
