import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { Button, Panel, Modal } from "@/components/kit/primitives";
import { Avatar, DivisionBadge } from "@/components/kit/badges";
import { profileRepo, matchReviewRepo, MatchReviewDTO, MatchRoundReviewItem, RoundClassification } from "@/repositories";
import { fmt, playCue, useCountUp } from "@/lib/game";
import {
  Swords,
  Share2,
  RotateCcw,
  Zap,
  Target,
  Sparkles,
  Flame,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  BookOpen,
  Copy,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface MatchReviewSearch {
  matchId?: string | undefined;
}

export const Route = createFileRoute("/match-review")({
  validateSearch: (search: Record<string, unknown>): MatchReviewSearch => {
    return {
      matchId: search["matchId"] ? String(search["matchId"]) : undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "Match Review — IQ ARENA" },
      { name: "description", content: "Post-match performance analysis, telemetry breakdown, and mastery training." },
    ],
  }),
  component: MatchReviewScreen,
});

type FilterTab = "ALL" | "CORRECT" | "MISTAKES" | "ELITE" | "SLOW";

function MatchReviewScreen() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const matchId = search.matchId || "match-last";

  const [profile, setProfile] = React.useState<any>(null);
  const [review, setReview] = React.useState<MatchReviewDTO | null>(null);
  const [activeFilter, setActiveFilter] = React.useState<FilterTab>("ALL");
  const [isShareModalOpen, setIsShareModalOpen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    async function load() {
      const p = await profileRepo.getProfile();
      setProfile(p);

      try {
        const rev = await matchReviewRepo.getMatchReview(matchId, p.id);
        setReview(rev);
        playCue("select");
      } catch (err) {
        console.error("Failed to load match review:", err);
      }
    }
    load();
  }, [matchId]);

  const animatedPerf = useCountUp(review?.performanceRating || 1800, 1400, review?.arenaRatingBefore || 1650);

  if (!review || !profile) {
    return (
      <div className="stage min-h-screen grid place-items-center bg-background text-foreground">
        <div className="text-center space-y-3">
          <div className="animate-spin text-primary text-3xl">⚙️</div>
          <div className="display text-xl font-black">ANALYZING MATCH TELEMETRY...</div>
          <div className="text-xs text-muted-foreground font-mono">
            Evaluating speed percentiles & division expected accuracies...
          </div>
        </div>
      </div>
    );
  }

  // Filter rounds
  const filteredRounds = review.rounds.filter((r) => {
    if (activeFilter === "CORRECT") return r.wasCorrect;
    if (activeFilter === "MISTAKES") return !r.wasCorrect;
    if (activeFilter === "ELITE") return r.classification === "ELITE";
    if (activeFilter === "SLOW") return r.classification === "HESITATION";
    return true;
  });

  const isPerfAbove = review.performanceDelta >= 0;

  const handleCopyShare = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="stage min-h-screen bg-background px-4 py-8 select-none">
      <div className="mx-auto w-full max-w-2xl space-y-6">
        {/* 1. Header Banner & Performance Rating Card */}
        <Panel glow className="p-6 border-primary/40 bg-surface space-y-5 animate-rise shadow-[var(--shadow-lift)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
            <div>
              <div className="label-xs text-muted-foreground font-black uppercase tracking-wider flex items-center gap-1.5">
                <Target size={14} className="text-primary" /> IQ ARENA Match Review · V1.0
              </div>
              <h1 className="display text-2xl sm:text-3xl font-black mt-1">
                {review.playerUsername} <span className="text-muted-foreground font-normal">vs</span> {review.opponentUsername}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "display px-3 py-1.5 rounded-xl text-sm font-black tracking-wider uppercase",
                  review.isVictory ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                )}
              >
                {review.isVictory ? "VICTORY" : review.isDraw ? "DRAW" : "DEFEAT"} ({review.finalScorePlayer} — {review.finalScoreOpponent})
              </span>
            </div>
          </div>

          {/* Performance Rating Big Reveal */}
          <div className="grid sm:grid-cols-2 gap-4 items-center">
            <div className="space-y-1">
              <div className="label-xs text-muted-foreground font-bold">PERFORMANCE RATING</div>
              <div className="numeric text-5xl sm:text-6xl font-black text-gold drop-shadow-md">
                {animatedPerf}
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold mt-1">
                {isPerfAbove ? (
                  <span className="text-primary flex items-center gap-1">
                    <TrendingUp size={14} /> +{review.performanceDelta} ABOVE YOUR RATING
                  </span>
                ) : (
                  <span className="text-accent flex items-center gap-1">
                    <TrendingDown size={14} /> {review.performanceDelta} BELOW YOUR RATING
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center bg-surface-2 p-3.5 rounded-2xl border border-border">
              <div>
                <div className="label-xs text-muted-foreground font-bold">Arena Rating</div>
                <div className="numeric text-lg font-black text-foreground">{fmt(review.arenaRatingAfter)}</div>
                <div className="text-xs text-primary font-bold">
                  {review.arenaRatingDelta >= 0 ? `+${review.arenaRatingDelta}` : review.arenaRatingDelta} ELO
                </div>
              </div>
              <div>
                <div className="label-xs text-muted-foreground font-bold">Accuracy</div>
                <div className="numeric text-lg font-black text-foreground">{review.accuracyPercent}%</div>
                <div className="text-xs text-muted-foreground font-mono">{review.actualScore}/8 Qs</div>
              </div>
              <div>
                <div className="label-xs text-muted-foreground font-bold">Avg Answer</div>
                <div className="numeric text-lg font-black text-foreground">
                  {(review.avgResponseMs / 1000).toFixed(2)}s
                </div>
                <div className="text-xs text-muted-foreground font-mono">Opp: {(review.opponentAvgResponseMs / 1000).toFixed(2)}s</div>
              </div>
              <div>
                <div className="label-xs text-muted-foreground font-bold">Expected</div>
                <div className="numeric text-lg font-black text-foreground">{review.expectedScore} / 8</div>
                <div className="text-xs text-gold font-bold">Peer Model</div>
              </div>
            </div>
          </div>

          {/* Classification Sequence Chips */}
          <div className="border-t border-border pt-4">
            <div className="label-xs text-muted-foreground font-bold mb-2.5">ROUND CLASSIFICATIONS</div>
            <div className="flex flex-wrap gap-2">
              {review.summary.instant > 0 && (
                <ClassificationBadge label={`INSTANT ×${review.summary.instant}`} variant="INSTANT" />
              )}
              {review.summary.elite > 0 && (
                <ClassificationBadge label={`ELITE ×${review.summary.elite}`} variant="ELITE" />
              )}
              {review.summary.good > 0 && (
                <ClassificationBadge label={`GOOD ×${review.summary.good}`} variant="GOOD" />
              )}
              {review.summary.hesitation > 0 && (
                <ClassificationBadge label={`HESITATION ×${review.summary.hesitation}`} variant="HESITATION" />
              )}
              {review.summary.miss > 0 && (
                <ClassificationBadge label={`MISS ×${review.summary.miss}`} variant="MISS" />
              )}
              {review.summary.blunder > 0 && (
                <ClassificationBadge label={`BLUNDER ×${review.summary.blunder}`} variant="BLUNDER" />
              )}
            </div>
          </div>
        </Panel>

        {/* 2. Filter Bar */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
          <div className="flex items-center gap-1.5 bg-surface p-1 rounded-2xl border border-border">
            <FilterButton label="ALL (8)" active={activeFilter === "ALL"} onClick={() => setActiveFilter("ALL")} />
            <FilterButton label="MISTAKES" active={activeFilter === "MISTAKES"} onClick={() => setActiveFilter("MISTAKES")} alert />
            <FilterButton label="ELITE" active={activeFilter === "ELITE"} onClick={() => setActiveFilter("ELITE")} />
            <FilterButton label="CORRECT" active={activeFilter === "CORRECT"} onClick={() => setActiveFilter("CORRECT")} />
            <FilterButton label="SLOW" active={activeFilter === "SLOW"} onClick={() => setActiveFilter("SLOW")} />
          </div>

          <Button size="sm" variant="surface" onClick={() => setIsShareModalOpen(true)} className="font-bold shrink-0">
            <Share2 size={14} /> Partager
          </Button>
        </div>

        {/* 3. Question-by-Question Detailed Review List */}
        <div className="space-y-3.5">
          {filteredRounds.map((round) => (
            <RoundReviewCard key={round.roundNumber} item={round} />
          ))}

          {filteredRounds.length === 0 && (
            <Panel className="p-8 text-center text-muted-foreground text-sm">
              Aucune question ne correspond à ce filtre.
            </Panel>
          )}
        </div>

        {/* 4. Bottom Sticky Action Hub */}
        <div className="pt-4 space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <Button
              size="xl"
              variant="primary"
              onClick={() => navigate({ to: "/matchmaking" })}
              className="w-full font-black text-lg shadow-[0_5px_0_0_color-mix(in_oklab,var(--primary)_55%,black)]"
            >
              <RotateCcw size={20} /> JOUER EN RANKED
            </Button>

            <Link to="/play">
              <Button size="xl" variant="prestige" className="w-full font-bold">
                <BookOpen size={18} /> ENTRAÎNER MES ERREURS
              </Button>
            </Link>
          </div>

          <div className="text-center">
            <Link to="/home" className="text-xs text-muted-foreground hover:text-foreground underline">
              ← Retour au Lobby
            </Link>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {isShareModalOpen && (
        <Modal title="Partager votre Performance" isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)}>
          <div className="space-y-4">
            <Panel className="p-5 bg-surface-2 border-primary/40 font-mono text-sm leading-relaxed text-foreground whitespace-pre-line">
              {`🏆 IQ ARENA MATCH REVIEW
Joueur: ${review.playerUsername} (${review.arenaRatingAfter} ELO)
Performance Rating: ${review.performanceRating} (${isPerfAbove ? "+" : ""}${review.performanceDelta})
Résultat: ${review.isVictory ? "VICTOIRE" : "DÉFAITE"} vs ${review.opponentUsername} (${review.finalScorePlayer} — ${review.finalScoreOpponent})
Précision: ${review.accuracyPercent}% · Vitesse moy.: ${(review.avgResponseMs / 1000).toFixed(2)}s
Moments clés: ${review.summary.elite} ELITE · ${review.summary.instant} INSTANT · ${review.summary.blunder} BLUNDER
Relevez le défi sur IQ ARENA: https://iqarena.gg`}
            </Panel>

            <Button size="lg" full variant="primary" onClick={handleCopyShare} className="font-bold">
              {copied ? (
                <>
                  <Check size={18} /> Copié dans le presse-papier !
                </>
              ) : (
                <>
                  <Copy size={18} /> Copier le résumé de performance
                </>
              )}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function FilterButton({
  label,
  active,
  onClick,
  alert,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  alert?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : alert
          ? "text-accent hover:bg-surface-2"
          : "text-muted-foreground hover:text-foreground hover:bg-surface-2",
      )}
    >
      {label}
    </button>
  );
}

function ClassificationBadge({ label, variant }: { label: string; variant: RoundClassification }) {
  const styles = {
    INSTANT: "bg-[oklch(0.85_0.18_200)]/15 text-[oklch(0.85_0.18_200)] border-[oklch(0.85_0.18_200)]/40",
    ELITE: "bg-gold/15 text-gold border-gold/40",
    GOOD: "bg-primary/15 text-primary border-primary/40",
    HESITATION: "bg-amber-500/15 text-amber-500 border-amber-500/40",
    MISS: "bg-muted text-muted-foreground border-border",
    BLUNDER: "bg-accent/15 text-accent border-accent/40",
  };

  return (
    <span className={cn("label-xs rounded-lg border px-2.5 py-1 font-black uppercase tracking-wider", styles[variant])}>
      {label}
    </span>
  );
}

function RoundReviewCard({ item }: { item: MatchRoundReviewItem }) {
  return (
    <Panel className="p-4 sm:p-5 border-border bg-surface hover:border-primary/30 transition-all space-y-3">
      {/* Top Meta Line */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2.5">
        <div className="flex items-center gap-2">
          <span className="label-xs font-mono font-bold text-muted-foreground">Round {item.roundNumber}</span>
          <span className="label-xs rounded bg-surface-2 border border-border px-2 py-0.5 font-bold">
            {item.category}
          </span>
          {item.isClutch && (
            <span className="label-xs rounded bg-gold/20 text-gold border border-gold/40 px-2 py-0.5 font-black">
              ⚡ CLUTCH
            </span>
          )}
        </div>

        <ClassificationBadge label={item.classification} variant={item.classification} />
      </div>

      {/* Question Prompt */}
      <h3 className="text-base sm:text-lg font-bold text-foreground leading-snug">{item.prompt}</h3>

      {/* Answers Grid */}
      <div className="grid sm:grid-cols-2 gap-2 text-xs">
        <div
          className={cn(
            "p-2.5 rounded-xl border flex items-center justify-between gap-2",
            item.wasCorrect ? "bg-primary/10 border-primary/40 text-primary" : "bg-accent/10 border-accent/40 text-accent",
          )}
        >
          <span className="font-bold flex items-center gap-1.5 truncate">
            {item.wasCorrect ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
            <span>Votre réponse : <strong>{item.playerSelectedLabel}</strong></span>
          </span>
          <span className="font-mono text-[11px] opacity-80 shrink-0">{(item.playerResponseMs / 1000).toFixed(2)}s</span>
        </div>

        {!item.wasCorrect && (
          <div className="p-2.5 rounded-xl border bg-surface-2 border-border text-foreground flex items-center justify-between gap-2">
            <span className="font-bold flex items-center gap-1.5 truncate">
              <CheckCircle2 size={16} className="text-primary" />
              <span>Bonne réponse : <strong>{item.correctOptionLabel}</strong></span>
            </span>
          </div>
        )}
      </div>

      {/* Analysis Copy & Peer Telemetry */}
      <div className="pt-1 text-xs text-muted-foreground space-y-1.5 leading-relaxed">
        <p className="text-foreground/90 font-medium">{item.analysisText}</p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] opacity-75">
          <span>Taux de réussite pairs : <strong>{Math.round(item.peerAccuracy * 100)}%</strong></span>
          <span>Médiane division : <strong>{(item.peerMedianResponseMs / 1000).toFixed(2)}s</strong></span>
          {item.speedPercentile && (
            <span className="text-primary">Top <strong>{100 - item.speedPercentile}%</strong> vitesse</span>
          )}
        </div>
      </div>

      {/* Practice CTA for Mistakes */}
      {!item.wasCorrect && (
        <div className="pt-2 border-t border-border flex items-center justify-between">
          <span className="text-xs text-muted-foreground italic">Point faible identifié</span>
          <Link to="/play">
            <Button size="sm" variant="surface" className="font-bold text-xs">
              <Target size={13} /> S'entraîner sur ce thème
            </Button>
          </Link>
        </div>
      )}
    </Panel>
  );
}
