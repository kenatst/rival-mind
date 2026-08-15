import { createFileRoute, Link } from "@tanstack/react-router";
import { Infinity as InfinityIcon, Swords, Calendar, Users, Layers } from "lucide-react";
import { Button, Panel } from "@/components/kit/primitives";
import { Page } from "@/components/AppShell";
import { categories, currentUser } from "@/data/mock";
import { divisionForElo, fmt } from "@/lib/game";

export const Route = createFileRoute("/play")({
  head: () => ({
    meta: [
      { title: "Play — Ranked, Daily 12 and battles | QuizArena" },
      {
        name: "description",
        content: "Choose your mode: ranked ELO matches, infinite training, the Daily 12 or a friend battle.",
      },
      { property: "og:title", content: "Play — QuizArena" },
      { property: "og:description", content: "Ranked, infinite, Daily 12, battles and category runs." },
    ],
  }),
  component: PlayHub,
});

function PlayHub() {
  const d = divisionForElo(currentUser.elo);

  return (
    <Page title="Play" subtitle="One rating. Every mode feeds it." wide>
      <Link to="/matchmaking" className="block">
        <div className="stage group relative overflow-hidden rounded-3xl border-2 border-gold/50 p-6 transition-transform active:scale-[0.99] sm:p-8">
          <div className="label-xs text-gold">Competitive</div>
          <h2 className="display mt-2 text-5xl sm:text-7xl">Ranked</h2>
          <p className="mt-3 max-w-md text-sm text-muted-foreground">
            Head-to-head, same questions, ELO on the line. The only mode that moves your world rank.
          </p>
          <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="label-xs text-muted-foreground">Your rating</div>
              <div className="numeric text-4xl text-gold sm:text-5xl">{fmt(currentUser.elo)}</div>
              <div className="label-xs mt-1" style={{ color: d.color }}>
                {d.label}
              </div>
            </div>
            <Button size="lg" variant="prestige">
              Find opponent
            </Button>
          </div>
        </div>
      </Link>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <ModeCard
          to="/quiz"
          icon={<InfinityIcon size={20} strokeWidth={2.5} />}
          title="Infinite"
          copy="Questions without limits. Train and earn XP."
          meta="No ELO impact"
        />
        <ModeCard
          to="/daily"
          icon={<Calendar size={20} strokeWidth={2.5} />}
          title="Daily 12"
          copy="Same 12 questions for everyone. One attempt per day."
          meta="Resets in 8 h"
          tone="accent"
        />
        <ModeCard
          to="/battles"
          icon={<Swords size={20} strokeWidth={2.5} />}
          title="Quick battle"
          copy="Challenge a friend with a shareable link."
          meta="Best score wins"
        />
        <ModeCard
          to="/friends"
          icon={<Users size={20} strokeWidth={2.5} />}
          title="Friends online"
          copy="3 friends are playing right now."
          meta="Invite instantly"
        />
      </div>

      <div className="mt-8">
        <div className="label-xs mb-3 flex items-center gap-2 text-muted-foreground">
          <Layers size={14} strokeWidth={3} /> Category run
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((c) => (
            <Link key={c.id} to="/quiz">
              <Panel className="h-full p-3 transition-colors hover:border-primary/50">
                <div className="text-2xl">{c.icon}</div>
                <div className="display mt-2 text-sm">{c.label}</div>
                <div className="label-xs mt-1 text-muted-foreground">{fmt(c.questions)} Q</div>
              </Panel>
            </Link>
          ))}
        </div>
      </div>
    </Page>
  );
}

function ModeCard({
  to,
  icon,
  title,
  copy,
  meta,
  tone,
}: {
  to: "/quiz" | "/daily" | "/battles" | "/friends";
  icon: React.ReactNode;
  title: string;
  copy: string;
  meta: string;
  tone?: "accent";
}) {
  return (
    <Link to={to}>
      <Panel className="h-full transition-colors hover:border-border-strong">
        <div className={`label-xs flex items-center gap-2 ${tone === "accent" ? "text-accent" : "text-primary"}`}>
          {icon} {meta}
        </div>
        <div className="display mt-3 text-2xl">{title}</div>
        <p className="mt-1 text-sm text-muted-foreground">{copy}</p>
      </Panel>
    </Link>
  );
}
