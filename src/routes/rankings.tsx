import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { Page } from "@/components/AppShell";
import { Panel, ProgressBar, Tabs } from "@/components/kit/primitives";
import { LeaderboardRow } from "@/components/kit/game";
import { DivisionBadge } from "@/components/kit/badges";
import { divisionForElo, fmt, TIERS } from "@/lib/game";
import { gameService } from "@/lib/gameService";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/rankings")({
  head: () => ({
    meta: [
      { title: "World League & Country Wars — IQ ARENA" },
      {
        name: "description",
        content:
          "Track the world ELO leaderboard, your nearby rivals and the global country knowledge ranking.",
      },
      { property: "og:title", content: "World League & Country Wars — IQ ARENA" },
      { property: "og:description", content: "Top 100, friends, France and nearby rivals." },
    ],
  }),
  component: Rankings,
});

type Scope = "nearby" | "top" | "france" | "friends" | "countries";

function Rankings() {
  const [scope, setScope] = React.useState<Scope>("nearby");
  const [profile, setProfile] = React.useState(() => gameService.getUserProfile());

  React.useEffect(() => {
    return gameService.subscribe(() => {
      setProfile(gameService.getUserProfile());
    });
  }, []);

  const d = divisionForElo(profile.elo);

  const getList = () => {
    switch (scope) {
      case "nearby":
        return gameService.getNearbyPlayers();
      case "top":
        return gameService.getTop100();
      case "france":
        return gameService.getFranceTop();
      case "friends":
        return gameService.getFriendsLeaderboard();
      default:
        return gameService.getNearbyPlayers();
    }
  };

  const list = getList();

  return (
    <Page title="World League" subtitle="One rating. 184 countries. Everyone on the same global circuit." wide>
      {/* Player Standing Highlight */}
      <Panel glow className="mb-5 p-6 shadow-[var(--shadow-glow)]">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <div className="min-w-0">
            <div className="label-xs text-muted-foreground font-bold">Your Official Ranking</div>
            <div className="numeric mt-1 text-5xl text-gold sm:text-6xl font-black">{fmt(profile.elo)} ELO</div>
            <div className="label-xs mt-1 text-muted-foreground font-mono">
              World #{fmt(profile.worldRank)} · France #{profile.countryRank}
            </div>
          </div>
          <DivisionBadge elo={profile.elo} size="lg" />
        </div>
        <div className="mt-5">
          <div className="label-xs mb-2 flex justify-between text-muted-foreground font-bold">
            <span>Current Division: {d.label}</span>
            <span className="text-primary">
              {d.eloRemaining} ELO to {d.nextLabel}
            </span>
          </div>
          <ProgressBar value={d.progress} color={`linear-gradient(90deg, ${d.color}, var(--primary))`} striped />
        </div>
      </Panel>

      {/* Division Milestones Overview */}
      <div className="mb-5 p-3 rounded-2xl border border-border bg-surface/60 overflow-x-auto">
        <div className="label-xs mb-2 text-muted-foreground font-black">Division Milestones</div>
        <div className="flex items-center gap-2 min-w-[680px]">
          {Object.entries(TIERS).map(([tierKey, cfg]) => {
            const isCurrent = d.tier === tierKey;
            return (
              <div
                key={tierKey}
                className={cn(
                  "flex-1 p-2.5 rounded-xl border text-center transition-colors",
                  isCurrent
                    ? "border-primary bg-primary/10 shadow-[var(--shadow-glow)]"
                    : "border-border/40 bg-surface/30 opacity-70",
                )}
              >
                <div className="display text-xs font-bold" style={{ color: cfg.color }}>
                  {cfg.tier}
                </div>
                <div className="numeric text-[10px] text-muted-foreground mt-0.5 font-mono">
                  {cfg.min}+ ELO
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Tabs
        value={scope}
        onChange={setScope}
        tabs={[
          { id: "nearby", label: "🔥 Nearby Rivals" },
          { id: "top", label: "🌍 World Top 100" },
          { id: "france", label: "🇫🇷 France" },
          { id: "friends", label: "👥 Friends" },
          { id: "countries", label: "📊 Country Wars" },
        ]}
      />

      {scope === "countries" ? (
        <CountryRankings />
      ) : (
        <div className="mt-4 space-y-1.5">
          {scope === "nearby" && (
            <p className="label-xs mb-3 text-muted-foreground">
              Competitors within striking distance of your rating. Defeat them to advance your world rank.
            </p>
          )}
          {list.map((e) => (
            <LeaderboardRow key={`${e.rank}-${e.player.username}`} entry={e} />
          ))}
        </div>
      )}
    </Page>
  );
}

function CountryRankings() {
  const [metric, setMetric] = React.useState<"total" | "power">("total");
  const countries = gameService.getCountryRankings();
  const sorted = [...countries].sort((a, b) =>
    metric === "power" ? b.power - a.power : b.totalPoints - a.totalPoints,
  );
  const france = countries.find((c) => c.country.code === "FR")!;
  const uk = countries.find((c) => c.country.code === "GB")!;
  const gap = uk.totalPoints - france.totalPoints;

  return (
    <div className="mt-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <div>
          <Tabs
            className="mb-3"
            value={metric}
            onChange={setMetric}
            tabs={[
              { id: "total", label: "📊 Total Points" },
              { id: "power", label: "⚡ Power (Avg ELO)" },
            ]}
          />
          <div className="space-y-1.5">
            {sorted.map((c, i) => (
              <div
                key={c.country.code}
                className={cn(
                  "grid grid-cols-[2rem_auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border px-3 py-3 transition-colors",
                  c.country.code === "FR"
                    ? "border-primary/60 bg-primary/10"
                    : "border-transparent bg-surface",
                )}
              >
                <span className={cn("numeric text-lg font-black", i < 3 ? "text-gold" : "text-muted-foreground")}>
                  #{i + 1}
                </span>
                <span className="text-xl leading-none">{c.country.flag}</span>
                <span className="display truncate text-base font-bold">{c.country.name}</span>
                <span className="numeric text-right text-lg font-bold">
                  {metric === "power" ? `${fmt(c.power)} ELO` : fmt(c.totalPoints)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <Panel className="h-fit space-y-3 p-5">
          <div className="label-xs text-muted-foreground font-black">Your Country Standing</div>
          <div className="display mt-1 text-2xl font-black">{france.country.flag} France</div>
          <div className="numeric text-5xl text-gold font-black">#{france.rank} World</div>
          <div className="numeric text-2xl font-black">{fmt(france.totalPoints)} pts</div>
          <div className="label-xs text-success font-bold">+{fmt(france.todayPoints)} contributed today</div>

          <div className="mt-4 pt-3 border-t border-border space-y-2">
            <div className="label-xs flex justify-between text-muted-foreground font-bold">
              <span>Next Target {uk.country.flag} UK (#3)</span>
              <span className="text-foreground">{fmt(gap)} pts to overtake</span>
            </div>
            <ProgressBar value={france.totalPoints / uk.totalPoints} striped />
            <p className="text-xs text-muted-foreground pt-1 leading-relaxed">
              Every ranked match you win adds points directly to France's national standing.
            </p>
          </div>
        </Panel>
      </div>
    </div>
  );
}
