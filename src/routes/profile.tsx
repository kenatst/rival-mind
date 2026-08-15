import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { Page } from "@/components/AppShell";
import { Button, Panel, ProgressBar, Modal } from "@/components/kit/primitives";
import { Avatar, DivisionBadge } from "@/components/kit/badges";
import { StatTile } from "@/components/kit/game";
import { divisionForElo, fmt } from "@/lib/game";
import { gameService } from "@/lib/gameService";
import { Flame, Share2, Trophy, Copy, Check, Zap, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Player Profile — IQ ARENA" },
      { name: "description", content: "Your competitive record, division history, accuracy and unlocked achievements." },
      { property: "og:title", content: "Player Profile — IQ ARENA" },
      { property: "og:description", content: "Track your competitive knowledge career." },
    ],
  }),
  component: ProfileScreen,
});

function ProfileScreen() {
  const [profile, setProfile] = React.useState(() => gameService.getUserProfile());
  const [isShareModalOpen, setIsShareModalOpen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    return gameService.subscribe(() => {
      setProfile(gameService.getUserProfile());
    });
  }, []);

  const d = divisionForElo(profile.elo);

  const handleCopyCard = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Page title="Player Profile" subtitle="Your competitive stats, division milestones and unlocked achievements." wide>
      {/* Gamer Identity Card */}
      <Panel glow className="mb-6 p-6 sm:p-8 shadow-[var(--shadow-glow)]">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-6">
          <div className="flex min-w-0 items-center gap-5">
            <Avatar initials={profile.initials} color={profile.avatarColor} size={72} ring />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="display truncate text-3xl sm:text-4xl font-black">{profile.username}</h1>
                <span className="text-2xl leading-none">{profile.country.flag}</span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <DivisionBadge elo={profile.elo} size="md" />
                <span className="label-xs text-muted-foreground flex items-center gap-1">
                  Level {profile.level} ({fmt(profile.xp)} XP) · <Flame size={13} className="text-gold fill-gold" /> {profile.streak}d streak
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="numeric text-5xl text-gold sm:text-6xl font-black">{fmt(profile.elo)}</div>
            <div className="label-xs mt-1 text-muted-foreground font-mono">
              World #{fmt(profile.worldRank)} · France #{profile.countryRank}
            </div>
          </div>
        </div>

        <div className="mt-6 border-t border-border pt-4">
          <div className="label-xs mb-2 flex justify-between text-muted-foreground font-bold">
            <span>Current Division: {d.label}</span>
            <span className="text-primary">{d.eloRemaining} ELO to {d.nextLabel}</span>
          </div>
          <ProgressBar value={d.progress} color={`linear-gradient(90deg, ${d.color}, var(--primary))`} striped />
        </div>

        <div className="mt-5 flex justify-end">
          <Button variant="outline" size="sm" onClick={() => setIsShareModalOpen(true)}>
            <Share2 size={15} /> Share Gamer Card
          </Button>
        </div>
      </Panel>

      {/* 4 Key Career Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-6">
        <StatTile label="Accuracy" value={`${profile.accuracy}%`} accent="primary" />
        <StatTile label="Battles Played" value={fmt(profile.battles)} />
        <StatTile label="Wins" value={fmt(profile.wins)} accent="gold" />
        <StatTile label="Win Rate" value={`${Math.round((profile.wins / profile.battles) * 100)}%`} accent="accent" />
      </div>

      {/* Strong vs Weak Categories */}
      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <Panel className="p-5 space-y-3 border-success/30">
          <div className="label-xs flex items-center gap-2 text-success font-black">
            <Zap size={15} /> Strong Categories (Powerhouses)
          </div>
          <div className="space-y-2.5">
            {profile.strongCategories.map((c) => (
              <div key={c.category}>
                <div className="label-xs mb-1 flex justify-between text-muted-foreground font-bold">
                  <span className="text-foreground">{c.category}</span>
                  <span className="text-success">{c.score}% Score {c.mmr && `· MMR ${c.mmr}`}</span>
                </div>
                <ProgressBar value={c.score / 100} color="var(--success)" height={6} />
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="p-5 space-y-3 border-danger/30">
          <div className="label-xs flex items-center gap-2 text-danger font-black">
            <ShieldAlert size={15} /> Growth Opportunities
          </div>
          <div className="space-y-2.5">
            {profile.weakCategories.map((c) => (
              <div key={c.category}>
                <div className="label-xs mb-1 flex justify-between text-muted-foreground font-bold">
                  <span className="text-foreground">{c.category}</span>
                  <span className="text-danger">{c.score}% Score {c.mmr && `· MMR ${c.mmr}`}</span>
                </div>
                <ProgressBar value={c.score / 100} color="var(--danger)" height={6} />
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* Achievements Showcase */}
      <Panel className="p-5">
        <div className="label-xs flex items-center justify-between text-gold font-black mb-4">
          <span className="flex items-center gap-2">
            <Trophy size={16} /> Showcase Achievements
          </span>
          <span className="text-muted-foreground font-mono">4 / 6 Unlocked</span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {profile.achievements.map((ach) => (
            <div
              key={ach.id}
              className={`flex items-start gap-3 rounded-xl border p-3.5 transition-colors ${
                ach.unlocked
                  ? "border-border bg-surface-2/60"
                  : "border-border/40 bg-surface/30 opacity-50"
              }`}
            >
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surface border border-border text-xl">
                {ach.icon}
              </div>
              <div className="min-w-0">
                <div className="display text-base font-bold">{ach.label}</div>
                <p className="text-xs text-muted-foreground mt-0.5">{ach.description}</p>
                {ach.unlocked && (
                  <span className="label-xs text-primary font-bold mt-1 inline-block">
                    ✓ Unlocked
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {/* Share Modal */}
      <Modal open={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} title="Share Gamer Card">
        <div className="space-y-4 text-center">
          <div className="rounded-2xl border border-primary/40 bg-surface-2 p-6 text-center space-y-3">
            <Avatar initials={profile.initials} color={profile.avatarColor} size={64} ring />
            <div className="display text-2xl font-black">{profile.username} {profile.country.flag}</div>
            <div className="numeric text-4xl text-gold font-black">{profile.elo} ELO</div>
            <div className="label-xs text-muted-foreground font-mono">
              Division: {d.label} · {profile.accuracy}% Accuracy · 🔥 {profile.streak}d Streak
            </div>
          </div>

          <Button full onClick={handleCopyCard} variant="primary">
            {copied ? (
              <>
                <Check size={18} /> Copied to Clipboard!
              </>
            ) : (
              <>
                <Copy size={18} /> Copy Gamer Link
              </>
            )}
          </Button>
        </div>
      </Modal>
    </Page>
  );
}
