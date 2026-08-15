import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { Page } from "@/components/AppShell";
import { Panel, ProgressBar, Tabs } from "@/components/kit/primitives";
import { LeaderboardRow } from "@/components/kit/game";
import { DivisionBadge } from "@/components/kit/badges";
import { divisionForElo, fmt, TIERS } from "@/lib/game";
import { gameService } from "@/lib/gameService";
import { cn } from "@/lib/utils";
import { Trophy, Zap, Flame, Sparkles, Building2, Crown, Swords } from "lucide-react";

export const Route = createFileRoute("/rankings")({
  head: () => ({
    meta: [
      { title: "World Rankings & Leaderboard Domains — IQ ARENA" },
      {
        name: "description",
        content: "Track official Arena Ratings, 60s Lightning records, 5s Blitz speedboards, and Streak leaderboards.",
      },
    ],
  }),
  component: Rankings,
});

type LeaderboardDomain =
  | "arena"
  | "daily12"
  | "lightning"
  | "blitz"
  | "streak"
  | "towers"
  | "cup";

function Rankings() {
  const [domain, setDomain] = React.useState<LeaderboardDomain>("arena");
  const [profile, setProfile] = React.useState(() => gameService.getUserProfile());

  React.useEffect(() => {
    return gameService.subscribe(() => {
      setProfile(gameService.getUserProfile());
    });
  }, []);

  const d = divisionForElo(profile.elo);

  const getList = () => {
    switch (domain) {
      case "arena":
        return gameService.getTop100();
      case "daily12":
        return gameService.getFranceTop();
      case "lightning":
        return gameService.getNearbyPlayers();
      case "blitz":
        return gameService.getFriendsLeaderboard();
      case "streak":
        return gameService.getNearbyPlayers();
      case "towers":
        return gameService.getFranceTop();
      case "cup":
        return gameService.getTop100();
      default:
        return gameService.getTop100();
    }
  };

  const list = getList();

  return (
    <Page
      title="World Leaderboards"
      subtitle="7 Official Competition Domains · Arena Ratings, Lightning Records & Streak PBs"
      wide
    >
      {/* Player Standing Highlight */}
      <Panel glow className="mb-6 p-6 shadow-[var(--shadow-glow)]">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <div className="min-w-0">
            <div className="label-xs text-muted-foreground font-bold">Your Official Arena Standing</div>
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

      {/* Domain Tabs */}
      <div className="mb-6">
        <Tabs
          value={domain}
          onChange={(val) => setDomain(val as LeaderboardDomain)}
          tabs={[
            { id: "arena", label: "⚔️ Arena Elo" },
            { id: "daily12", label: "🎯 Daily 12" },
            { id: "lightning", label: "⚡ Lightning 60s" },
            { id: "blitz", label: "⏱️ Blitz 5s" },
            { id: "streak", label: "🔥 Streak PBs" },
            { id: "towers", label: "🏛️ Tower Floors" },
            { id: "cup", label: "🏆 Weekend Cup" },
          ]}
        />
      </div>

      {/* Leaderboard Table List */}
      <Panel className="p-0 overflow-hidden border-border">
        <div className="px-4 py-3 bg-surface-2/80 border-b border-border flex items-center justify-between text-xs font-bold text-muted-foreground">
          <span>Rank & Competitor</span>
          <span>
            {domain === "arena"
              ? "Elo Rating"
              : domain === "lightning"
              ? "Max Correct in 60s"
              : domain === "streak"
              ? "Max Streak"
              : "Score / Level"}
          </span>
        </div>

        <div className="divide-y divide-border">
          {list.map((entry, idx) => (
            <LeaderboardRow
              key={entry.player.id}
              entry={entry}
              highlight={entry.player.username === profile.username}
            />
          ))}
        </div>
      </Panel>
    </Page>
  );
}
