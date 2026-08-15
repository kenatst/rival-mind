import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { Page } from "@/components/AppShell";
import { Button, Panel, Tabs } from "@/components/kit/primitives";
import { Avatar, DivisionBadge } from "@/components/kit/badges";
import { friends } from "@/data/mock";

const friendRequests = friends.slice(0, 2);
import { fmt } from "@/lib/game";

export const Route = createFileRoute("/friends")({
  head: () => ({
    meta: [
      { title: "Friends — QuizArena" },
      { name: "description", content: "See who is online, send battles and manage friend requests." },
      { property: "og:title", content: "Friends — QuizArena" },
      { property: "og:description", content: "Your rivals, online right now." },
    ],
  }),
  component: FriendsScreen,
});

function FriendsScreen() {
  const [tab, setTab] = React.useState<"all" | "online" | "requests">("all");
  const list = tab === "online" ? friends.filter((f) => f.online) : friends;

  return (
    <Page title="Friends" subtitle={`${friends.filter((f) => f.online).length} online now`} wide>
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "all", label: `All ${friends.length}` },
          { id: "online", label: "Online" },
          { id: "requests", label: `Requests ${friendRequests.length}` },
        ]}
      />

      {tab === "requests" ? (
        <Panel className="mt-4 space-y-2">
          {friendRequests.map((r) => (
            <div key={r.id} className="flex items-center gap-3 rounded-xl px-2 py-2">
              <Avatar initials={r.initials} color={r.avatarColor} size={38} />
              <div className="min-w-0 flex-1">
                <div className="truncate font-bold">{r.username}</div>
                <div className="numeric text-xs text-muted-foreground">{fmt(r.elo)} ELO</div>
              </div>
              <Button size="sm">Accept</Button>
              <Button size="sm" variant="ghost">
                Ignore
              </Button>
            </div>
          ))}
        </Panel>
      ) : (
        <Panel className="mt-4 space-y-1">
          {list.map((f) => (
            <div
              key={f.id}
              className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-surface-2"
            >
              <Avatar initials={f.initials} color={f.avatarColor} size={40} online={f.online ?? false} />
              <div className="min-w-0">
                <div className="truncate font-bold">
                  {f.country.flag} {f.username}
                </div>
                <div className="mt-1">
                  <DivisionBadge elo={f.elo} size="sm" />
                </div>
              </div>
              <Button size="sm" variant={f.online ? "primary" : "surface"}>
                {f.online ? "Battle" : "Invite"}
              </Button>
            </div>
          ))}
        </Panel>
      )}
    </Page>
  );
}
