import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { Button, Panel, ProgressBar, Modal } from "@/components/kit/primitives";
import { Avatar, DivisionBadge } from "@/components/kit/badges";
import { EloCounter } from "@/components/kit/game";
import { rivalOpponent } from "@/data/mock";
import { fmt, playCue, useCountUp, divisionForElo } from "@/lib/game";
import { getLastMatch } from "@/lib/session";
import { gameService } from "@/lib/gameService";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";
import { Swords, Share2, RotateCcw, Copy, Check, Sparkles } from "lucide-react";

export const Route = createFileRoute("/match-result")({
  head: () => ({
    meta: [
      { title: "Match Result — IQ ARENA" },
      { name: "description", content: "Your ELO change, new division standing and updated world ranking." },
      { property: "og:title", content: "Match Result — IQ ARENA" },
      { property: "og:description", content: "ELO change and world ranking update." },
    ],
  }),
  component: MatchResultScreen,
});

function MatchResultScreen() {
  const navigate = useNavigate();
  const [profile] = React.useState(() => gameService.getUserProfile());
  const { playerScore, opponentScore } = getLastMatch();
  const win = playerScore >= opponentScore;
  const delta = win ? 18 : -14;
  const eloBefore = profile.elo;
  const eloAfter = Math.max(100, eloBefore + delta);
  const rankBefore = profile.worldRank;
  const rankAfter = win ? Math.max(1, rankBefore - 547) : rankBefore + 420;
  const rank = useCountUp(rankAfter, 1600, rankBefore);
  const [stageIndex, setStageIndex] = React.useState(0);
  const [isShareModalOpen, setIsShareModalOpen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const newDiv = divisionForElo(eloAfter);

  // Staged Reveal Flow
  React.useEffect(() => {
    // Record to storage
    gameService.recordMatchResult(win, delta, win ? 380 : 120);

    const t1 = setTimeout(() => setStageIndex(1), 300); // Scores
    const t2 = setTimeout(() => {
      setStageIndex(2); // Victory / Defeat headline
      playCue(win ? "victory" : "defeat");
      if (win) {
        try {
          confetti({
            particleCount: 90,
            spread: 70,
            origin: { y: 0.55 },
            colors: ["#76FF03", "#FFD600", "#00E5FF"],
          });
        } catch {}
      }
    }, 900);

    const t3 = setTimeout(() => setStageIndex(3), 1600); // ELO Counter Roll
    const t4 = setTimeout(() => setStageIndex(4), 2600); // Division progress & CTAs

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [win, delta]);

  const handleCopyShare = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="stage min-h-screen bg-background px-4 py-8 select-none">
      <div className="mx-auto w-full max-w-lg space-y-4">
        {/* Stage 2: Grand Victory Headline */}
        {stageIndex >= 2 && (
          <div
            className={cn(
              "display animate-slam text-center text-6xl sm:text-8xl font-black drop-shadow-2xl",
              win ? "text-primary" : "text-muted-foreground",
            )}
          >
            {win ? "VICTORY" : "DEFEAT"}
          </div>
        )}

        {/* Stage 1: Faceoff Final Score */}
        {stageIndex >= 1 && (
          <Panel className="animate-rise grid grid-cols-[1fr_auto_1fr] items-center gap-3 p-4">
            <div className="flex flex-col items-center gap-2">
              <Avatar initials={profile.initials} color={profile.avatarColor} size={52} ring />
              <span className="display text-sm font-bold">{profile.username}</span>
              <span className="numeric text-5xl font-black text-primary">{playerScore}</span>
            </div>
            <span className="display text-muted-foreground text-xl">vs</span>
            <div className="flex flex-col items-center gap-2">
              <Avatar initials={rivalOpponent.initials} color={rivalOpponent.avatarColor} size={52} />
              <span className="display text-sm font-bold text-muted-foreground">{rivalOpponent.username}</span>
              <span className="numeric text-5xl font-black text-muted-foreground">{opponentScore}</span>
            </div>
          </Panel>
        )}

        {/* Stage 3: Animated ELO Counter Roll */}
        {stageIndex >= 3 && (
          <Panel glow={win} className="animate-rise py-6 text-center space-y-3 shadow-[var(--shadow-glow)]">
            <div className="label-xs text-muted-foreground font-black tracking-wider">
              UPDATED COMPETITIVE RATING
            </div>
            <EloCounter from={eloBefore} to={eloAfter} />
            <div className="mt-4 flex justify-center">
              <DivisionBadge elo={eloAfter} size="lg" />
            </div>
          </Panel>
        )}

        {/* World Rank Leap */}
        {stageIndex >= 3 && (
          <Panel className="animate-rise flex items-center justify-between p-4">
            <div>
              <div className="label-xs text-muted-foreground font-bold">World Ranking</div>
              <div className="numeric mt-1 text-3xl font-black">#{fmt(rank)}</div>
            </div>
            <div
              className={cn(
                "numeric text-xl font-bold",
                rankAfter < rankBefore ? "text-success" : "text-muted-foreground",
              )}
            >
              {rankAfter < rankBefore ? "▲" : "▼"} {fmt(Math.abs(rankBefore - rankAfter))}
            </div>
          </Panel>
        )}

        {/* Stage 4: Division Milestone Progress & CTAs */}
        {stageIndex >= 4 && (
          <div className="animate-rise space-y-4 pt-1">
            <Panel className="p-4 space-y-2">
              <div className="label-xs flex justify-between text-muted-foreground font-bold">
                <span>Next Milestone: {newDiv.nextLabel}</span>
                <span className="text-gold">{newDiv.eloRemaining} ELO needed</span>
              </div>
              <ProgressBar value={newDiv.progress} color={`linear-gradient(90deg, ${newDiv.color}, var(--primary))`} striped />
            </Panel>

            <div className="space-y-3 pt-2">
              <Link to="/matchmaking" className="block">
                <Button full size="xl" className="shadow-[0_6px_0_0_color-mix(in_oklab,var(--primary)_55%,black)] text-xl font-black">
                  <Swords size={22} /> PLAY AGAIN
                </Button>
              </Link>
              <div className="grid grid-cols-2 gap-3">
                <Link to="/matchmaking">
                  <Button variant="surface" full>
                    Rematch
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  full
                  onClick={() => setIsShareModalOpen(true)}
                >
                  <Share2 size={16} /> Share Result
                </Button>
              </div>
              <Button variant="ghost" full onClick={() => navigate({ to: "/home" })}>
                Back to Lobby
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Share Result Modal */}
      <Modal open={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} title="Share Match Card">
        <div className="space-y-4 text-center">
          <div className="rounded-2xl border border-primary/40 bg-surface-2 p-5 text-left space-y-2">
            <div className="label-xs text-primary font-black">⚡ IQ ARENA MATCH RESULT</div>
            <div className="display text-xl font-black">{profile.username} (🇫🇷 {eloAfter} ELO)</div>
            <div className="text-sm font-bold text-success">
              Defeated {rivalOpponent.username} {playerScore} - {opponentScore}
            </div>
            <div className="label-xs text-muted-foreground font-mono">
              Division: {newDiv.label} · World #{fmt(rankAfter)}
            </div>
          </div>

          <Button full onClick={handleCopyShare} variant="primary">
            {copied ? (
              <>
                <Check size={18} /> Copied to Clipboard!
              </>
            ) : (
              <>
                <Copy size={18} /> Copy Share Card
              </>
            )}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
