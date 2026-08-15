import { createFileRoute } from "@tanstack/react-router";
import { Page } from "@/components/AppShell";
import { Panel } from "@/components/kit/primitives";
import { notifications } from "@/data/mock";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — QuizArena" },
      { name: "description", content: "Challenges, rank changes, league results and streak reminders." },
      { property: "og:title", content: "Notifications — QuizArena" },
      { property: "og:description", content: "Everything that happened while you were away." },
    ],
  }),
  component: Notifications,
});

function Notifications() {
  return (
    <Page title="Notifications" subtitle="Everything that happened while you were away.">
      <Panel className="space-y-1">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={cn(
              "grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 rounded-xl px-3 py-3",
              n.unread ? "bg-primary/8" : "hover:bg-surface-2",
            )}
          >
            <span className="text-xl leading-none">{n.icon}</span>
            <div className="min-w-0">
              <div className="font-bold">{n.title}</div>
              <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>
            </div>
            <span className="label-xs whitespace-nowrap text-muted-foreground">{n.time}</span>
          </div>
        ))}
      </Panel>
    </Page>
  );
}
