import { Badge } from "@/components/ui/badge";
import { Megaphone, GraduationCap, HandHeart, Moon, Heart, AlertTriangle, Users } from "lucide-react";

const MAP: Record<string, { label: string; icon: typeof Megaphone; className: string }> = {
  meeting:    { label: "Meeting",    icon: Users,         className: "bg-primary/10 text-primary border-primary/20" },
  lecture:    { label: "Lecture",    icon: GraduationCap, className: "bg-soft-gold/15 text-soft-gold border-soft-gold/30" },
  fundraiser: { label: "Fundraiser", icon: HandHeart,     className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400" },
  eid:        { label: "Eid",        icon: Moon,          className: "bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400" },
  janaza:     { label: "Janaza",     icon: Heart,         className: "bg-slate-500/10 text-slate-600 border-slate-500/20 dark:text-slate-300" },
  urgent:     { label: "Urgent",     icon: AlertTriangle, className: "bg-urgent/10 text-urgent border-urgent/30" },
  general:    { label: "General",    icon: Megaphone,     className: "bg-muted text-foreground border-border" },
};

export const CategoryBadge = ({ category }: { category: string }) => {
  const meta = MAP[category] ?? MAP.general;
  const Icon = meta.icon;
  return (
    <Badge variant="outline" className={`gap-1 ${meta.className}`}>
      <Icon className="h-3 w-3" />
      {meta.label}
    </Badge>
  );
};

export const CATEGORY_OPTIONS = Object.entries(MAP).map(([value, m]) => ({ value, label: m.label }));
