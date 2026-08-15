import { createFileRoute, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { Page } from "@/components/AppShell";
import { Button, Panel } from "@/components/kit/primitives";
import { gameService } from "@/lib/gameService";
import { Bell, Flame, Swords, Trophy, Globe2, Clock, Check, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Alerts & Notifications — IQ ARENA" },
      { name: "description", content: "Competitive rivalry updates, streak alarms, and nation war alerts." },
      { property: "og:title", content: "Notifications — IQ ARENA" },
      { property: "og:description", content: "Stay on top of every competitive shift." },
    ],
  }),
  component: NotificationsScreen,
});

function NotificationsScreen() {
  const navigate = useNavigate();
  const [items, setItems] = React.useState(() => gameService.getNotifications());

  const getIcon = (kind: string) => {
    switch (kind) {
      case "rival":
      case "rematch":
        return <Swords size={18} className="text-accent" />;
      case "country":
      case "event":
        return <Globe2 size={18} className="text-primary" />;
      case "streak":
        return <Flame size={18} className="text-gold fill-gold" />;
      case "league":
        return <Trophy size={18} className="text-gold" />;
      default:
        return <Bell size={18} className="text-foreground" />;
    }
  };

  const handleAction = (item: (typeof items)[0]) => {
    gameService.markNotificationRead(item.id);
    setItems(gameService.getNotifications());

    if (item.actionRoute) {
      navigate({
        to: item.actionRoute,
        search: (item.actionQuery || {}) as any,
      });
    } else {
      navigate({ to: "/home" });
    }
  };

  const handleMarkAllRead = () => {
    gameService.markAllNotificationsRead();
    setItems(gameService.getNotifications());
  };

  return (
    <Page
      title="Alerts & Notifications"
      subtitle="Live rivalry shifts, streak alarms, and nation war standings."
      wide
      action={
        <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
          <Check size={14} /> Mark All Read
        </Button>
      }
    >
      <div className="space-y-3">
        {items.map((n) => (
          <Panel
            key={n.id}
            glow={n.unread}
            className={cn(
              "flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-200 cursor-pointer p-4 sm:p-5",
              n.unread ? "border-primary/40 bg-surface-2/90" : "opacity-80 bg-surface/50",
            )}
            onClick={() => handleAction(n)}
          >
            <div className="flex items-start gap-4">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surface border border-border mt-0.5">
                {getIcon(n.kind)}
              </div>
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="display text-base font-bold text-foreground">{n.title}</span>
                  {n.unread && (
                    <span className="h-2 w-2 rounded-full bg-primary shrink-0 animate-pulse" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{n.body}</p>
                <div className="label-xs text-muted-foreground flex items-center gap-1 font-mono pt-1">
                  <Clock size={11} /> {n.time} ago
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-border">
              <Button
                size="sm"
                variant={n.unread ? "primary" : "surface"}
                onClick={(e) => {
                  e.stopPropagation();
                  handleAction(n);
                }}
              >
                Take action <ArrowRight size={14} />
              </Button>
            </div>
          </Panel>
        ))}
      </div>
    </Page>
  );
}
