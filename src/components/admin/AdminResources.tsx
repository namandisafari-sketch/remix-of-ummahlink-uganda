import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Trash2, Download, FileText, Plus, ExternalLink, Video, Headphones } from "lucide-react";
import { toast } from "sonner";

const QURAN_CATEGORIES = ["Quran", "Fiqh", "Hadith", "History", "Arabic", "Youth"];

const isLikelyAudioUrl = (url: string) =>
  /\.(mp3|m4a|aac|wav|ogg|opus)(\?|$)/i.test(url);

// Match TikTok video URLs and extract the numeric video id
const extractTikTokVideoId = (url: string): string | null => {
  const m = url.match(/\/video\/(\d+)/);
  return m ? m[1] : null;
};

// Fetch oEmbed metadata for a TikTok URL (title, thumbnail, author)
const fetchTikTokOEmbed = async (url: string) => {
  const res = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`);
  if (!res.ok) throw new Error("Could not fetch TikTok metadata");
  return res.json() as Promise<{
    title?: string;
    author_name?: string;
    author_url?: string;
    thumbnail_url?: string;
  }>;
};

const AdminResources = () => {
  const qc = useQueryClient();
  const { user } = useAuth();

  const [tiktokUrl, setTiktokUrl] = useState("");
  const [tiktokTitle, setTiktokTitle] = useState("");
  const [tiktokAuthor, setTiktokAuthor] = useState("@quranpw");
  const [tiktokCategory, setTiktokCategory] = useState("Quran");
  const [tiktokThumb, setTiktokThumb] = useState<string | undefined>();
  const [fetching, setFetching] = useState(false);
  const [saving, setSaving] = useState(false);

  // Direct audio link state
  const [audioUrl, setAudioUrl] = useState("");
  const [audioTitle, setAudioTitle] = useState("");
  const [audioAuthor, setAudioAuthor] = useState("Quran PathWay");
  const [audioCategory, setAudioCategory] = useState("Quran");
  const [audioSaving, setAudioSaving] = useState(false);
  const [bulkAudio, setBulkAudio] = useState("");
  const [bulkSaving, setBulkSaving] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-resources"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shared_resources")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const handleFetchMeta = async () => {
    const url = tiktokUrl.trim();
    if (!extractTikTokVideoId(url)) {
      toast.error("Paste a full TikTok video URL (e.g. https://www.tiktok.com/@quranpw/video/123…)");
      return;
    }
    setFetching(true);
    try {
      const meta = await fetchTikTokOEmbed(url);
      if (meta.title) setTiktokTitle(meta.title);
      if (meta.author_name) setTiktokAuthor(meta.author_name);
      if (meta.thumbnail_url) setTiktokThumb(meta.thumbnail_url);
      toast.success("Loaded video info");
    } catch (e: any) {
      toast.error(e.message || "Could not load video info");
    } finally {
      setFetching(false);
    }
  };

  const handleAddTikTok = async () => {
    if (!user) return;
    const url = tiktokUrl.trim();
    if (!extractTikTokVideoId(url)) {
      toast.error("Invalid TikTok URL");
      return;
    }
    if (!tiktokTitle.trim()) {
      toast.error("Title is required");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("shared_resources").insert({
      user_id: user.id,
      title: tiktokTitle.trim(),
      author: tiktokAuthor.trim() || "@quranpw",
      type: "video",
      category: tiktokCategory,
      external_url: url,
      embed_provider: "tiktok",
      thumbnail_url: tiktokThumb || null,
      file_path: null,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Quran video added");
    setTiktokUrl("");
    setTiktokTitle("");
    setTiktokThumb(undefined);
    qc.invalidateQueries({ queryKey: ["admin-resources"] });
    qc.invalidateQueries({ queryKey: ["resources"] });
  };

  const remove = async (id: string, file_path: string | null) => {
    if (!confirm("Delete this resource permanently?")) return;
    if (file_path) {
      await supabase.storage.from("resources").remove([file_path]).catch(() => null);
    }
    const { error } = await supabase.from("shared_resources").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Resource deleted");
    qc.invalidateQueries({ queryKey: ["admin-resources"] });
    qc.invalidateQueries({ queryKey: ["resources"] });
  };

  if (isLoading)
    return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="mt-4 space-y-6">
      {/* Add Quran TikTok video */}
      <Card>
        <CardContent className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <Video className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Add Quran video (TikTok)</h3>
          </div>
          <p className="mb-3 text-xs text-muted-foreground">
            Paste a TikTok video URL (e.g. from{" "}
            <a href="https://www.tiktok.com/@quranpw" target="_blank" rel="noreferrer" className="underline">
              @quranpw
            </a>
            ) and we'll fetch the title and thumbnail automatically.
          </p>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={tiktokUrl}
                onChange={(e) => setTiktokUrl(e.target.value)}
                placeholder="https://www.tiktok.com/@quranpw/video/7…"
              />
              <Button type="button" onClick={handleFetchMeta} disabled={fetching || !tiktokUrl.trim()} variant="outline">
                {fetching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Fetch info"}
              </Button>
            </div>

            {tiktokThumb && (
              <img src={tiktokThumb} alt="" className="h-32 w-auto rounded-md border object-cover" />
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label className="text-xs">Title</Label>
                <Input
                  value={tiktokTitle}
                  onChange={(e) => setTiktokTitle(e.target.value)}
                  placeholder="e.g. Surah Al-Fatiha — Part 1"
                />
              </div>
              <div>
                <Label className="text-xs">Reciter / Author</Label>
                <Input
                  value={tiktokAuthor}
                  onChange={(e) => setTiktokAuthor(e.target.value)}
                  placeholder="@quranpw"
                />
              </div>
              <div>
                <Label className="text-xs">Category</Label>
                <Select value={tiktokCategory} onValueChange={setTiktokCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {QURAN_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={handleAddTikTok} disabled={saving || !tiktokUrl.trim() || !tiktokTitle.trim()} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add to Resources
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* All resources list */}
      <div>
        <p className="mb-3 text-sm text-muted-foreground">{data?.length ?? 0} resources in the library.</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data?.map((r: any) => {
            const isExternal = !!r.external_url;
            const url = isExternal
              ? r.external_url
              : r.file_path
              ? supabase.storage.from("resources").getPublicUrl(r.file_path).data.publicUrl
              : "#";
            return (
              <Card key={r.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      {r.type === "video" ? <Video className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-foreground">{r.title}</p>
                      <p className="truncate text-xs text-muted-foreground">by {r.author}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        <Badge variant="outline" className="text-[10px]">{r.type}</Badge>
                        <Badge variant="secondary" className="text-[10px]">{r.category}</Badge>
                        {r.embed_provider && <Badge variant="outline" className="text-[10px]">{r.embed_provider}</Badge>}
                        {r.file_size && <Badge variant="outline" className="text-[10px]">{r.file_size}</Badge>}
                        <Badge variant="outline" className="text-[10px]">{r.downloads} {r.type === "video" ? "views" : "dl"}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <a href={url} target="_blank" rel="noopener noreferrer" className="flex-1">
                      <Button size="sm" variant="outline" className="w-full gap-1">
                        {isExternal ? <ExternalLink className="h-3 w-3" /> : <Download className="h-3 w-3" />}
                        {isExternal ? "Open" : "Download"}
                      </Button>
                    </a>
                    <Button size="sm" variant="outline" onClick={() => remove(r.id, r.file_path)} className="text-destructive">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {data?.length === 0 && <p className="col-span-full py-10 text-center text-sm text-muted-foreground">No resources yet.</p>}
        </div>
      </div>
    </div>
  );
};

export default AdminResources;
