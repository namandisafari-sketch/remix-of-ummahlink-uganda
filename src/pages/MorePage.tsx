import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Tv, BookOpen, Mic, Shield, ChevronRight, Settings, LogOut, Sun, Moon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

const links = [
  { to: "/tv", icon: Tv, label: "UmmahLink TV", desc: "Live streams & videos", color: "text-urgent" },
  { to: "/resources", icon: BookOpen, label: "Resource Library", desc: "Books, PDFs & audio", color: "text-primary" },
  { to: "/dawah", icon: Mic, label: "Dawah Spreaders", desc: "Top sheikhs & channels", color: "text-soft-gold" },
];

const MorePage = () => {
  const { user, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { theme, setTheme } = useTheme();

  return (
    <div className="px-4 py-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="mb-1 font-display text-2xl font-bold text-foreground">More</h1>
        <p className="mb-6 text-sm text-muted-foreground">Explore everything UmmahLink offers</p>
      </motion.div>

      <div className="space-y-2">
        {links.map((l) => {
          const Icon = l.icon;
          return (
            <Link key={l.to} to={l.to}>
              <Card className="transition hover:shadow-md">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <Icon className={`h-5 w-5 ${l.color}`} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{l.label}</p>
                    <p className="text-xs text-muted-foreground">{l.desc}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          );
        })}

        {isAdmin && (
          <Link to="/admin">
            <Card className="transition hover:shadow-md">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                  <Shield className="h-5 w-5 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">Admin Portal</p>
                  <p className="text-xs text-muted-foreground">Manage content & users</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        )}
      </div>

      <div className="mt-6 space-y-2">
        <p className="px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Settings</p>
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                {theme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              </div>
              <div>
                <p className="font-semibold text-foreground">Theme</p>
                <p className="text-xs text-muted-foreground capitalize">{theme}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              Switch
            </Button>
          </CardContent>
        </Card>

        {user && (
          <Card>
            <CardContent className="p-4">
              <Button variant="outline" className="w-full gap-2" onClick={signOut}>
                <LogOut className="h-4 w-4" /> Sign Out
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MorePage;
