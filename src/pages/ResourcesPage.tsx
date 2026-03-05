import { useState } from "react";
import { motion } from "framer-motion";
import { Search, FileText, Headphones, BookOpen, Download, Filter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ResourceType = "pdf" | "audio" | "guide";

interface Resource {
  id: string;
  title: string;
  type: ResourceType;
  category: string;
  author: string;
  size: string;
  downloads: number;
}

const categories = ["All", "Fiqh", "Quran", "Hadith", "History", "Arabic", "Youth"];

const mockResources: Resource[] = [
  { id: "1", title: "Basics of Salah – Complete Guide", type: "pdf", category: "Fiqh", author: "Sheikh Nsereko", size: "2.4 MB", downloads: 342 },
  { id: "2", title: "Juz Amma Recitation & Tafsir", type: "audio", category: "Quran", author: "Imam Kasule", size: "15 MB", downloads: 891 },
  { id: "3", title: "40 Hadith of Imam Nawawi – Notes", type: "pdf", category: "Hadith", author: "Ustadh Lubega", size: "1.8 MB", downloads: 567 },
  { id: "4", title: "History of Islam in Uganda", type: "guide", category: "History", author: "Dr. Ssekamanya", size: "5.2 MB", downloads: 234 },
  { id: "5", title: "Arabic for Beginners – Lesson 1-10", type: "audio", category: "Arabic", author: "Ustadha Nakimuli", size: "28 MB", downloads: 445 },
  { id: "6", title: "Youth & Social Media – Islamic Perspective", type: "pdf", category: "Youth", author: "Sheikh Kibirige", size: "980 KB", downloads: 178 },
];

const typeIcons: Record<ResourceType, typeof FileText> = {
  pdf: FileText,
  audio: Headphones,
  guide: BookOpen,
};

const typeColors: Record<ResourceType, string> = {
  pdf: "bg-primary/10 text-primary",
  audio: "bg-accent/20 text-accent-foreground",
  guide: "bg-emerald-light text-emerald-dark",
};

const ResourcesPage = () => {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered = mockResources.filter((r) => {
    const matchesSearch = r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.author.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === "All" || r.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="container py-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl font-bold text-foreground">Resource Library</h1>
        <p className="mt-1 text-muted-foreground">
          Community-shared Islamic resources. Download for offline access.
        </p>
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
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((resource, i) => {
          const Icon = typeIcons[resource.type];
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
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${typeColors[resource.type]}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {resource.type.toUpperCase()}
                    </Badge>
                  </div>

                  <h3 className="mt-3 font-semibold text-foreground leading-snug">{resource.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">by {resource.author}</p>

                  <div className="mt-auto flex items-center justify-between pt-4 text-xs text-muted-foreground">
                    <span>{resource.category} • {resource.size}</span>
                    <span>{resource.downloads} downloads</span>
                  </div>

                  <Button variant="outline" size="sm" className="mt-3 w-full gap-2">
                    <Download className="h-4 w-4" /> Download
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="mt-12 text-center text-muted-foreground">
          <BookOpen className="mx-auto mb-3 h-10 w-10 opacity-40" />
          <p>No resources found. Try a different search or category.</p>
        </div>
      )}
    </div>
  );
};

export default ResourcesPage;
