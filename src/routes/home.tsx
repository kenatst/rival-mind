import { createFileRoute, Link } from "@tanstack/react-router";
import * as React from "react";
import {
  Swords,
  Zap,
  Flame,
  Trophy,
  Sparkles,
  RotateCcw,
  Calendar,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { Button, Panel, ProgressBar } from "@/components/kit/primitives";
import { Avatar, DivisionBadge } from "@/components/kit/badges";
import { divisionForElo, fmt } from "@/lib/game";
import { gameService } from "@/lib/gameService";
import { socialEngine } from "@/engine/socialEngine";
import { modeEngine } from "@/engine/modeEngine";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "Lobby — IQ ARENA" },
      {
        name: "description",
        content: "Contextual battle hub, ranked promotion targets, daily challenges, and rivalries.",
      },
    ],
  }),
  component: HomeLobby,
});

function HomeLobby() {
  const [profile, setProfile] = React.useState(() => gameService.getUserProfile());
  const [daily, setDaily] = React.useState(() => gameService.getDailyChallenge());
  const rivalries = socialEngine.getRivalries();
  const primaryRivalry = rivalries[0];

  const lightningPB = modeEngine.getPersonalBest(profile.id, "lightning") || 24;

  React.useEffect(() => {
    return gameService.subscribe(() => {
      setProfile(gameService.getUserProfile());
      setDaily(gameService.getDailyChallenge());
    });
  }, []);

  const d = divisionForElo(profile.elo);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:py-8 select-none space-y-6">
      {/* 1. Hero Player HUD */}
      <section className="stage rounded-3xl border border-border p-5 sm:p-7 shadow-[var(--shadow-lift)]">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <Avatar initials={profile.initials} color={profile.avatarColor} size={64} ring />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="display truncate text-3xl sm:text-4xl font-black">{profile.username}</h1>
                <span className="text-xl leading-none">{profile.country.flag}</span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <DivisionBadge elo={profile.elo} />
                <span className="label-xs text-muted-foreground flex items-center gap-1">
                  Lvl {profile.level} · <Flame size={13} className="text-gold fill-gold" /> {profile.streak}d streak
                </span>
                {d.isPromotionZone && (
                  <span className="label-xs rounded-md bg-accent/20 text-accent border border-accent/40 px-2 py-0.5 animate-pulse font-black">
                    ⚡ PROMOTION MATCH
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="numeric text-4xl text-gold sm:text-6xl font-black">{fmt(profile.elo)}</div>
            <div className="label-xs mt-1 text-muted-foreground font-mono">
              World #{fmt(profile.worldRank)} · France #{profile.countryRank}
            </div>
          </div>
        </div>

        <div className="mt-5">
          <div className="label-xs mb-2 flex justify-between text-muted-foreground font-bold">
            <span>{d.label}</span>
            <span className="text-primary">
              {d.eloRemaining} ELO to {d.nextLabel}
            </span>
          </div>
          <ProgressBar value={d.progress} color={`linear-gradient(90deg, ${d.color}, var(--primary))`} striped />
        </div>

        {/* Primary Ranked CTA */}
        <Link to="/matchmaking" className="mt-6 block">
          <Button size="xl" full className="text-2xl tracking-[0.06em] shadow-[0_6px_0_0_color-mix(in_oklab,var(--primary)_55%,black)] font-black">
            <Swords size={26} strokeWidth={3} /> PLAY RANKED
          </Button>
        </Link>
      </section>

      {/* 2. Three Focused Contextual Recommendation Action Cards */}
      <div>
        <div className="label-xs text-muted-foreground font-black uppercase mb-3 tracking-wider">
          Recommended Contextual Actions
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {/* Card A: 60s Lightning Record Challenge */}
          <Link to={"/modes/lightning" as any} className="block">
            <Panel className="h-full p-5 flex flex-col justify-between border-primary/40 hover:border-primary transition-all active:scale-[0.99] group bg-primary/5">
              <div>
                <div className="label-xs text-primary font-black flex items-center gap-1.5 mb-2">
                  <Zap size={14} /> 60s Lightning Challenge
                </div>
                <h3 className="display text-2xl font-black text-foreground group-hover:text-primary transition-colors">
                  Beat Your Record
                </h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  Your best: <strong className="text-foreground">{lightningPB} correct</strong> in 60s. Ranked #841 France today.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs font-black text-primary">
                <span>Start 60s Clock</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </Panel>
          </Link>

          {/* Card B: Head-to-Head Rivalry Rematch */}
          {primaryRivalry && (
            <Link to="/battles" className="block">
              <Panel className="h-full p-5 flex flex-col justify-between border-accent/40 hover:border-accent transition-all active:scale-[0.99] group bg-accent/5">
                <div>
                  <div className="label-xs text-accent font-black flex items-center gap-1.5 mb-2">
                    <Swords size={14} /> Head-to-Head Rivalry
                  </div>
                  <h3 className="display text-2xl font-black text-foreground group-hover:text-accent transition-colors">
                    Settle the Score
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    KENAEL <strong className="text-foreground">{primaryRivalry.userWins} — {primaryRivalry.opponentWins}</strong> {primaryRivalry.opponentUsername}. {primaryRivalry.narrativeContext}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs font-black text-accent">
                  <span>Send Rematch</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </Panel>
            </Link>
          )}

          {/* Card C: Daily Gem or Daily 12 */}
          <Link to={"/modes/daily-gem" as any} className="block">
            <Panel className="h-full p-5 flex flex-col justify-between border-gold/40 hover:border-gold transition-all active:scale-[0.99] group bg-gold/5">
              <div>
                <div className="label-xs text-gold font-black flex items-center gap-1.5 mb-2">
                  <Sparkles size={14} /> Daily Ritual
                </div>
                <h3 className="display text-2xl font-black text-foreground group-hover:text-gold transition-colors">
                  Today's Daily Gem
                </h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  One difficult question. Only 14.8% worldwide got it right today. Keep your 14-day streak alive.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs font-black text-gold">
                <span>Play Daily Gem</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </Panel>
          </Link>
        </div>
      </div>

      {/* 3. Quick Link to Full Play Hub */}
      <div className="p-4 rounded-2xl border border-border bg-surface flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-surface-2 text-primary font-black">
            <Trophy size={18} />
          </div>
          <div>
            <div className="text-sm font-black text-foreground">Explore Full Play Arena</div>
            <div className="text-xs text-muted-foreground">Category Towers, Free Answer Arena, Sudden Death & 5s Blitz</div>
          </div>
        </div>
        <Link to="/play">
          <Button size="sm" variant="surface">
            View All Modes →
          </Button>
        </Link>
      </div>
    </div>
  );
}
