import { useState } from "react";
import { motion } from "framer-motion";
import { Search, FileText, Headphones, BookOpen, Download, Upload, Loader2, Video, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

type ResourceType = "pdf" | "audio" | "guide" | "video";

const categories = ["All", "Quran", "Fiqh", "Hadith", "History", "Arabic", "Youth"];

const typeIcons: Record<string, typeof FileText> = {
  pdf: FileText,
  audio: Headphones,
  guide: BookOpen,
  video: Video,
};

const typeColors: Record<string, string> = {
  pdf: "bg-primary/10 text-primary",
  audio: "bg-accent/20 text-accent-foreground",
  guide: "bg-emerald-light text-foreground",
  video: "bg-destructive/10 text-destructive",
};

// Build a TikTok embed URL from any TikTok video URL
const tiktokEmbedUrl = (url: string): string | null => {
  // Match https://www.tiktok.com/@user/video/123 or https://vm.tiktok.com/...
  const m = url.match(/\/video\/(\d+)/);
  if (m) return `https://www.tiktok.com/embed/v2/${m[1]}`;
  return null;
};

const ResourcesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [showUpload, setShowUpload] = useState(false);

  // Upload state
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadType, setUploadType] = useState<ResourceType>("pdf");
  const [uploadCategory, setUploadCategory] = useState("Fiqh");
  const [uploadAuthor, setUploadAuthor] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: resources, isLoading } = useQuery({
    queryKey: ["resources"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shared_resources")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = (resources || []).filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.author.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === "All" || r.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !uploadFile) return;

    setUploading(true);
    try {
      const fileExt = uploadFile.name.split(".").pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("resources")
        .upload(filePath, uploadFile);
      if (uploadError) throw uploadError;

      const fileSizeStr =
        uploadFile.size > 1048576
          ? `${(uploadFile.size / 1048576).toFixed(1)} MB`
          : `${(uploadFile.size / 1024).toFixed(0)} KB`;

      const { error: insertError } = await supabase.from("shared_resources").insert({
        user_id: user.id,
        title: uploadTitle,
        type: uploadType,
        category: uploadCategory,
        author: uploadAuthor,
        file_path: filePath,
        file_size: fileSizeStr,
      });
      if (insertError) throw insertError;

      toast.success("Resource uploaded successfully!");
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      setShowUpload(false);
      setUploadTitle(""); setUploadAuthor(""); setUploadFile(null);
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (resource: any) => {
    try {
      // Increment download count
      await supabase.rpc("increment_download_count", { resource_id: resource.id });

      const { data } = supabase.storage.from("resources").getPublicUrl(resource.file_path);
      window.open(data.publicUrl, "_blank");
      queryClient.invalidateQueries({ queryKey: ["resources"] });
    } catch {
      toast.error("Download failed");
    }
  };

  return (
    <div className="px-4 py-6 md:px-6 md:py-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">Resource Library</h1>
          <p className="mt-1 text-sm text-muted-foreground md:text-base">Community-shared Islamic resources. Download for offline access.</p>
        </div>
        <Button
          variant="hero"
          size="sm"
          className="gap-2"
          onClick={() => user ? setShowUpload(true) : navigate("/auth")}
        >
          <Upload className="h-4 w-4" /> Upload
        </Button>
      </motion.div>

      {/* Search & Filter */}
      <div className="mt-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search resources..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={activeCategory === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      {/* Resources Grid */}
      {isLoading ? (
        <div className="mt-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((resource, i) => {
            const Icon = typeIcons[resource.type] || FileText;
            return (
              <motion.div
                key={resource.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="group flex h-full flex-col transition-shadow hover:shadow-emerald">
                  <CardContent className="flex h-full flex-col p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${typeColors[resource.type] || "bg-muted"}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {resource.type.toUpperCase()}
                      </Badge>
                    </div>
                    <h3 className="mt-3 font-semibold text-foreground leading-snug">{resource.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">by {resource.author}</p>
                    <div className="mt-auto flex items-center justify-between pt-4 text-xs text-muted-foreground">
                      <span>{resource.category} • {resource.file_size || "—"}</span>
                      <span>{resource.downloads} downloads</span>
                    </div>
                    <Button variant="outline" size="sm" className="mt-3 w-full gap-2" onClick={() => handleDownload(resource)}>
                      <Download className="h-4 w-4" /> Download
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="mt-12 text-center text-muted-foreground">
          <BookOpen className="mx-auto mb-3 h-10 w-10 opacity-40" />
          <p>No resources found. Be the first to upload!</p>
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Upload Resource</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} placeholder="Basics of Salah" required />
            </div>
            <div>
              <Label>Author *</Label>
              <Input value={uploadAuthor} onChange={(e) => setUploadAuthor(e.target.value)} placeholder="Sheikh Nsereko" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <Select value={uploadType} onValueChange={(v) => setUploadType(v as ResourceType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="audio">Audio</SelectItem>
                    <SelectItem value="guide">Guide</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Category</Label>
                <Select value={uploadCategory} onValueChange={setUploadCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.filter(c => c !== "All").map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>File *</Label>
              <Input
                type="file"
                accept=".pdf,.mp3,.wav,.m4a,.doc,.docx"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                required
              />
            </div>
            <Button type="submit" variant="hero" className="w-full" disabled={uploading}>
              {uploading ? <><Loader2 className="h-4 w-4 animate-spin" /> Uploading...</> : "Upload Resource"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ResourcesPage;
