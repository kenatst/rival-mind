import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { Page } from "@/components/AppShell";
import { Button, Panel, ProgressBar, Modal, Tabs } from "@/components/kit/primitives";
import { Avatar, DivisionBadge } from "@/components/kit/badges";
import { StatTile } from "@/components/kit/game";
import { divisionForElo, fmt } from "@/lib/game";
import { gameService } from "@/lib/gameService";
import { recordsEngine } from "@/engine/recordsEngine";
import {
  Flame,
  Share2,
  Trophy,
  Copy,
  Check,
  Zap,
  ShieldAlert,
  Target,
  TrendingUp,
  Building2,
  Sparkles,
  Keyboard,
  Compass,
} from "lucide-react";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Player Profile & Career Records — IQ ARENA" },
      {
        name: "description",
        content: "Track your competitive records, game skill indicators, division history, and career personal bests.",
      },
    ],
  }),
  component: ProfileScreen,
});

function ProfileScreen() {
  const [profile, setProfile] = React.useState(() => gameService.getUserProfile());
  const [isShareModalOpen, setIsShareModalOpen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const records = recordsEngine.getPlayerModeRecords(profile.id);
  const skills = recordsEngine.getPlayerSkillDimensions(profile.id);

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
    <Page
      title="Player Profile & Records"
      subtitle="Your competitive career, personal best records, and game skill indicators."
      wide
    >
      {/* 1. Gamer Identity Card */}
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

      {/* 2. Game Performance Skill Indicators (Game performance only, non-medical) */}
      <div className="mb-6 space-y-3">
        <div className="label-xs text-muted-foreground font-black uppercase tracking-wider flex items-center justify-between">
          <span>Game Skill Indicators (Game Telemetry)</span>
          <span className="text-xs font-mono font-normal">Derived from in-game response data</span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Panel className="p-4 text-center space-y-1 border-primary/30">
            <div className="label-xs text-primary font-bold flex items-center justify-center gap-1">
              <Zap size={13} /> Speed
            </div>
            <div className="numeric text-3xl font-black text-foreground">{skills.speed} / 100</div>
            <div className="text-xs text-muted-foreground">Rapid response efficiency</div>
          </Panel>

          <Panel className="p-4 text-center space-y-1 border-gold/30">
            <div className="label-xs text-gold font-bold flex items-center justify-center gap-1">
              <Keyboard size={13} /> Recall
            </div>
            <div className="numeric text-3xl font-black text-foreground">{skills.recall} / 100</div>
            <div className="text-xs text-muted-foreground">Free Answer accuracy</div>
          </Panel>

          <Panel className="p-4 text-center space-y-1 border-accent/30">
            <div className="label-xs text-accent font-bold flex items-center justify-center gap-1">
              <Target size={13} /> Precision
            </div>
            <div className="numeric text-3xl font-black text-foreground">{skills.precision} / 100</div>
            <div className="text-xs text-muted-foreground">Low error rate</div>
          </Panel>

          <Panel className="p-4 text-center space-y-1 border-border">
            <div className="label-xs text-muted-foreground font-bold flex items-center justify-center gap-1">
              <Compass size={13} /> Knowledge
            </div>
            <div className="numeric text-3xl font-black text-foreground">{skills.knowledge} / 100</div>
            <div className="text-xs text-muted-foreground">High-difficulty mastery</div>
          </Panel>
        </div>
      </div>

      {/* 3. Personal Best Career Mode Records */}
      <div className="mb-6 space-y-3">
        <div className="label-xs text-muted-foreground font-black uppercase tracking-wider flex items-center gap-1.5">
          <Trophy size={14} className="text-gold" /> Personal Bests & Mode Records
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Panel className="p-4 space-y-1">
            <div className="label-xs text-primary font-bold flex items-center gap-1">
              <Flame size={13} /> 60s Lightning PB
            </div>
            <div className="numeric text-2xl font-black text-foreground">{records.lightningPB} correct</div>
            <div className="text-xs text-muted-foreground font-mono">Rank #841 France</div>
          </Panel>

          <Panel className="p-4 space-y-1">
            <div className="label-xs text-accent font-bold flex items-center gap-1">
              <Zap size={13} /> 5s Blitz PB
            </div>
            <div className="numeric text-2xl font-black text-foreground">{records.blitzPB} pts</div>
            <div className="text-xs text-muted-foreground font-mono">10/10 in 41s</div>
          </Panel>

          <Panel className="p-4 space-y-1">
            <div className="label-xs text-gold font-bold flex items-center gap-1">
              <Flame size={13} /> All-Time Streak PB
            </div>
            <div className="numeric text-2xl font-black text-foreground">{records.streakPB} in a row</div>
            <div className="text-xs text-muted-foreground font-mono">Survival run</div>
          </Panel>

          <Panel className="p-4 space-y-1">
            <div className="label-xs text-muted-foreground font-bold flex items-center gap-1">
              <TrendingUp size={13} /> Ladder Best
            </div>
            <div className="numeric text-2xl font-black text-foreground">Stage {records.ladderBestLevel} / 10</div>
            <div className="text-xs text-muted-foreground font-mono">Top 8.2% World</div>
          </Panel>

          <Panel className="p-4 space-y-1">
            <div className="label-xs text-primary font-bold flex items-center gap-1">
              <Building2 size={13} /> History Tower
            </div>
            <div className="numeric text-2xl font-black text-foreground">Floor {records.historyTowerFloor}</div>
            <div className="text-xs text-muted-foreground font-mono">7 Bosses defeated</div>
          </Panel>

          <Panel className="p-4 space-y-1">
            <div className="label-xs text-accent font-bold flex items-center gap-1">
              <Building2 size={13} /> Geography Tower
            </div>
            <div className="numeric text-2xl font-black text-foreground">Floor {records.geographyTowerFloor}</div>
            <div className="text-xs text-muted-foreground font-mono">5 Bosses defeated</div>
          </Panel>

          <Panel className="p-4 space-y-1">
            <div className="label-xs text-gold font-bold flex items-center gap-1">
              <Sparkles size={13} /> Daily Gem Streak
            </div>
            <div className="numeric text-2xl font-black text-foreground">{records.dailyGemStreak} days</div>
            <div className="text-xs text-muted-foreground font-mono">Active streak</div>
          </Panel>

          <Panel className="p-4 space-y-1">
            <div className="label-xs text-muted-foreground font-bold flex items-center gap-1">
              <Trophy size={13} /> Weekend Cup
            </div>
            <div className="numeric text-lg font-black text-foreground truncate">{records.weekendCupBest}</div>
            <div className="text-xs text-muted-foreground font-mono">Trophy archived</div>
          </Panel>
        </div>
      </div>

      {/* Share Modal */}
      {isShareModalOpen && (
        <Modal
          title="Share Gamer Profile"
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
        >
          <div className="space-y-4">
            <Panel className="p-4 bg-surface-2 border-primary/40 font-mono text-sm leading-relaxed text-foreground whitespace-pre-line">
              {`👑 IQ ARENA GAMER CARD
Player: ${profile.username} (${profile.country.flag} France)
Rating: ${profile.elo} ELO (${d.label})
Rank: World #${fmt(profile.worldRank)} · France #${profile.countryRank}
Lightning PB: ${records.lightningPB} in 60s
Streak PB: ${records.streakPB}
Profile: https://iqarena.gg/u/${profile.username.toLowerCase()}`}
            </Panel>

            <Button size="lg" full variant="primary" onClick={handleCopyCard} className="font-bold">
              {copied ? <Check size={18} /> : <Copy size={18} />}
              {copied ? "Card Copied!" : "Copy Gamer Card"}
            </Button>
          </div>
        </Modal>
      )}
    </Page>
  );
}
