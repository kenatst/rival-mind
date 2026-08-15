import { createFileRoute, Link } from "@tanstack/react-router";
import * as React from "react";
import { Page } from "@/components/AppShell";
import { Button, Panel, Modal } from "@/components/kit/primitives";
import { Avatar } from "@/components/kit/badges";
import { privateLeague } from "@/data/mock";
import { fmt } from "@/lib/game";
import { Copy, Check, UserPlus, Swords, Trophy, BarChart3 } from "lucide-react";

export const Route = createFileRoute("/leagues")({
  head: () => ({
    meta: [
      { title: "Private leagues — QuizArena" },
      {
        name: "description",
        content: "Create or join private fantasy trivia leagues with friends, colleagues or classmates.",
      },
      { property: "og:title", content: "Private leagues — QuizArena" },
      { property: "og:description", content: "Compete in custom private leagues." },
    ],
  }),
  component: LeaguesScreen,
});

function LeaguesScreen() {
  const [isInviteOpen, setIsInviteOpen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [isStatsOpen, setIsStatsOpen] = React.useState(false);

  const league = privateLeague;

  const handleCopyCode = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Page
      title="Private Leagues"
      subtitle="Compete with your circle in weekly rounds, custom standings and private battle duels."
      wide
      action={
        <Button size="sm" onClick={() => setIsInviteOpen(true)}>
          <UserPlus size={16} /> Invite Friends
        </Button>
      }
    >
      {/* Active League Banner */}
      <Panel glow className="mb-6 p-6">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <div>
            <div className="label-xs flex items-center gap-1.5 text-gold font-bold">
              <Trophy size={14} /> Season {league.season} · {league.memberCount} Members
            </div>
            <h2 className="display mt-1 text-2xl sm:text-3xl">{league.name}</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Official weekly private tournament. Top 3 win exclusive crown trophies at season close.
            </p>
          </div>
          <div className="text-right">
            <div className="label-xs text-muted-foreground">Your Rank</div>
            <div className="numeric text-4xl text-primary font-black sm:text-5xl">#2</div>
            <div className="label-xs mt-1 text-muted-foreground font-mono">4,603 pts</div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2 pt-3 border-t border-border">
          <Button size="sm" variant="surface" onClick={() => setIsInviteOpen(true)}>
            <UserPlus size={14} /> Invite Link
          </Button>
          <Link to="/battles">
            <Button size="sm" variant="live">
              <Swords size={14} /> Create League Duel
            </Button>
          </Link>
          <Button size="sm" variant="outline" onClick={() => setIsStatsOpen(true)}>
            <BarChart3 size={14} /> Season Stats
          </Button>
        </div>
      </Panel>

      {/* MPP Style Table */}
      <div className="rounded-2xl border border-border bg-surface overflow-x-auto shadow-[var(--shadow-lift)]">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="border-b border-border bg-surface-2/60 text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
              <th className="py-3 px-4">Rank</th>
              <th className="py-3 px-4">Player</th>
              <th className="py-3 px-4 text-center">Weekly</th>
              <th className="py-3 px-4 text-center">Duels Won</th>
              <th className="py-3 px-4 text-center">Accuracy</th>
              <th className="py-3 px-4 text-center">ELO</th>
              <th className="py-3 px-4 text-right">League Points</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 text-sm">
            {league.members.map((m) => (
              <tr
                key={m.rank}
                className={`transition-colors ${
                  m.isYou ? "bg-primary/10 font-bold border-l-4 border-l-primary" : "hover:bg-surface-2/40"
                }`}
              >
                <td className="py-3.5 px-4 font-mono font-black text-base">
                  <span className={m.rank <= 3 ? "text-gold" : "text-muted-foreground"}>
                    #{m.rank}
                  </span>
                </td>
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-3">
                    <Avatar initials={m.player.initials} color={m.player.avatarColor} size={36} />
                    <div>
                      <div className="display text-sm font-bold flex items-center gap-1.5">
                        {m.player.username}
                        {m.isYou && (
                          <span className="label-xs rounded bg-primary px-1 text-primary-foreground font-black text-[9px]">
                            YOU
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">{m.player.country.flag} France</span>
                    </div>
                  </div>
                </td>
                <td className="py-3.5 px-4 text-center font-mono text-xs">
                  <span className="rounded bg-surface-2 px-2 py-0.5 border border-border">
                    #{m.weeklyRank}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-center font-mono text-success font-bold">
                  {m.battlesWon} W
                </td>
                <td className="py-3.5 px-4 text-center font-mono text-foreground font-bold">
                  {m.accuracy}%
                </td>
                <td className="py-3.5 px-4 text-center font-mono text-gold font-bold">
                  {fmt(m.elo)}
                </td>
                <td className="py-3.5 px-4 text-right font-mono font-black text-base text-foreground">
                  {fmt(m.points)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Invite Modal */}
      <Modal open={isInviteOpen} onClose={() => setIsInviteOpen(false)} title="Invite to Les Génies">
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Share this direct invite link or code to let friends join your private league:
          </p>

          <div className="rounded-xl border border-primary/40 bg-surface-2 p-3.5 flex items-center justify-between">
            <span className="font-mono font-bold text-primary text-sm">{league.inviteCode}</span>
            <button
              onClick={handleCopyCode}
              className="p-2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>
        </div>
      </Modal>

      {/* Stats Modal */}
      <Modal open={isStatsOpen} onClose={() => setIsStatsOpen(false)} title="Les Génies · Season 4 Stats">
        <div className="space-y-3 text-xs">
          <div className="rounded-xl border border-border bg-surface-2 p-3 flex justify-between">
            <span className="text-muted-foreground">Total League Duels Played</span>
            <span className="font-mono font-bold">184 Matches</span>
          </div>
          <div className="rounded-xl border border-border bg-surface-2 p-3 flex justify-between">
            <span className="text-muted-foreground">League Average Accuracy</span>
            <span className="font-mono font-bold text-primary">71.4%</span>
          </div>
          <div className="rounded-xl border border-border bg-surface-2 p-3 flex justify-between">
            <span className="text-muted-foreground">Season 4 Trophy Pool</span>
            <span className="font-mono font-bold text-gold">Gold Crown Badge</span>
          </div>
        </div>
      </Modal>
    </Page>
  );
}
