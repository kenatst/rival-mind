import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, Swords, Trophy, Zap } from "lucide-react";
import { Button, Panel, ProgressBar } from "@/components/kit/primitives";
import { Avatar, DivisionBadge } from "@/components/kit/badges";
import { currentUser, privateLeague, worldEvent } from "@/data/mock";
import { divisionForElo, fmt } from "@/lib/game";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "Lobby — QuizArena" },
      {
        name: "description",
        content: "Your daily challenge, battle requests, world events and private league standings.",
      },
      { property: "og:title", content: "Lobby — QuizArena" },
      { property: "og:description", content: "Jump straight into your next ranked match." },
    ],
  }),
  component: HomeLobby,
});

function HomeLobby() {
  const d = divisionForElo(currentUser.elo);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:py-10">
      <section className="stage rounded-3xl border border-border p-5 sm:p-7">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <Avatar
              initials={currentUser.initials}
              color={currentUser.avatarColor}
              size={64}
              ring
            />
            <div className="min-w-0">
              <h1 className="display truncate text-3xl sm:text-4xl">{currentUser.username}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <DivisionBadge elo={currentUser.elo} />
                <span className="label-xs text-muted-foreground">
                  Lvl {currentUser.level} · 🔥 {currentUser.streak}
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="numeric text-4xl text-gold sm:text-6xl">{fmt(currentUser.elo)}</div>
            <div className="label-xs mt-1 text-muted-foreground">
              World #{fmt(currentUser.worldRank)}
            </div>
          </div>
        </div>

        <div className="mt-5">
          <div className="label-xs mb-2 flex justify-between text-muted-foreground">
            <span>{d.label}</span>
            <span>
              {d.ceiling - currentUser.elo} ELO to {d.nextLabel}
            </span>
          </div>
          <ProgressBar value={d.progress} striped />
        </div>

        <Link to="/play" className="mt-6 block">
          <Button size="xl" full className="text-2xl tracking-[0.06em]">
            Play
          </Button>
        </Link>
      </section>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <LobbyCard
          icon={<Clock size={18} strokeWidth={2.5} />}
          kicker="Daily challenge"
          title="Daily 12"
          detail="8 hours remaining · one attempt"
          to="/daily"
          cta="Play daily"
        />
        <LobbyCard
          icon={<Swords size={18} strokeWidth={2.5} />}
          kicker="Battle request"
          title="Thomas challenged you"
          detail="10 questions · same questions · best score wins"
          to="/battles"
          cta="Accept"
          tone="accent"
        />

        <Panel className="lg:col-span-1">
          <div className="label-xs flex items-center gap-2 text-accent">
            <Zap size={14} strokeWidth={3} /> World event
          </div>
          <div className="display mt-2 text-xl">
            {worldEvent.home.flag} France vs Spain {worldEvent.away.flag}
          </div>
          <div className="numeric mt-3 flex items-baseline justify-between text-2xl">
            <span className="text-primary">{worldEvent.homeShare}%</span>
            <span className="text-accent">{worldEvent.awayShare}%</span>
          </div>
          <div className="mt-2 flex h-2.5 overflow-hidden rounded-full bg-muted">
            <span className="bg-primary" style={{ width: `${worldEvent.homeShare}%` }} />
            <span className="flex-1 bg-accent" />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            France is behind by 0.6 points with {worldEvent.hoursLeft} hours left.
          </p>
        </Panel>

        <Panel>
          <div className="label-xs flex items-center gap-2 text-gold">
            <Trophy size={14} strokeWidth={3} /> Private league
          </div>
          <div className="display mt-2 text-xl">{privateLeague.name}</div>
          <div className="mt-3 space-y-1">
            {privateLeague.members.slice(0, 3).map((m) => (
              <div
                key={m.rank}
                className="flex items-center justify-between rounded-lg bg-surface-2/50 px-3 py-2 text-sm"
              >
                <span className={m.isYou ? "font-extrabold text-primary" : "font-semibold"}>
                  {m.rank}. {m.player.username}
                </span>
                <span className="numeric">{fmt(m.points)}</span>
              </div>
            ))}
          </div>
          <Link to="/leagues" className="mt-4 block">
            <Button variant="outline" full size="sm">
              Open league
            </Button>
          </Link>
        </Panel>
      </div>
    </div>
  );
}

function LobbyCard({
  icon,
  kicker,
  title,
  detail,
  to,
  cta,
  tone,
}: {
  icon: React.ReactNode;
  kicker: string;
  title: string;
  detail: string;
  to: "/daily" | "/battles";
  cta: string;
  tone?: "accent";
}) {
  return (
    <Panel className="flex flex-col justify-between gap-4">
      <div>
        <div className={`label-xs flex items-center gap-2 ${tone === "accent" ? "text-accent" : "text-primary"}`}>
          {icon} {kicker}
        </div>
        <div className="display mt-2 text-xl">{title}</div>
        <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
      </div>
      <Link to={to}>
        <Button variant={tone === "accent" ? "live" : "surface"} full size="md">
          {cta}
        </Button>
      </Link>
    </Panel>
  );
}
