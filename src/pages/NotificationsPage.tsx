import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Bell, Plus, Loader2, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRelevantNotifications } from "@/hooks/useNotifications";
import { useImamProfile } from "@/hooks/useImamProfile";
import NotificationCard from "@/components/notifications/NotificationCard";
import { Card, CardContent } from "@/components/ui/card";

const NotificationsPage = () => {
  const navigate = useNavigate();
  const { data, isLoading } = useRelevantNotifications();
  const { isImam } = useImamProfile();

  return (
    <div className="px-4 py-6 md:px-6 md:py-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between gap-3"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">Notifications</h1>
            <p className="text-sm text-muted-foreground">
              Calls-to-action from imams in your area
              {data && data.unreadCount > 0 && (
                <span className="ml-1 font-medium text-primary">· {data.unreadCount} unread</span>
              )}
            </p>
          </div>
        </div>

        {isImam ? (
          <Button variant="hero" size="sm" className="shrink-0 gap-2" onClick={() => navigate("/notifications/new")}>
            <Plus className="h-4 w-4" /> <span className="hidden sm:inline">New</span>
          </Button>
        ) : (
          <Button variant="outline" size="sm" className="shrink-0" onClick={() => navigate("/imam/apply")}>
            Become an imam
          </Button>
        )}
      </motion.div>

      {isLoading ? (
        <div className="mt-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !data || data.notifications.length === 0 ? (
        <Card className="mt-8">
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <Inbox className="h-10 w-10 text-muted-foreground/40" />
            <p className="font-medium text-foreground">No notifications yet</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              When imams in your parish, district or region post a call-to-action, you'll see it here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.notifications.map((n) => (
            <NotificationCard key={n.id} notification={n} isUnread={!data.readIds.has(n.id)} />
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
