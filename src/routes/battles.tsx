import { createFileRoute, Link } from "@tanstack/react-router";
import * as React from "react";
import { Page } from "@/components/AppShell";
import { Button, Modal, Panel } from "@/components/kit/primitives";
import { Avatar, DivisionBadge } from "@/components/kit/badges";
import { currentUser, friends, rivalOpponent } from "@/data/mock";
import { fmt } from "@/lib/game";

export const Route = createFileRoute("/battles")({
  head: () => ({
    meta: [
      { title: "Battles — challenge your friends | QuizArena" },
      { name: "description", content: "Send a 10-question challenge link. Same questions, best score wins." },
      { property: "og:title", content: "Battles — QuizArena" },
      { property: "og:description", content: "Challenge a friend with one shareable link." },
    ],
  }),
  component: Battles,
});

function Battles() {
  const [share, setShare] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  return (
    <Page title="Battles" subtitle="Same questions. Best score wins." wide>
      <div className="stage rounded-3xl border border-accent/40 p-6 sm:p-8">
        <div className="label-xs text-accent">Incoming challenge</div>
        <h2 className="display mt-2 text-3xl sm:text-5xl">Thomas challenges you</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          10 questions · identical for both players · expires in 22 h
        </p>

        <div className="mt-7 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <Side
            name={currentUser.username}
            initials={currentUser.initials}
            color={currentUser.avatarColor}
            elo={currentUser.elo}
          />
          <span className="display text-3xl text-accent sm:text-5xl">VS</span>
          <Side
            name="THOMAS"
            initials="TH"
            color="oklch(0.83 0.16 84)"
            elo={1288}
          />
        </div>

        <Link to="/quiz" className="mt-7 block">
          <Button variant="live" size="xl" full>
            Accept battle
          </Button>
        </Link>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Panel>
          <div className="label-xs text-muted-foreground">Create a battle</div>
          <p className="mt-2 text-sm text-muted-foreground">
            Generate a link, send it anywhere. Your opponent plays the same 10 questions.
          </p>
          <Button className="mt-4" full size="lg" onClick={() => setShare(true)}>
            Create challenge link
          </Button>
        </Panel>

        <Panel>
          <div className="label-xs mb-3 text-muted-foreground">Challenge a friend</div>
          <div className="space-y-1">
            {friends.slice(0, 4).map((f) => (
              <div key={f.id} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-surface-2">
                <Avatar initials={f.initials} color={f.avatarColor} size={34} online={f.online} />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-bold">{f.username}</div>
                  <div className="numeric text-xs text-muted-foreground">{fmt(f.elo)} ELO</div>
                </div>
                <Button size="sm" variant="surface">
                  Battle
                </Button>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel className="mt-6">
        <div className="label-xs mb-3 text-muted-foreground">Recent battles</div>
        <div className="space-y-2 text-sm">
          {[
            { who: rivalOpponent.username, res: "Won 7–5", tone: "text-success" },
            { who: "Emma", res: "Lost 6–8", tone: "text-danger" },
            { who: "Chloé", res: "Won 9–4", tone: "text-success" },
          ].map((r) => (
            <div key={r.who} className="flex items-center justify-between rounded-lg bg-surface-2/50 px-3 py-2">
              <span className="font-bold">{r.who}</span>
              <span className={`numeric ${r.tone}`}>{r.res}</span>
            </div>
          ))}
        </div>
      </Panel>

      <Modal open={share} onClose={() => setShare(false)} title="Challenge link">
        <p className="text-sm text-muted-foreground">Anyone with this link can face your score.</p>
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-border bg-surface p-3">
          <code className="min-w-0 flex-1 truncate text-sm">quizarena.gg/b/KENAEL-8F3D</code>
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
      </Modal>
    </Page>
  );
}

function Side({
  name,
  initials,
  color,
  elo,
}: {
  name: string;
  initials: string;
  color: string;
  elo: number;
}) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <Avatar initials={initials} color={color} size={56} ring />
      <div className="display text-lg">{name}</div>
      <DivisionBadge elo={elo} size="sm" />
    </div>
  );
}
