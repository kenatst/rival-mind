import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Dot } from "lucide-react";
import { Button, Panel } from "@/components/kit/primitives";
import { LeaderboardRow } from "@/components/kit/game";
import { DivisionBadge } from "@/components/kit/badges";
import { Logo } from "@/components/AppShell";
import { countryRankings, topLeaderboard, worldEvent } from "@/data/mock";
import { fmt } from "@/lib/game";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "QuizArena — How smart are you? Play the world ranking" },
      {
        name: "description",
        content:
          "Answer general knowledge questions, earn a world ELO rating and push your country up the global leaderboard. No account required.",
      },
      { property: "og:title", content: "QuizArena — How smart are you?" },
      {
        property: "og:description",
        content: "The competitive world ranking of general knowledge. Play instantly, no account.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const france = countryRankings.find((c) => c.country.code === "FR")!;

  return (
    <div className="stage min-h-screen bg-background">
      <div className="mx-auto w-full max-w-6xl px-4 pb-20 pt-5 sm:px-6">
        <header className="flex items-center justify-between">
          <Logo />
          <Link to="/home" className="label-xs text-muted-foreground hover:text-foreground">
            I have an account
          </Link>
        </header>

        <div className="mt-10 grid items-center gap-10 lg:mt-16 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
          <div className="animate-rise">
            <div className="label-xs inline-flex items-center gap-1 rounded-full border border-accent/50 bg-accent/10 px-3 py-1 text-accent">
              <Dot className="animate-pulse" size={14} /> 41,208 playing right now
            </div>
            <h1 className="display mt-5 text-[3.25rem] leading-[0.86] sm:text-8xl">
              How smart
              <br />
              are <span className="text-primary">you?</span>
            </h1>
            <p className="mt-5 max-w-md text-base text-muted-foreground">
              Ten questions. One world rating. France is currently{" "}
              <span className="font-bold text-foreground">#4 in the world</span>.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link to="/quiz">
                <Button size="xl" variant="primary" className="animate-pulse-ring">
                  Play now <ArrowRight size={20} strokeWidth={3} />
                </Button>
              </Link>
              <span className="label-xs text-muted-foreground">No account required</span>
            </div>

            <Panel className="mt-8 flex items-center justify-between gap-4">
              <div>
                <div className="label-xs text-muted-foreground">
                  {france.country.flag} {france.country.name}
                </div>
                <div className="numeric mt-1 text-3xl">{fmt(france.totalPoints)}</div>
                <div className="label-xs mt-1 text-success">
                  +{fmt(france.todayPoints)} today
                </div>
              </div>
              <div className="text-right">
                <div className="label-xs text-muted-foreground">World</div>
                <div className="numeric text-5xl text-gold">#{france.rank}</div>
              </div>
            </Panel>
          </div>

          <div className="space-y-4">
            <Panel glow className="p-4">
              <div className="label-xs mb-3 flex items-center justify-between text-muted-foreground">
                World top players
                <span className="text-primary">Live</span>
              </div>
              <div className="space-y-1">
                {topLeaderboard.slice(0, 5).map((e) => (
                  <LeaderboardRow key={e.rank} entry={e} />
                ))}
              </div>
            </Panel>

            <div className="grid gap-4 sm:grid-cols-2">
              <Panel>
                <div className="label-xs text-muted-foreground">Live battle</div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="display text-lg">HIKARI</span>
                  <span className="numeric text-2xl text-primary">4</span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="display text-lg text-muted-foreground">FELIX</span>
                  <span className="numeric text-2xl text-muted-foreground">3</span>
                </div>
                <div className="mt-3">
                  <DivisionBadge elo={2718} size="sm" />
                </div>
              </Panel>
              <Panel>
                <div className="label-xs text-muted-foreground">World event</div>
                <div className="display mt-2 text-lg">
                  {worldEvent.home.flag} FRA vs ESP {worldEvent.away.flag}
                </div>
                <div className="numeric mt-3 flex items-baseline justify-between text-xl">
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
            { k: "Players rated", v: "18.4M" },
            { k: "Questions answered", v: "2.1B" },
            { k: "Countries competing", v: "184" },
            { k: "Matches today", v: "3.9M" },
          ].map((s) => (
            <div key={s.k} className="rounded-xl border border-border bg-surface/60 p-4">
              <div className="numeric text-3xl">{s.v}</div>
              <div className="label-xs mt-1 text-muted-foreground">{s.k}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
