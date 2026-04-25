import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { HeartHandshake, Search, Briefcase, ArrowRight } from "lucide-react";

const items = [
  {
    to: "/community/aid",
    icon: HeartHandshake,
    title: "Mutual Aid",
    sub: "Request or offer help",
    tint: "bg-urgent/10 text-urgent",
  },
  {
    to: "/community/lost-found",
    icon: Search,
    title: "Lost & Found",
    sub: "Reunite belongings",
    tint: "bg-primary/10 text-primary",
  },
  {
    to: "/community/skills",
    icon: Briefcase,
    title: "Skills",
    sub: "Local services",
    tint: "bg-accent/20 text-accent-foreground",
  },
];

const CommunityHelpCard = () => {
  return (
    <section className="mt-6 px-4 md:px-6">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-bold text-foreground md:text-2xl">Your Community</h2>
          <p className="text-xs text-muted-foreground md:text-sm">Help neighbors · scoped to your parish</p>
        </div>
        <Link to="/community/aid" className="text-xs font-medium text-primary md:text-sm">See all</Link>
      </div>
      <div className="mx-auto grid max-w-3xl grid-cols-3 gap-2 md:gap-3">
        {items.map((it, i) => {
          const Icon = it.icon;
          return (
            <motion.div
              key={it.to}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                to={it.to}
                className="group flex h-full flex-col gap-2 rounded-2xl border bg-card p-3 shadow-sm transition-shadow hover:shadow-emerald"
              >
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${it.tint}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="truncate font-display text-xs font-semibold text-foreground md:text-sm">{it.title}</h3>
                  <p className="truncate text-[10px] text-muted-foreground md:text-xs">{it.sub}</p>
                </div>
                <ArrowRight className="ml-auto h-3.5 w-3.5 text-primary opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};

export default CommunityHelpCard;
