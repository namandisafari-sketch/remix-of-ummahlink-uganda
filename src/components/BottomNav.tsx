import { Link, useLocation } from "react-router-dom";
import { Home, Bell, Heart, BookOpen, User } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const items = [
  { path: "/", label: "Home", icon: Home },
  { path: "/alerts", label: "Alerts", icon: Bell },
  { path: "/donations", label: "Donate", icon: Heart },
  { path: "/resources", label: "Library", icon: BookOpen },
];

const BottomNav = () => {
  const location = useLocation();
  const { user } = useAuth();

  const navItems = [
    ...items,
    { path: user ? "/admin" : "/auth", label: user ? "Account" : "Sign In", icon: User },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur-lg"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active =
            item.path === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.path);
          return (
            <li key={item.path} className="flex-1">
              <Link
                to={item.path}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {active && (
                  <motion.span
                    layoutId="bottom-nav-active"
                    className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon className={cn("h-5 w-5", active && "scale-110")} />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default BottomNav;
