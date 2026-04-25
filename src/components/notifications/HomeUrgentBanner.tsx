import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { useRelevantNotifications } from "@/hooks/useNotifications";

const HomeUrgentBanner = () => {
  const { data } = useRelevantNotifications();
  const urgent = (data?.notifications ?? []).filter((n) => n.urgent).slice(0, 1);

  return (
    <AnimatePresence>
      {urgent.map((n) => (
        <motion.div
          key={n.id}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          <Link to="/notifications" className="block">
            <div className="relative overflow-hidden rounded-xl border border-urgent/30 bg-gradient-to-r from-urgent/10 to-urgent/5 p-3 shadow-sm transition hover:shadow-md">
              <div className="absolute right-0 top-0 h-1 w-full animate-pulse-urgent bg-urgent" />
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-urgent/15">
                  <AlertTriangle className="h-4 w-4 text-urgent" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold uppercase tracking-wider text-urgent">
                    Urgent · {n.mosque_name}
                  </p>
                  <p className="truncate text-sm font-medium text-foreground">{n.title}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-urgent" />
              </div>
            </div>
          </Link>
        </motion.div>
      ))}
    </AnimatePresence>
  );
};

export default HomeUrgentBanner;
