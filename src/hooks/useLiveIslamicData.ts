import { useQuery } from "@tanstack/react-query";

const ONE_HOUR = 1000 * 60 * 60;
const ONE_DAY = ONE_HOUR * 24;

// --- Geolocation (browser) ---
export type Coords = { lat: number; lng: number };

const getCoords = (): Promise<Coords> =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("Geolocation unavailable"));
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      { maximumAge: ONE_HOUR, timeout: 8000 }
    );
  });

const cachedCoords = (): Coords | null => {
  try {
    const raw = localStorage.getItem("ummah:coords");
    if (!raw) return null;
    const { lat, lng, ts } = JSON.parse(raw);
    if (Date.now() - ts > ONE_DAY) return null;
    return { lat, lng };
  } catch {
    return null;
  }
};

const saveCoords = (c: Coords) => {
  try {
    localStorage.setItem("ummah:coords", JSON.stringify({ ...c, ts: Date.now() }));
  } catch {}
};

export const useCoords = () =>
  useQuery({
    queryKey: ["coords"],
    staleTime: ONE_HOUR,
    queryFn: async (): Promise<Coords> => {
      const cached = cachedCoords();
      if (cached) return cached;
      // Default to Kampala if denied
      try {
        const c = await getCoords();
        saveCoords(c);
        return c;
      } catch {
        const fallback = { lat: 0.3476, lng: 32.5825 };
        saveCoords(fallback);
        return fallback;
      }
    },
  });

// --- Prayer Times (Aladhan, free, no key) ---
export type PrayerTimes = {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
};

export const usePrayerTimes = () => {
  const { data: coords } = useCoords();
  return useQuery({
    queryKey: ["prayer-times", coords?.lat, coords?.lng],
    enabled: !!coords,
    staleTime: ONE_HOUR * 6,
    queryFn: async (): Promise<{ timings: PrayerTimes; date: string }> => {
      const url = `https://api.aladhan.com/v1/timings?latitude=${coords!.lat}&longitude=${coords!.lng}&method=2`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load prayer times");
      const json = await res.json();
      return { timings: json.data.timings, date: json.data.date.readable };
    },
  });
};

export const getNextPrayer = (timings: PrayerTimes) => {
  const order: (keyof PrayerTimes)[] = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
  const now = new Date();
  for (const name of order) {
    const [h, m] = timings[name].split(":").map(Number);
    const t = new Date();
    t.setHours(h, m, 0, 0);
    if (t > now) return { name, time: timings[name], date: t };
  }
  // Tomorrow's Fajr
  const [h, m] = timings.Fajr.split(":").map(Number);
  const t = new Date();
  t.setDate(t.getDate() + 1);
  t.setHours(h, m, 0, 0);
  return { name: "Fajr" as const, time: timings.Fajr, date: t };
};

// --- Hijri Date (Aladhan) ---
export const useHijriDate = () =>
  useQuery({
    queryKey: ["hijri-date", new Date().toDateString()],
    staleTime: ONE_DAY,
    queryFn: async () => {
      const d = new Date();
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const yyyy = d.getFullYear();
      const res = await fetch(`https://api.aladhan.com/v1/gToH/${dd}-${mm}-${yyyy}`);
      if (!res.ok) throw new Error("Failed to load Hijri date");
      const json = await res.json();
      const h = json.data.hijri;
      return {
        day: h.day,
        monthName: h.month.en,
        year: h.year,
        weekday: h.weekday.en,
        formatted: `${h.day} ${h.month.en} ${h.year} AH`,
      };
    },
  });

// --- Daily Verse (AlQuran.cloud) ---
// Deterministic verse-of-the-day using day-of-year (6236 ayahs total)
export const useDailyVerse = () =>
  useQuery({
    queryKey: ["daily-verse", new Date().toDateString()],
    staleTime: ONE_DAY,
    queryFn: async () => {
      const start = new Date(new Date().getFullYear(), 0, 0);
      const diff = Date.now() - start.getTime();
      const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
      const ayahNumber = (dayOfYear * 17) % 6236 + 1; // pseudo-random spread
      const res = await fetch(
        `https://api.alquran.cloud/v1/ayah/${ayahNumber}/editions/quran-uthmani,en.sahih`
      );
      if (!res.ok) throw new Error("Failed to load daily verse");
      const json = await res.json();
      const arabic = json.data[0];
      const english = json.data[1];
      return {
        arabic: arabic.text as string,
        english: english.text as string,
        surah: arabic.surah.englishName as string,
        surahNumber: arabic.surah.number as number,
        ayah: arabic.numberInSurah as number,
      };
    },
  });
