import { createFileRoute } from "@tanstack/react-router";
import { Page } from "@/components/AppShell";
import { Panel, ProgressBar } from "@/components/kit/primitives";
import { StatTile } from "@/components/kit/game";
import { Avatar, CountryBadge, DivisionBadge } from "@/components/kit/badges";
import { categoryStats, currentUser } from "@/data/mock";
import { divisionForElo, fmt } from "@/lib/game";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: `${currentUser.username} — player profile | QuizArena` },
      { name: "description", content: "Rating history, division, category mastery and career stats." },
      { property: "og:title", content: "Player profile — QuizArena" },
      { property: "og:description", content: "Division, ELO history and category mastery." },
    ],
  }),
  component: Profile,
});

function Profile() {
  const d = divisionForElo(currentUser.elo);

  return (
    <Page title="Profile" wide>
      <Panel glow>
        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4">
          <Avatar initials={currentUser.initials} color={currentUser.avatarColor} size={72} ring />
          <div className="min-w-0">
            <h2 className="display truncate text-3xl">{currentUser.username}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <CountryBadge country={currentUser.country} />
              <DivisionBadge elo={currentUser.elo} size="sm" />
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="World ELO" value={fmt(currentUser.elo)} accent="gold" />
          <StatTile label="Level" value={currentUser.level} accent="primary" />
          <StatTile label="World rank" value={`#${fmt(currentUser.worldRank)}`} />
          <StatTile label="Streak" value={`${currentUser.streak} d`} accent="primary" />
        </div>

        <div className="mt-6">
          <div className="label-xs mb-2 flex justify-between text-muted-foreground">
            <span>Level {currentUser.level}</span>
            <span>
              {fmt(currentUser.xp)} / {fmt(currentUser.xpToNext)} XP
            </span>
          </div>
          <ProgressBar value={currentUser.xp / currentUser.xpToNext} />
        </div>

        <div className="mt-5">
          <div className="label-xs mb-2 flex justify-between text-muted-foreground">
            <span>{d.label}</span>
            <span>{d.ceiling - currentUser.elo} to {d.nextLabel}</span>
          </div>
          <ProgressBar value={d.progress} color={`linear-gradient(90deg, ${d.color}, var(--gold))`} />
        </div>
      </Panel>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <Panel>
          <div className="label-xs mb-4 text-muted-foreground">Category mastery</div>
          <div className="space-y-4">
            {categoryStats.map((c) => (
              <div key={c.category}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="font-bold">
                    {c.icon} {c.category}
                  </span>
                  <span className="numeric text-muted-foreground">{c.accuracy}%</span>
                </div>
                <ProgressBar value={c.accuracy / 100} />
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <div className="label-xs mb-4 text-muted-foreground">Career</div>
          <div className="grid grid-cols-2 gap-3">
            <StatTile label="Matches" value={fmt(currentUser.matchesPlayed)} />
            <StatTile label="Win rate" value={`${currentUser.winRate}%`} accent="primary" />
            <StatTile label="Accuracy" value={`${currentUser.accuracy}%`} />
            <StatTile label="Peak ELO" value={fmt(currentUser.peakElo)} accent="gold" />
          </div>
          <div className="label-xs mt-5 mb-3 text-muted-foreground">Last 10 ranked</div>
          <div className="flex gap-1.5">
            {currentUser.form.map((r, i) => (
              <span
                key={i}
                className={`numeric grid h-8 flex-1 place-items-center rounded-md text-xs ${
                  r === "W" ? "bg-success/20 text-success" : "bg-danger/20 text-danger"
                }`}
              >
                {r}
              </span>
            ))}
          </div>
        </Panel>
      </div>
    </Page>
  );
}
