import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Dot, Swords, Globe2 } from "lucide-react";
import { Button, Panel } from "@/components/kit/primitives";
import { LeaderboardRow } from "@/components/kit/game";
import { DivisionBadge } from "@/components/kit/badges";
import { Logo } from "@/components/AppShell";
import { countryRankings, topLeaderboard, worldEvent } from "@/data/mock";
import { fmt } from "@/lib/game";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "IQ ARENA — How Smart Are You? World Knowledge League" },
      {
        name: "description",
        content:
          "Answer general knowledge questions, earn your world ELO rating and push your country up the global leaderboard. No account required.",
      },
      { property: "og:title", content: "IQ ARENA — How Smart Are You?" },
      {
        property: "og:description",
        content: "The competitive world ranking of general knowledge. Play instantly, no account needed.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const france = countryRankings.find((c) => c.country.code === "FR")!;

  return (
    <div className="stage min-h-screen bg-background select-none">
      <div className="mx-auto w-full max-w-6xl px-4 pb-20 pt-5 sm:px-6">
        <header className="flex items-center justify-between">
          <Logo />
          <Link to="/home" className="label-xs text-muted-foreground hover:text-primary transition-colors font-bold">
            Enter Game Lobby →
          </Link>
        </header>

        <div className="mt-10 grid items-center gap-10 lg:mt-16 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
          <div className="animate-rise space-y-6">
            <div className="label-xs inline-flex items-center gap-1 rounded-full border border-accent/50 bg-accent/10 px-3 py-1 text-accent font-black">
              <Dot className="animate-pulse" size={14} /> 41,208 players in live battle right now
            </div>

            <h1 className="display text-[3.25rem] leading-[0.86] sm:text-8xl font-black tracking-tight">
              HOW SMART
              <br />
              ARE <span className="text-primary">YOU?</span>
            </h1>

            <p className="max-w-md text-base text-muted-foreground leading-relaxed">
              Ten rapid-fire questions. One world ELO rating. France is currently{" "}
              <span className="font-bold text-foreground">#4 in the world ranking</span>.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link to="/quiz" search={{ mode: "guest" }}>
                <Button size="xl" variant="primary" className="animate-pulse-ring text-xl font-black shadow-[0_6px_0_0_color-mix(in_oklab,var(--primary)_55%,black)]">
                  PLAY INSTANTLY <ArrowRight size={20} strokeWidth={3} />
                </Button>
              </Link>
              <span className="label-xs text-muted-foreground font-mono font-bold">
                ⚡ No account needed
              </span>
            </div>

            <Panel className="flex items-center justify-between gap-4 p-5 shadow-[var(--shadow-lift)]">
              <div>
                <div className="label-xs text-muted-foreground font-bold">
                  {france.country.flag} {france.country.name} · National Vanguard
                </div>
                <div className="numeric mt-1 text-3xl font-black">{fmt(france.totalPoints)} PTS</div>
                <div className="label-xs mt-1 text-success font-bold">
                  +{fmt(france.todayPoints)} points today
                </div>
              </div>
              <div className="text-right">
                <div className="label-xs text-muted-foreground font-bold">World Standing</div>
                <div className="numeric text-5xl text-gold font-black">#{france.rank}</div>
              </div>
            </Panel>
          </div>

          <div className="space-y-4">
            <Panel glow className="p-4 shadow-[var(--shadow-glow)]">
              <div className="label-xs mb-3 flex items-center justify-between text-muted-foreground font-bold">
                <span>World Top Competitors</span>
                <span className="text-primary flex items-center gap-1 font-black">
                  <span className="h-2 w-2 rounded-full bg-primary animate-ping" /> LIVE
                </span>
              </div>
              <div className="space-y-1">
                {topLeaderboard.slice(0, 5).map((e) => (
                  <LeaderboardRow key={e.rank} entry={e} />
                ))}
              </div>
            </Panel>

            <div className="grid gap-4 sm:grid-cols-2">
              <Panel>
                <div className="label-xs text-muted-foreground font-black">Live 1v1 Battle</div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="display text-lg font-bold">HIKARI 🇯🇵</span>
                  <span className="numeric text-2xl text-primary font-black">4</span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="display text-lg text-muted-foreground font-bold">FELIX 🇩🇪</span>
                  <span className="numeric text-2xl text-muted-foreground font-black">3</span>
                </div>
                <div className="mt-3">
                  <DivisionBadge elo={2718} size="sm" />
                </div>
              </Panel>

              <Panel>
                <div className="label-xs text-muted-foreground font-black">Nation War</div>
                <div className="display mt-2 text-lg font-bold">
                  {worldEvent.home.flag} FRA vs ESP {worldEvent.away.flag}
                </div>
                <div className="numeric mt-3 flex items-baseline justify-between text-xl font-black">
                  <span className="text-primary">{worldEvent.homeShare}%</span>
                  <span className="text-accent">{worldEvent.awayShare}%</span>
                </div>
                <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-muted">
                  <span
                    className="bg-primary"
                    style={{ width: `${worldEvent.homeShare}%` }}
                  />
                  <span className="flex-1 bg-accent" />
                </div>
              </Panel>
            </div>
          </div>
        </div>

        <div className="mt-14 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { k: "Rated Competitors", v: "18.4M" },
            { k: "Questions Answered", v: "2.1B" },
            { k: "Competing Nations", v: "184" },
            { k: "Duels Today", v: "3.9M" },
          ].map((s) => (
            <div key={s.k} className="rounded-2xl border border-border bg-surface/60 p-4 text-center">
              <div className="numeric text-3xl font-black text-foreground">{s.v}</div>
              <div className="label-xs mt-1 text-muted-foreground font-bold">{s.k}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
