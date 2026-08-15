import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { Button, Panel } from "@/components/kit/primitives";
import { DivisionBadge } from "@/components/kit/badges";
import { AuthModal } from "@/components/AuthModal";
import { getLastRun } from "@/lib/session";
import { fmt, useCountUp } from "@/lib/game";
import { authService } from "@/services/authService";
import { Sparkles, ArrowRight, Shield } from "lucide-react";

export const Route = createFileRoute("/result")({
  head: () => ({
    meta: [
      { title: "Your Estimated World Rank — IQ ARENA" },
      {
        name: "description",
        content: "See your estimated ELO, world rank and national rank after your first ten questions.",
      },
      { property: "og:title", content: "Your Estimated World Rank — IQ ARENA" },
      { property: "og:description", content: "Estimated ELO, world rank and country rank." },
    ],
  }),
  component: PostGame,
});

function PostGame() {
  const navigate = useNavigate();
  const { score, total } = getLastRun();
  const percentile = Math.min(99, 45 + score * 5);
  const elo = 820 + score * 38;
  const worldRank = Math.max(5000, 1_400_000 - score * 110_000);
  const eloShown = useCountUp(elo, 1400, 0);

  const [isAuthOpen, setIsAuthOpen] = React.useState(false);
  const auth = authService.getAuthState();

  const handleClaimRank = () => {
    if (auth.isAuthenticated) {
      navigate({ to: "/home" });
    } else {
      setIsAuthOpen(true);
    }
  };

  return (
    <div className="stage flex min-h-screen items-center justify-center bg-background px-4 py-10 select-none">
      <div className="w-full max-w-lg space-y-6">
        <div className="animate-rise text-center">
          <div className="label-xs text-muted-foreground font-black">Skill Estimation Result</div>
          <div className="numeric mt-2 text-[5.5rem] leading-none text-primary sm:text-[7rem] font-black drop-shadow-2xl">
            {percentile}%
          </div>
          <div className="label-xs mt-1 text-muted-foreground font-bold">
            Better than {percentile}% of players worldwide
          </div>
        </div>

        <Panel glow className="space-y-5 p-6 shadow-[var(--shadow-lift)]">
          <div className="flex items-end justify-between border-b border-border pb-4">
            <div>
              <div className="label-xs text-muted-foreground">Questions Answered</div>
              <div className="numeric mt-1 text-4xl font-black">
                {score} <span className="text-muted-foreground text-2xl font-normal">/ {total}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="label-xs text-muted-foreground">Estimated Skill</div>
              <div className="numeric mt-1 text-4xl text-gold font-black">{fmt(eloShown)} ELO</div>
              <DivisionBadge elo={elo} size="sm" className="mt-2" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border bg-surface-2/60 p-3">
              <div className="label-xs text-muted-foreground">World Standing</div>
              <div className="numeric mt-1 text-2xl font-black">#{fmt(worldRank)}</div>
            </div>
            <div className="rounded-xl border border-border bg-surface-2/60 p-3">
              <div className="label-xs text-muted-foreground">🇫🇷 France Standing</div>
              <div className="numeric mt-1 text-2xl font-black">#{fmt(Math.round(worldRank / 24))}</div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Your calibration rating is temporary. Claim your rank to unlock full Ranked Matchmaking, join private leagues, and defend France on the world stage.
          </p>

          <div className="space-y-3 pt-2">
            <Button
              size="xl"
              full
              variant="primary"
              onClick={handleClaimRank}
              className="shadow-[0_5px_0_0_color-mix(in_oklab,var(--primary)_55%,black)] text-xl font-black"
            >
              <Sparkles size={20} /> Claim My Rank & Enter Lobby <ArrowRight size={18} />
            </Button>
            <Link to="/play" className="block">
              <Button variant="ghost" full size="md">
                Browse Game Modes
              </Button>
            </Link>
          </div>
        </Panel>
      </div>

      <AuthModal
        open={isAuthOpen}
        onClose={() => {
          setIsAuthOpen(false);
          navigate({ to: "/home" });
        }}
        estimatedElo={elo}
      />
    </div>
  );
}
