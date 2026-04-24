import { Link, NavLink, useLocation } from "react-router-dom";
import { LogIn, LogOut, Moon, Sun, Shield, Home, Bell, Heart, BookOpen, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.svg";

const desktopLinks = [
  { to: "/", label: "Home", icon: Home },
  { to: "/alerts", label: "Alerts", icon: Bell },
  { to: "/donations", label: "Donate", icon: Heart },
  { to: "/dawah", label: "Dawah", icon: Mic },
  { to: "/resources", label: "Library", icon: BookOpen },
];

const titles: Record<string, string> = {
  "/": "Home",
  "/alerts": "Alerts",
  "/donations": "Donate",
  "/resources": "Library",
  "/dawah": "Dawah Spreaders",
  "/admin": "Admin",
  "/auth": "Sign In",
};

const MobileHeader = () => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { theme, setTheme } = useTheme();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out");
  };

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");
  const title = titles[location.pathname] ?? "UmmahLink";

  return (
    <header className="sticky top-0 z-50 border-b bg-card/90 backdrop-blur-lg">
      <div className="flex h-14 items-center justify-between px-4 md:h-16 md:px-6">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="UmmahLink" className="h-8 w-8 rounded-md md:h-10 md:w-10" />
          <div className="flex flex-col leading-tight">
            <span className="font-display text-sm font-bold text-foreground md:text-base">
              Ummah<span className="text-gradient-gold">Link</span>
            </span>
            <span className="text-[10px] text-muted-foreground md:hidden">{title}</span>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {desktopLinks.map((l) => {
            const Icon = l.icon;
            return (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === "/"}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
                  )
                }
              >
                <Icon className="h-4 w-4" /> {l.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="flex items-center gap-1">
          {isAdmin && (
            <Link to="/admin" aria-label="Admin">
              <Button variant="ghost" size="icon">
                <Shield className="h-4 w-4" />
              </Button>
            </Link>
          )}
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          {user ? (
            <Button variant="ghost" size="icon" onClick={handleSignOut} aria-label="Sign out">
              <LogOut className="h-4 w-4" />
            </Button>
          ) : (
            <Link to="/auth" aria-label="Sign in">
              <Button variant="gold" size="sm" className="h-8 gap-1 px-3">
                <LogIn className="h-3.5 w-3.5" /> Sign In
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default MobileHeader;
