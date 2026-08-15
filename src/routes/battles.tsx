import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { Page } from "@/components/AppShell";
import { Button, Modal, Panel } from "@/components/kit/primitives";
import { Avatar } from "@/components/kit/badges";
import { friends, rivalOpponent } from "@/data/mock";
import { fmt, divisionForElo } from "@/lib/game";
import { gameService } from "@/lib/gameService";
import { socialEngine } from "@/engine/socialEngine";
import { Swords, Share2, Copy, Check, Zap, Keyboard, Target, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/battles")({
  head: () => ({
    meta: [
      { title: "Friend Battles & Rivalries — IQ ARENA" },
      {
        name: "description",
        content: "Format selection, friend duels, and head-to-head rivalry records.",
      },
    ],
  }),
  component: BattlesScreen,
});

type BattleFormat = "classic" | "blitz" | "free_answer" | "perfect10";

function BattlesScreen() {
  const navigate = useNavigate();
  const [profile] = React.useState(() => gameService.getUserProfile());
  const [selectedFormat, setSelectedFormat] = React.useState<BattleFormat>("classic");
  const [challengeLink, setChallengeLink] = React.useState("iqarena.gg/battle/KENAEL-9X42");
  const [share, setShare] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const rivalries = socialEngine.getRivalries();
  const pendingChallenge = gameService.getPendingBattle();

  const handleCreateChallenge = () => {
    const link = `https://iqarena.gg/battle/${profile.username.toLowerCase()}-${selectedFormat}-${Date.now().toString(36)}`;
    setChallengeLink(link);
    setShare(true);
  };

  const handleCopyLink = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatOptions = [
    {
      id: "classic",
      name: "Classic 1v1",
      icon: <Swords size={16} />,
      desc: "10s per question · 10 questions",
    },
    {
      id: "blitz",
      name: "5s Blitz",
      icon: <Zap size={16} />,
      desc: "5s rapid countdown · 10 questions",
    },
    {
      id: "free_answer",
      name: "Free Answer",
      icon: <Keyboard size={16} />,
      desc: "Type answers · Zero multiple choice",
    },
    {
      id: "perfect10",
      name: "Perfect 10",
      icon: <Target size={16} />,
      desc: "Perfection sprint · 10/10 target",
    },
  ];

  return (
    <Page
      title="Friend Battles & Rivalries"
      subtitle="Format selection duels and persistent head-to-head match series."
      wide
    >
      {/* 1. Rivalries Head-to-Head Section */}
      <div className="mb-6 space-y-3">
        <div className="label-xs text-muted-foreground font-black uppercase tracking-wider flex items-center gap-1.5">
          <Swords size={14} className="text-accent" /> Active Rivalry Series
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {rivalries.map((r) => (
            <Panel key={r.id} className="p-5 border-accent/40 bg-accent/5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="label-xs text-accent font-black">Head-to-Head Series</span>
                <span className="label-xs text-muted-foreground font-mono">Last played {r.lastMatchDate}</span>
              </div>

              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center">
                <div>
                  <Avatar initials={profile.initials} color={profile.avatarColor} size={48} ring className="mx-auto" />
                  <div className="font-bold text-sm text-foreground mt-1">{profile.username}</div>
                  <div className="numeric text-3xl font-black text-primary mt-1">{r.userWins}</div>
                </div>

                <div className="text-muted-foreground font-black text-xl">—</div>

                <div>
                  <Avatar initials={r.opponentInitials} color={r.opponentColor} size={48} ring className="mx-auto" />
                  <div className="font-bold text-sm text-foreground mt-1">{r.opponentUsername}</div>
                  <div className="numeric text-3xl font-black text-accent mt-1">{r.opponentWins}</div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center leading-relaxed">
                {r.narrativeContext}
              </p>

              <Link
                to="/quiz"
                search={{ mode: "battle", opponent: r.opponentUsername.toLowerCase() } as any}
                className="block"
              >
                <Button size="md" full variant="live" className="font-black">
                  <Swords size={16} /> Challenge {r.opponentUsername}
                </Button>
              </Link>
            </Panel>
          ))}
        </div>
      </div>

      {/* 2. Custom Format Challenge Generator */}
      <Panel className="p-6 space-y-5 border-primary/30">
        <div>
          <div className="label-xs text-primary font-black flex items-center gap-1.5">
            <Sparkles size={14} /> Create Custom Challenge Link
          </div>
          <h3 className="display text-2xl font-black mt-1">Select Battle Format</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Choose the rules for your duel, then share the invitation link on WhatsApp, Discord, or Telegram.
          </p>
        </div>

        {/* Format Selector Grid */}
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {formatOptions.map((f) => (
            <button
              key={f.id}
              onClick={() => setSelectedFormat(f.id as BattleFormat)}
              className={cn(
                "p-3.5 rounded-2xl border-2 text-left transition-all active:scale-95 flex flex-col justify-between",
                selectedFormat === f.id
                  ? "border-primary bg-primary/10 shadow-[var(--shadow-glow)]"
                  : "border-border bg-surface hover:border-border-strong",
              )}
            >
              <div className="flex items-center gap-2 text-primary font-bold">
                {f.icon}
                <span className="text-foreground">{f.name}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-2 font-mono">{f.desc}</div>
            </button>
          ))}
        </div>

        <Button size="lg" variant="primary" onClick={handleCreateChallenge} className="font-black">
          <Share2 size={18} /> Generate {selectedFormat.toUpperCase()} Challenge Link
        </Button>
      </Panel>

      {/* Share Modal */}
      {share && (
        <Modal title="Share Challenge Link" isOpen={share} onClose={() => setShare(false)}>
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Anyone with this link will face identical questions under the selected format:
            </p>
            <div className="p-3 bg-surface-2 rounded-xl font-mono text-xs text-foreground truncate border border-border">
              {challengeLink}
            </div>
            <Button size="lg" full variant="primary" onClick={handleCopyLink} className="font-bold">
              {copied ? <Check size={18} /> : <Copy size={18} />}
              {copied ? "Link Copied!" : "Copy Invitation Link"}
            </Button>
          </div>
        </Modal>
      )}
    </Page>
  );
}
