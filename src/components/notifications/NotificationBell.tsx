import { Link } from "react-router-dom";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRelevantNotifications } from "@/hooks/useNotifications";
import { useAuth } from "@/contexts/AuthContext";

const NotificationBell = () => {
  const { user } = useAuth();
  const { data } = useRelevantNotifications();
  const unread = data?.unreadCount ?? 0;

  return (
    <Link to="/notifications" aria-label="Notifications">
      <Button variant="ghost" size="icon" className="relative">
        <Bell className="h-4 w-4" />
        {user && unread > 0 && (
          <Badge
            variant="urgent"
            className="absolute -right-1 -top-1 h-4 min-w-4 justify-center rounded-full px-1 text-[10px] leading-none"
          >
            {unread > 9 ? "9+" : unread}
          </Badge>
        )}
      </Button>
    </Link>
  );
};

export default NotificationBell;
