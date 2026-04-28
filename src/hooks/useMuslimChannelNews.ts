import { useQuery } from "@tanstack/react-query";

const ENDPOINT =
  "https://muslimchanneladmin.info/api/tv/tv_videos/?get_recent=true&page=1";

export type NewsItem = {
  id: number;
  title: string;
  image: string | null;
  category: string | null;
  videoUrl: string | null;
  watchUrl: string;
  createdAt: string | null;
};

type ApiVideo = {
  id: number;
  title: string;
  image: string | null;
  video: string | null;
  category?: { name?: string } | null;
  date_created?: string | null;
  created_at?: string | null;
  youtube_id?: string | null;
};

export const useMuslimChannelNews = () =>
  useQuery({
    queryKey: ["mc-news"],
    staleTime: 1000 * 60 * 15, // 15 min
    queryFn: async (): Promise<NewsItem[]> => {
      const res = await fetch(ENDPOINT);
      if (!res.ok) throw new Error("Failed to load news");
      const json = await res.json();
      const results: ApiVideo[] = json.results || [];
      return results.slice(0, 10).map((v) => ({
        id: v.id,
        title: v.title,
        image: v.image,
        category: v.category?.name ?? null,
        videoUrl: v.video,
        watchUrl: `https://muslimchannelug.com/tv/video/${v.id}`,
        createdAt: v.date_created || v.created_at || null,
      }));
    },
  });
