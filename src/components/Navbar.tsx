import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { Menu, X, Bell, Heart, BookOpen, Home, LogIn, LogOut, Shield, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

const navItems = [
  { path: "/", label: "Home", icon: Home },
  { path: "/alerts", label: "Alerts", icon: Bell },
  { path: "/donations", label: "Donate", icon: Heart },
  { path: "/resources", label: "Library", icon: BookOpen },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { theme, setTheme } = useTheme();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out");
  };

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  return (
    <nav className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="UmmahLink Uganda" className="h-10 w-10 rounded-lg" />
          <span className="font-display text-xl font-bold text-foreground">
            Ummah<span className="text-gradient-gold">Link</span>
          </span>
        </Link>

        {/* Desktop */}
        <div className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}>
                <Button variant={active ? "default" : "ghost"} size="sm" className="gap-2">
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
          {isAdmin && (
            <Link to="/admin">
              <Button variant={location.pathname === "/admin" ? "default" : "ghost"} size="sm" className="gap-2">
                <Shield className="h-4 w-4" /> Admin
              </Button>
            </Link>
          )}
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="ml-1">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          {user ? (
            <Button variant="ghost" size="sm" className="gap-2" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" /> Sign Out
            </Button>
          ) : (
            <Link to="/auth">
              <Button variant="gold" size="sm" className="gap-2">
                <LogIn className="h-4 w-4" /> Sign In
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile toggle */}
        <div className="flex items-center gap-1 md:hidden">
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X /> : <Menu />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t bg-card md:hidden"
          >
            <div className="container flex flex-col gap-1 py-3">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = location.pathname === item.path;
                return (
                  <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)}>
                    <Button variant={active ? "default" : "ghost"} className="w-full justify-start gap-3">
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
              {isAdmin && (
                <Link to="/admin" onClick={() => setMobileOpen(false)}>
                  <Button variant={location.pathname === "/admin" ? "default" : "ghost"} className="w-full justify-start gap-3">
                    <Shield className="h-4 w-4" /> Admin
                  </Button>
                </Link>
              )}
              {user ? (
                <Button variant="ghost" className="w-full justify-start gap-3" onClick={() => { handleSignOut(); setMobileOpen(false); }}>
                  <LogOut className="h-4 w-4" /> Sign Out
                </Button>
              ) : (
                <Link to="/auth" onClick={() => setMobileOpen(false)}>
                  <Button variant="gold" className="w-full justify-start gap-3">
                    <LogIn className="h-4 w-4" /> Sign In
                  </Button>
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
