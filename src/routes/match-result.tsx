import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { Button, Panel, ProgressBar, Modal } from "@/components/kit/primitives";
import { Avatar, DivisionBadge } from "@/components/kit/badges";
import { EloCounter } from "@/components/kit/game";
import { fmt, playCue, useCountUp, divisionForElo } from "@/lib/game";
import { getLastMatch } from "@/lib/session";
import { profileRepo, rankedRepo } from "@/repositories";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";
import { Swords, Share2, RotateCcw, Copy, Check, Sparkles } from "lucide-react";

export const Route = createFileRoute("/match-result")({
  head: () => ({
    meta: [
      { title: "Match Result — IQ ARENA" },
      { name: "description", content: "Your ELO change, new division standing and updated world ranking." },
    ],
  }),
  component: MatchResultScreen,
});

function MatchResultScreen() {
  const navigate = useNavigate();
  const [profile, setProfile] = React.useState<any>(null);
  const matchData = getLastMatch();

  const win = matchData.won;
  const isDraw = matchData.isDraw;
  const delta = matchData.eloDelta || (win ? 18 : -14);
  const eloBefore = matchData.oldElo || 1657;
  const eloAfter = matchData.newElo || Math.max(100, eloBefore + delta);
  const playerScore = matchData.score?.you ?? matchData.playerScore ?? 5;
  const opponentScore = matchData.score?.them ?? matchData.opponentScore ?? 3;
  const opp = matchData.opponent || {
    username: "LUCAS92",
    initials: "L9",
    avatarColor: "oklch(0.66 0.26 5)",
    rating: 1691,
  };

  const [stageIndex, setStageIndex] = React.useState(0);
  const [isShareModalOpen, setIsShareModalOpen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [rematchSent, setRematchSent] = React.useState(false);

  React.useEffect(() => {
    async function load() {
      const p = await profileRepo.getProfile("u-kenael");
      setProfile(p);
    }
    load();
  }, []);

  const newDiv = divisionForElo(eloAfter);

  // Staged Reveal Flow
  React.useEffect(() => {
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

  const handleRematch = async () => {
    setRematchSent(true);
    const res = await rankedRepo.requestRematch("match-last", profile?.id || "u-kenael");
    if (res.newMatchId) {
      setTimeout(() => {
        navigate({ to: "/match", search: { matchId: res.newMatchId } as any });
      }, 1000);
    }
  };

  return (
    <div className="stage min-h-screen bg-background px-4 py-8 select-none">
      <div className="mx-auto w-full max-w-lg space-y-4">
        {/* Stage 2: Grand Victory / Defeat Headline */}
        {stageIndex >= 2 && (
          <div
            className={cn(
              "display animate-slam text-center text-6xl sm:text-8xl font-black drop-shadow-2xl",
              win ? "text-primary" : isDraw ? "text-gold" : "text-muted-foreground",
            )}
          >
            {win ? "VICTORY" : isDraw ? "DRAW" : "DEFEAT"}
          </div>
        )}

        {/* Stage 1: Faceoff Final Score */}
        {stageIndex >= 1 && (
          <Panel className="animate-rise grid grid-cols-[1fr_auto_1fr] items-center gap-3 p-4">
            <div className="flex flex-col items-center gap-2">
              <Avatar
                initials={profile?.initials || "KN"}
                color={profile?.avatarColor || "oklch(0.88 0.21 122)"}
                size={52}
                ring
              />
              <span className="display text-sm font-bold">{profile?.username || "KENAEL"}</span>
            </div>

            <div className="numeric text-center text-4xl sm:text-5xl font-black tracking-wider">
              <span className={win ? "text-primary" : "text-foreground"}>{playerScore}</span>
              <span className="text-muted-foreground"> — </span>
              <span className={!win && !isDraw ? "text-accent" : "text-foreground"}>
                {opponentScore}
              </span>
            </div>

            <div className="flex flex-col items-center gap-2">
              <Avatar initials={opp.initials || "L9"} color={opp.avatarColor || "oklch(0.66 0.26 5)"} size={52} ring />
              <span className="display text-sm font-bold">{opp.username || "LUCAS92"}</span>
            </div>
          </Panel>
        )}

        {/* Stage 3: ELO Shift Counter */}
        {stageIndex >= 3 && (
          <Panel glow className="animate-rise p-6">
            <div className="label-xs text-muted-foreground text-center font-bold">Arena Rating Shift</div>
            <EloCounter from={eloBefore} to={eloAfter} />
          </Panel>
        )}

        {/* Stage 4: Division Standing & CTAs */}
        {stageIndex >= 4 && (
          <div className="space-y-4 animate-rise">
            <Panel className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <DivisionBadge elo={eloAfter} size="md" />
                <span className="numeric text-sm text-primary font-bold">
                  {newDiv.eloRemaining} ELO to {newDiv.nextLabel}
                </span>
              </div>
              <ProgressBar value={newDiv.progress} color={`linear-gradient(90deg, ${newDiv.color}, var(--primary))`} striped />
            </Panel>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button
                size="xl"
                variant="primary"
                onClick={() => navigate({ to: "/matchmaking" })}
                className="w-full font-black text-lg shadow-[0_5px_0_0_color-mix(in_oklab,var(--primary)_55%,black)]"
              >
                <RotateCcw size={20} /> Play Again
              </Button>

              <Button
                size="xl"
                variant={rematchSent ? "surface" : "prestige"}
                onClick={handleRematch}
                disabled={rematchSent}
                className="w-full font-bold"
              >
                <Swords size={18} /> {rematchSent ? "Rematch Sent..." : "Rematch"}
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                size="md"
                variant="surface"
                onClick={() => setIsShareModalOpen(true)}
                className="w-full font-bold"
              >
                <Share2 size={16} /> Share Victory Card
              </Button>

              <Button
                size="md"
                variant="outline"
                onClick={() => navigate({ to: "/home" })}
                className="w-full text-muted-foreground font-bold"
              >
                Return to Lobby
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Share Modal */}
      {isShareModalOpen && (
        <Modal
          title="Share Match Result"
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
        >
          <div className="space-y-4">
            <Panel className="p-4 bg-surface-2 border-primary/40 font-mono text-sm leading-relaxed text-foreground whitespace-pre-line">
              {`🏆 IQ ARENA RANKED DUEL
${win ? "VICTORY" : "DEFEAT"} vs ${opp.username} (${playerScore} — ${opponentScore})
Rating: ${eloAfter} ELO (${delta >= 0 ? "+" : ""}${delta} ELO)
Play on IQ ARENA: https://iqarena.gg/play`}
            </Panel>

            <Button
              size="lg"
              full
              variant="primary"
              onClick={handleCopyShare}
              className="font-bold"
            >
              {copied ? (
                <>
                  <Check size={18} /> Copied to Clipboard!
                </>
              ) : (
                <>
                  <Copy size={18} /> Copy Shareable Text
                </>
              )}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
