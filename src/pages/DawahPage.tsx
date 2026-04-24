import { motion } from "framer-motion";
import { Youtube, BadgeCheck, Users, PlayCircle, Trophy, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Sheikh {
  rank: number;
  name: string;
  title: string;
  country: string;
  image: string;
  channel: string;
  channelUrl: string;
  subscribers: string;
  description: string;
  verified?: boolean;
}

// Top dawah spreaders (publicly known scholars). Profile images sourced from Unsplash placeholders.
const SHEIKHS: Sheikh[] = [
  {
    rank: 1,
    name: "Mufti Menk",
    title: "Grand Mufti of Zimbabwe",
    country: "Zimbabwe",
    image: "https://images.unsplash.com/photo-1564564321837-a57b7070ac4f?w=400&h=400&fit=crop",
    channel: "Mufti Menk",
    channelUrl: "https://www.youtube.com/@muftimenkofficial",
    subscribers: "3.2M",
    description: "Inspirational reminders, life lessons and Quranic reflections in English.",
    verified: true,
  },
  {
    rank: 2,
    name: "Sheikh Omar Suleiman",
    title: "Founder, Yaqeen Institute",
    country: "USA",
    image: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&h=400&fit=crop",
    channel: "Yaqeen Institute",
    channelUrl: "https://www.youtube.com/@yaqeeninstituteofficial",
    subscribers: "1.4M",
    description: "Research-based Islamic content tackling modern challenges.",
    verified: true,
  },
  {
    rank: 3,
    name: "Sheikh Assim Al-Hakeem",
    title: "Scholar & Lecturer",
    country: "Saudi Arabia",
    image: "https://images.unsplash.com/photo-1545167622-3a6ac756afa4?w=400&h=400&fit=crop",
    channel: "assimalhakeem",
    channelUrl: "https://www.youtube.com/@assimalhakeem",
    subscribers: "1.1M",
    description: "Q&A sessions and fiqh rulings rooted in Quran and Sunnah.",
    verified: true,
  },
  {
    rank: 4,
    name: "Nouman Ali Khan",
    title: "Founder, Bayyinah Institute",
    country: "USA",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
    channel: "Bayyinah Institute",
    channelUrl: "https://www.youtube.com/@BayyinahInstitute",
    subscribers: "950K",
    description: "Linguistic miracle of the Quran and Arabic-based tafsir.",
    verified: true,
  },
  {
    rank: 5,
    name: "Dr. Zakir Naik",
    title: "Comparative Religion Scholar",
    country: "India",
    image: "https://images.unsplash.com/photo-1542178243-bc20204b769f?w=400&h=400&fit=crop",
    channel: "Dr Zakir Naik",
    channelUrl: "https://www.youtube.com/@drzakiknaik",
    subscribers: "2.5M",
    description: "Comparative religion lectures and dawah dialogues.",
    verified: true,
  },
  {
    rank: 6,
    name: "Sheikh Yasir Qadhi",
    title: "Dean, The Islamic Seminary of America",
    country: "USA",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop",
    channel: "Yasir Qadhi",
    channelUrl: "https://www.youtube.com/@YasirQadhi",
    subscribers: "780K",
    description: "Seerah series, theology and contemporary Islamic discourse.",
    verified: true,
  },
  {
    rank: 7,
    name: "Sheikh Muhammad Mutumba",
    title: "Ugandan Scholar",
    country: "Uganda",
    image: "https://images.unsplash.com/photo-1463453091185-61582044d556?w=400&h=400&fit=crop",
    channel: "Sheikh Mutumba",
    channelUrl: "https://www.youtube.com/results?search_query=sheikh+mutumba",
    subscribers: "210K",
    description: "Local dawah in Luganda — accessible reminders for Ugandan Muslims.",
  },
  {
    rank: 8,
    name: "Sheikh Hamza Yusuf",
    title: "Co-founder, Zaytuna College",
    country: "USA",
    image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop",
    channel: "Sandala Productions",
    channelUrl: "https://www.youtube.com/@sandalaproductions",
    subscribers: "420K",
    description: "Classical Islamic scholarship and traditional sciences.",
    verified: true,
  },
];

const rankBadge = (rank: number) => {
  if (rank === 1) return "bg-accent text-accent-foreground";
  if (rank === 2) return "bg-muted text-foreground";
  if (rank === 3) return "bg-accent/60 text-accent-foreground";
  return "bg-primary/10 text-primary";
};

const DawahPage = () => {
  return (
    <div className="flex flex-col">
      {/* Hero */}
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

      {/* List */}
      <section className="px-4 py-6 md:px-6 md:py-10">
        <div className="mx-auto grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SHEIKHS.map((s, i) => (
            <motion.article
              key={s.rank}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.35 }}
              className="group relative flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-shadow hover:shadow-emerald"
            >
              {/* Rank ribbon */}
              <div
                className={`absolute left-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold shadow-md ${rankBadge(
                  s.rank
                )}`}
                aria-label={`Rank ${s.rank}`}
              >
                {s.rank <= 3 ? <Star className="h-4 w-4" /> : `#${s.rank}`}
              </div>

              {/* Profile image */}
              <div className="relative h-44 w-full overflow-hidden bg-muted">
                <img
                  src={s.image}
                  alt={`${s.name} profile`}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-card to-transparent" />
              </div>

              <div className="flex flex-1 flex-col gap-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="flex items-center gap-1 font-display text-base font-bold text-foreground">
                      {s.name}
                      {s.verified && <BadgeCheck className="h-4 w-4 text-primary" />}
                    </h2>
                    <p className="text-xs text-muted-foreground">{s.title}</p>
                  </div>
                </div>

                <p className="line-clamp-2 text-xs text-muted-foreground">{s.description}</p>

                <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="rounded-full bg-muted px-2 py-0.5">{s.country}</span>
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3 w-3" /> {s.subscribers}
                  </span>
                </div>

                <a
                  href={s.channelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3"
                >
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

        <p className="mx-auto mt-6 max-w-2xl text-center text-xs text-muted-foreground">
          Rankings are curated based on reach, content consistency and community impact. Always verify
          knowledge with qualified local scholars.
        </p>
      </section>
    </div>
  );
};

export default DawahPage;
