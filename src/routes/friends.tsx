import { createFileRoute, Link } from "@tanstack/react-router";
import * as React from "react";
import { Page } from "@/components/AppShell";
import { Button, Panel, Tabs } from "@/components/kit/primitives";
import { Avatar, DivisionBadge } from "@/components/kit/badges";
import { friends } from "@/data/mock";
import { fmt } from "@/lib/game";
import { Swords, UserPlus, Flame, Check } from "lucide-react";

const friendRequests = friends.slice(0, 2);

export const Route = createFileRoute("/friends")({
  head: () => ({
    meta: [
      { title: "Friends & Rivalries — IQ ARENA" },
      { name: "description", content: "See who is online, send 1v1 battles and manage friend requests." },
      { property: "og:title", content: "Friends & Rivalries — IQ ARENA" },
      { property: "og:description", content: "Your friends and rivals, online right now." },
    ],
  }),
  component: FriendsScreen,
});

function FriendsScreen() {
  const [tab, setTab] = React.useState<"all" | "online" | "requests">("all");
  const [requests, setRequests] = React.useState(friendRequests);
  const list = tab === "online" ? friends.filter((f) => f.online) : friends;

  const handleAcceptRequest = (id: string) => {
    setRequests((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <Page
      title="Friends & Rivalries"
      subtitle={`${friends.filter((f) => f.online).length} competitors online right now in France.`}
      wide
    >
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "all", label: `All Friends (${friends.length})` },
          { id: "online", label: `🟢 Online Now (${friends.filter((f) => f.online).length})` },
          { id: "requests", label: `Requests (${requests.length})` },
        ]}
      />

      {tab === "requests" ? (
        <Panel className="mt-4 space-y-2 p-4">
          {requests.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              No pending friend requests.
            </div>
          ) : (
            requests.map((r) => (
              <div key={r.id} className="flex items-center gap-3 rounded-xl p-3 bg-surface-2/40">
                <Avatar initials={r.initials} color={r.avatarColor} size={38} />
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-sm">{r.username}</div>
                  <div className="numeric text-xs text-muted-foreground">{fmt(r.elo)} ELO</div>
                </div>
                <Button size="sm" onClick={() => handleAcceptRequest(r.id)}>
                  <Check size={14} /> Accept
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleAcceptRequest(r.id)}>
                  Ignore
                </Button>
              </div>
            ))
          )}
        </Panel>
      ) : (
        <Panel className="mt-4 space-y-1.5 p-3">
          {list.map((f) => (
            <div
              key={f.id}
              className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl p-3 hover:bg-surface-2/60 transition-colors"
            >
              <Avatar initials={f.initials} color={f.avatarColor} size={42} online={f.online ?? false} />
              <div className="min-w-0">
                <div className="font-bold text-sm flex items-center gap-1.5">
                  <span>{f.country.flag}</span>
                  <span className="truncate">{f.username}</span>
                  {f.streak > 0 && (
                    <span className="label-xs text-gold flex items-center gap-0.5">
                      <Flame size={11} className="fill-gold" /> {f.streak}w
                    </span>
                  )}
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="numeric text-xs text-gold font-bold">{fmt(f.elo)} ELO</span>
                  <DivisionBadge elo={f.elo} size="sm" />
                </div>
              </div>
              <Link
                to="/quiz"
                search={{ mode: "battle", opponent: f.username.toLowerCase() } as any}
              >
                <Button size="sm" variant={f.online ? "primary" : "surface"}>
                  <Swords size={13} /> {f.online ? "Challenge" : "Invite"}
                </Button>
              </Link>
            </div>
          ))}
        </Panel>
      )}
    </Page>
  );
}
