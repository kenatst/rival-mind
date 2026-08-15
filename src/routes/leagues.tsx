import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { Page } from "@/components/AppShell";
import { Button, Modal, Panel } from "@/components/kit/primitives";
import { StatTile } from "@/components/kit/game";
import { Avatar } from "@/components/kit/badges";
import { privateLeague } from "@/data/mock";
import { fmt } from "@/lib/game";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/leagues")({
  head: () => ({
    meta: [
      { title: "Private leagues — QuizArena" },
      { name: "description", content: "Season standings, weekly ranks and invites for your private knowledge league." },
      { property: "og:title", content: "Private leagues — QuizArena" },
      { property: "og:description", content: "Beat your friends across a full season." },
    ],
  }),
  component: Leagues,
});

function Leagues() {
  const [invite, setInvite] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const you = privateLeague.members.find((m) => m.isYou)!;

  return (
    <Page
      title={privateLeague.name}
      subtitle={`${privateLeague.memberCount} players · Season ${privateLeague.season}`}
      wide
      action={
        <Button variant="prestige" onClick={() => setInvite(true)}>
          Invite friends
        </Button>
      }
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <StatTile label="Season rank" value={`#${you.rank}`} accent="gold" />
        <StatTile label="Weekly rank" value={`#${you.weeklyRank}`} accent="primary" />
        <StatTile label="Battles won" value={you.battlesWon} />
        <StatTile label="Accuracy" value={`${you.accuracy}%`} />
        <StatTile label="ELO" value={fmt(you.elo)} accent="gold" />
      </div>

      <Panel className="mt-5 p-2 sm:p-3">
        {privateLeague.members.map((m) => (
          <div
            key={m.rank}
            className={cn(
              "grid grid-cols-[2rem_auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl px-2 py-2.5",
              m.isYou ? "bg-primary/10" : "hover:bg-surface-2",
            )}
          >
            <span className={cn("numeric text-lg", m.rank <= 3 ? "text-gold" : "text-muted-foreground")}>
              {m.rank}
            </span>
            <Avatar initials={m.player.initials} color={m.player.avatarColor} size={34} />
            <div className="min-w-0">
              <div className={cn("truncate font-bold", m.isYou && "text-primary")}>
                {m.player.username}
              </div>
              <div className="label-xs text-muted-foreground">
                {m.accuracy}% · {m.battlesWon} wins
              </div>
            </div>
            <span className="numeric text-xl">{fmt(m.points)}</span>
          </div>
        ))}
      </Panel>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Button variant="surface" size="lg" full>
          Create battle
        </Button>
        <Button variant="outline" size="lg" full>
          View stats
        </Button>
      </div>

      <Modal open={invite} onClose={() => setInvite(false)} title="Invite to Les Génies">
        <p className="text-sm text-muted-foreground">
          Anyone with this link joins the current season instantly.
        </p>
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-border bg-surface p-3">
          <code className="min-w-0 flex-1 truncate text-sm">{privateLeague.inviteCode}</code>
          <Button
            size="sm"
            onClick={() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
          >
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Button variant="surface" full>
            Share
          </Button>
          <Button variant="outline" full onClick={() => setInvite(false)}>
            Done
          </Button>
        </div>
      </Modal>
    </Page>
  );
}
