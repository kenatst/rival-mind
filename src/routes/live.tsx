import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { Page } from "@/components/AppShell";
import { Button, Panel } from "@/components/kit/primitives";
import { StatTile } from "@/components/kit/game";
import { liveEvent } from "@/data/mock";
import { soundService } from "@/lib/soundService";
import { Tv, Sparkles, Bell, Check, Users, Trophy, Clock } from "lucide-react";

export const Route = createFileRoute("/live")({
  head: () => ({
    meta: [
      { title: "Live Show — World Championship | IQ ARENA" },
      { name: "description", content: "A weekly televised-style live stadium quiz where thousands play the same questions at the same second." },
      { property: "og:title", content: "Live Show — IQ ARENA" },
      { property: "og:description", content: "Sunday 20:00 CEST. Live broadcasted stadium quiz. One survivor takes the pot." },
    ],
  }),
  component: LiveScreen,
});

function LiveScreen() {
  const [isRegistered, setIsRegistered] = React.useState(false);

  const handleToggle = () => {
    soundService.playTap();
    setIsRegistered((prev) => !prev);
  };

  return (
    <Page title="Live Show" subtitle="Synchronized live stadium trivia tournament with global knockout rounds." wide>
      <div className="stage rounded-3xl border border-accent/50 p-6 sm:p-10 shadow-[var(--shadow-lift)] space-y-6">
        <div className="flex items-center justify-between">
          <div className="label-xs inline-flex items-center gap-2 rounded-full bg-accent/20 border border-accent/40 px-3 py-1 text-accent font-black">
            <span className="h-2 w-2 animate-ping rounded-full bg-accent" /> LIVE BROADCAST PREVIEW
          </div>
          <span className="label-xs text-gold font-mono font-bold">
            {liveEvent.startsAt}
          </span>
        </div>

        <div>
          <h2 className="display text-4xl sm:text-7xl font-black">
            🇫🇷 FRANCE <span className="text-muted-foreground text-2xl sm:text-4xl">vs</span> THE WORLD
          </h2>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground leading-relaxed">
            Over 250,000 players logged in simultaneously. 7 seconds per question. One wrong answer eliminates you — survive 30 rounds to share the €50,000 Knowledge Cup prize pool.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="Registered Players" value="254K" accent="primary" />
          <StatTile label="Questions" value="30 Qs" />
          <StatTile label="Clock" value="7s / Q" />
          <StatTile label="Prize Pool" value="€50,000" accent="gold" />
        </div>

        <Button
          variant={isRegistered ? "surface" : "live"}
          size="xl"
          className="mt-4 shadow-[0_5px_0_0_color-mix(in_oklab,var(--accent)_55%,black)] text-lg"
          full
          onClick={handleToggle}
        >
          {isRegistered ? (
            <>
              <Check size={20} /> YOU ARE REGISTERED · REMINDER ACTIVE
            </>
          ) : (
            <>
              <Bell size={20} /> REGISTER FOR LIVE SHOW · REMIND ME
            </>
          )}
        </Button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          { t: "Phase 1 · Rapid Qualifier", d: "30 rapid-fire questions. Top 10,000 players advance to sudden death." },
          { t: "Phase 2 · Gauntlet", d: "Sudden death knockout. One wrong answer eliminates your country slot." },
          { t: "Phase 3 · Grand Final", d: "Top 10 players live on broadcast stream for the Genesis Apex Knowledge Trophy." },
        ].map((f) => (
          <Panel key={f.t} className="p-5">
            <div className="display text-base font-bold text-foreground">{f.t}</div>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{f.d}</p>
          </Panel>
        ))}
      </div>
    </Page>
  );
}
