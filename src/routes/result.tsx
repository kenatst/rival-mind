import { createFileRoute, Link } from "@tanstack/react-router";
import { Button, Panel } from "@/components/kit/primitives";
import { DivisionBadge } from "@/components/kit/badges";
import { getLastRun } from "@/lib/session";
import { fmt, useCountUp } from "@/lib/game";

export const Route = createFileRoute("/result")({
  head: () => ({
    meta: [
      { title: "Your estimated world rank — QuizArena" },
      {
        name: "description",
        content: "See your estimated ELO, world rank and national rank after your first ten questions.",
      },
      { property: "og:title", content: "Your estimated world rank — QuizArena" },
      { property: "og:description", content: "Estimated ELO, world rank and country rank." },
    ],
  }),
  component: PostGame,
});

function PostGame() {
  const { score, total } = getLastRun();
  const percentile = 40 + score * 4;
  const elo = 900 + score * 28;
  const worldRank = 1_500_000 - score * 82_000;
  const eloShown = useCountUp(elo, 1400, 0);

  return (
    <div className="stage flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="animate-rise text-center">
          <div className="label-xs text-muted-foreground">You're better than</div>
          <div className="numeric mt-2 text-[5.5rem] leading-none text-primary sm:text-[7rem]">
            {percentile}%
          </div>
          <div className="label-xs mt-1 text-muted-foreground">of players worldwide</div>
        </div>

        <Panel glow className="mt-8 space-y-5 p-6">
          <div className="flex items-end justify-between">
            <div>
              <div className="label-xs text-muted-foreground">Score</div>
              <div className="numeric mt-1 text-4xl">
                {score} <span className="text-muted-foreground">/ {total}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="label-xs text-muted-foreground">Estimated skill</div>
              <div className="numeric mt-1 text-4xl text-gold">{fmt(eloShown)}</div>
              <DivisionBadge elo={elo} size="sm" className="mt-2" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border bg-surface-2/50 p-3">
              <div className="label-xs text-muted-foreground">World</div>
              <div className="numeric mt-1 text-2xl">#{fmt(worldRank)}</div>
            </div>
            <div className="rounded-xl border border-border bg-surface-2/50 p-3">
              <div className="label-xs text-muted-foreground">🇫🇷 France</div>
              <div className="numeric mt-1 text-2xl">#{fmt(Math.round(worldRank / 17.8))}</div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Your rank is temporary. Save it to start climbing and defend it against friends.
          </p>

          <Link to="/home" className="block">
            <Button size="xl" full variant="prestige">
              Save my rank
            </Button>
          </Link>
          <Link to="/quiz" className="block">
            <Button variant="ghost" full size="md">
              Continue as guest
            </Button>
          </Link>
        </Panel>
      </div>
    </div>
  );
}
