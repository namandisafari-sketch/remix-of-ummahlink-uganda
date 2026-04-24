import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const PrayerPrompt = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Show on every fresh load/open
    const t = setTimeout(() => setOpen(true), 600);
    return () => clearTimeout(t);
  }, []);

  const close = () => setOpen(false);

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
              className="absolute right-3 top-3 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="bg-gradient-emerald geometric-pattern px-5 pb-5 pt-7 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary-foreground/15 ring-1 ring-primary-foreground/20">
                <Moon className="h-7 w-7 text-primary-foreground" />
              </div>
              <h2
                id="prayer-prompt-title"
                className="font-display text-2xl font-bold text-primary-foreground"
              >
                Wasadde?
              </h2>
              <p className="mt-1 text-sm text-primary-foreground/85">Did you pray?</p>
            </div>

            <div className="space-y-2 p-5">
              <Button variant="hero" size="lg" className="w-full" onClick={close}>
                <Check className="h-4 w-4" /> Yes, Alhamdulillah
              </Button>
              <Button variant="outline" size="lg" className="w-full" onClick={close}>
                Not yet — remind me
              </Button>
              <p className="pt-1 text-center text-[11px] text-muted-foreground">
                "Indeed, prayer prohibits immorality and wrongdoing." — Qur'an 29:45
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PrayerPrompt;
