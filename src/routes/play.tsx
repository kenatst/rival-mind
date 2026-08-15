import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Infinity as InfinityIcon, Swords, Calendar, Users, Layers, Sparkles } from "lucide-react";
import { Button, Panel } from "@/components/kit/primitives";
import { Page } from "@/components/AppShell";
import { categories } from "@/data/mock";
import { divisionForElo, fmt } from "@/lib/game";
import { gameService } from "@/lib/gameService";

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
  const [profile, setProfile] = useState(() => gameService.getUserProfile());

  useEffect(() => {
    return gameService.subscribe(() => {
      setProfile(gameService.getUserProfile());
    });
  }, []);

  const d = divisionForElo(profile.elo);

  return (
    <Page title="Play Arena" subtitle="One rating. Every match moves your global rank." wide>
      {/* Primary Ranked Arena Card */}
      <Link to="/matchmaking" className="block">
        <div className="stage group relative overflow-hidden rounded-3xl border-2 border-gold/50 p-6 transition-transform active:scale-[0.99] sm:p-8 shadow-[var(--shadow-lift)]">
          <div className="label-xs text-gold flex items-center gap-1.5 font-black">
            <Sparkles size={14} /> Competitive Ranked Circuit
          </div>
          <h2 className="display mt-2 text-5xl sm:text-7xl">Ranked 1v1</h2>
          <p className="mt-3 max-w-md text-sm text-muted-foreground">
            Head-to-head live duel, identical questions, identical clock. The ultimate test of general knowledge.
          </p>
          <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="label-xs text-muted-foreground">Your Rating</div>
              <div className="numeric text-4xl text-gold sm:text-5xl font-black">{fmt(profile.elo)} ELO</div>
              <div className="label-xs mt-1 font-bold" style={{ color: d.color }}>
                {d.label}
              </div>
            </div>
            <Button size="lg" variant="prestige" className="shadow-[0_5px_0_0_oklch(0.55_0.13_60)]">
              <Swords size={20} /> Find Opponent
            </Button>
          </div>
        </div>
      </Link>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <ModeCard
          to="/quiz"
          icon={<InfinityIcon size={20} strokeWidth={2.5} />}
          title="Infinite Practice"
          copy="Questions without limits. Sharpen your speed and earn XP."
          meta="Training Mode"
        />
        <ModeCard
          to="/daily"
          icon={<Calendar size={20} strokeWidth={2.5} />}
          title="Daily 12"
          copy="Same 12 curated questions for everyone. Exactly one attempt per day."
          meta="Resets in 8h"
          tone="accent"
        />
        <ModeCard
          to="/battles"
          icon={<Swords size={20} strokeWidth={2.5} />}
          title="Quick Battle"
          copy="Challenge a friend with a viral shareable link. Highest score wins."
          meta="1v1 Peer Duel"
        />
        <ModeCard
          to="/friends"
          icon={<Users size={20} strokeWidth={2.5} />}
          title="Friends Online"
          copy="3 rivals from France are online right now in lobby."
          meta="Instant Challenge"
        />
      </div>

      <div className="mt-8">
        <div className="label-xs mb-3 flex items-center gap-2 text-muted-foreground font-black">
          <Layers size={14} strokeWidth={3} /> Category Runs
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((c) => (
            <Link key={c.id} to="/quiz">
              <Panel className="h-full p-3 transition-colors hover:border-primary/50">
                <div className="text-2xl">{c.icon}</div>
                <div className="display mt-2 text-sm">{c.label}</div>
                <div className="label-xs mt-1 text-muted-foreground font-mono">{fmt(c.questions)} Q</div>
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
        <div className={`label-xs flex items-center gap-2 ${tone === "accent" ? "text-accent" : "text-primary"} font-black`}>
          {icon} {meta}
        </div>
        <div className="display mt-3 text-2xl">{title}</div>
        <p className="mt-1 text-sm text-muted-foreground">{copy}</p>
      </Panel>
    </Link>
  );
}
