import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { Page } from "@/components/AppShell";
import { Panel, ProgressBar, Tabs } from "@/components/kit/primitives";
import { LeaderboardRow } from "@/components/kit/game";
import { DivisionBadge } from "@/components/kit/badges";
import {
  countryRankings,
  currentUser,
  franceLeaderboard,
  friendsLeaderboard,
  nearbyLeaderboard,
  topLeaderboard,
} from "@/data/mock";
import { divisionForElo, fmt } from "@/lib/game";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/rankings")({
  head: () => ({
    meta: [
      { title: "World league & country rankings — QuizArena" },
      {
        name: "description",
        content:
          "Track the world ELO leaderboard, your nearby rivals and the global country knowledge ranking.",
      },
      { property: "og:title", content: "World league & country rankings — QuizArena" },
      { property: "og:description", content: "Top 100, friends, France and nearby rivals." },
    ],
  }),
  component: Rankings,
});

type Scope = "top" | "friends" | "france" | "nearby" | "countries";

function Rankings() {
  const [scope, setScope] = React.useState<Scope>("top");
  const elo = 1475;
  const d = divisionForElo(elo);

  const list =
    scope === "top"
      ? topLeaderboard
      : scope === "friends"
        ? friendsLeaderboard
        : scope === "france"
          ? franceLeaderboard
          : nearbyLeaderboard;

  return (
    <Page title="World League" subtitle="One rating. 184 countries. Everyone on the same ladder." wide>
      <Panel glow className="mb-5">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <div className="min-w-0">
            <div className="label-xs text-muted-foreground">Your rating</div>
            <div className="numeric mt-1 text-5xl text-gold sm:text-6xl">{fmt(elo)}</div>
          </div>
          <DivisionBadge elo={elo} size="lg" />
        </div>
        <div className="mt-5">
          <div className="label-xs mb-2 flex justify-between text-muted-foreground">
            <span>{d.label}</span>
            <span>
              {d.ceiling - elo} to {d.nextLabel}
            </span>
          </div>
          <ProgressBar value={d.progress} color={`linear-gradient(90deg, ${d.color}, var(--gold))`} />
        </div>
      </Panel>

      <Tabs
        value={scope}
        onChange={setScope}
        tabs={[
          { id: "top", label: "Top 100" },
          { id: "friends", label: "Friends" },
          { id: "france", label: "France" },
          { id: "nearby", label: "Nearby" },
          { id: "countries", label: "Countries" },
        ]}
      />

      {scope === "countries" ? (
        <CountryRankings />
      ) : (
        <div className="mt-4 space-y-1.5">
          {scope === "nearby" && (
            <p className="label-xs mb-3 text-muted-foreground">
              Players within a few points of you. Pass one to climb.
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
  const [metric, setMetric] = React.useState<"power" | "total">("power");
  const sorted = [...countryRankings].sort((a, b) =>
    metric === "power" ? b.power - a.power : b.totalPoints - a.totalPoints,
  );
  const france = countryRankings.find((c) => c.country.code === "FR")!;
  const uk = countryRankings.find((c) => c.country.code === "GB")!;
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
              { id: "power", label: "Power" },
              { id: "total", label: "Total" },
            ]}
          />
          <div className="space-y-1.5">
            {sorted.map((c, i) => (
              <div
                key={c.country.code}
                className={cn(
                  "grid grid-cols-[2rem_auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border px-3 py-3",
                  c.country.code === "FR"
                    ? "border-primary/60 bg-primary/10"
                    : "border-transparent bg-surface",
                )}
              >
                <span className={cn("numeric text-lg", i < 3 ? "text-gold" : "text-muted-foreground")}>
                  {i + 1}
                </span>
                <span className="text-xl leading-none">{c.country.flag}</span>
                <span className="display truncate text-base">{c.country.name}</span>
                <span className="numeric text-right text-lg">
                  {metric === "power" ? fmt(c.power) : fmt(c.totalPoints)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <Panel className="h-fit">
          <div className="label-xs text-muted-foreground">Your country</div>
          <div className="display mt-2 text-2xl">{france.country.flag} France</div>
          <div className="numeric mt-3 text-5xl text-gold">#{france.rank}</div>
          <div className="numeric mt-3 text-2xl">{fmt(france.totalPoints)}</div>
          <div className="label-xs mt-1 text-success">+{fmt(france.todayPoints)} today</div>

          <div className="mt-6">
            <div className="label-xs mb-2 flex justify-between text-muted-foreground">
              <span>Next target {uk.country.flag} UK</span>
              <span className="text-foreground">{fmt(gap)} pts</span>
            </div>
            <ProgressBar value={france.totalPoints / uk.totalPoints} striped />
            <p className="mt-3 text-sm text-muted-foreground">
              Every ranked match you win adds points to France.
            </p>
          </div>
        </Panel>
      </div>
    </div>
  );
}
