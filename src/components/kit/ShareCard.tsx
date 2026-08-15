import * as React from "react";
import { MatchReviewDTO } from "@/engine/matchReviewEngine";
import { fmt } from "@/lib/game";
import { Trophy, Swords, Zap, Target, TrendingUp, TrendingDown, Sparkles, Shield, Award } from "lucide-react";
import { cn } from "@/lib/utils";

interface ShareCardProps {
  review: MatchReviewDTO;
  format: "story" | "square";
}

export function ShareCard({ review, format }: ShareCardProps) {
  const isPerfAbove = review.performanceDelta >= 0;
  const isStory = format === "story";

  return (
    <div
      id="iq-share-card-render"
      className={cn(
        "relative overflow-hidden rounded-3xl border-2 border-primary/50 bg-[#07090E] p-6 text-white shadow-2xl select-none font-sans",
        isStory ? "w-full max-w-[360px] aspect-[9/16] flex flex-col justify-between" : "w-full max-w-[400px] aspect-square flex flex-col justify-between",
      )}
    >
      {/* Background Gradient Orbs */}
      <div className="absolute -top-16 -left-16 w-48 h-48 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-gold/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Brand & Match Header */}
      <div className="relative z-10 space-y-3">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center font-black text-black text-sm shadow-md">
              IQ
            </div>
            <span className="font-black tracking-widest text-sm uppercase text-white/90">
              IQ ARENA
            </span>
          </div>
          <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-white/70">
            Competitive Match Review
          </span>
        </div>

        {/* Player vs Opponent Duel Badge */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <div>
            <div className="text-xl font-black text-white flex items-center gap-1.5">
              {review.playerUsername}
            </div>
            <div className="text-xs font-mono text-primary font-bold">
              Arena Rating: {fmt(review.arenaRatingAfter)} ({review.arenaRatingDelta >= 0 ? `+${review.arenaRatingDelta}` : review.arenaRatingDelta})
            </div>
          </div>

          <div className="text-right">
            <span
              className={cn(
                "px-3 py-1 rounded-xl text-xs font-black tracking-wider uppercase inline-block",
                review.isVictory ? "bg-primary text-black" : "bg-white/10 text-white/80",
              )}
            >
              {review.isVictory ? "VICTORY" : review.isDraw ? "DRAW" : "DEFEAT"} ({review.finalScorePlayer} — {review.finalScoreOpponent})
            </span>
            <div className="text-[11px] text-white/50 font-mono mt-0.5">vs {review.opponentUsername}</div>
          </div>
        </div>
      </div>

      {/* Centerpiece: PERFORMANCE RATING BIG REVEAL */}
      <div className="relative z-10 text-center py-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
        <div className="text-[11px] font-mono tracking-widest text-white/60 uppercase font-bold flex items-center justify-center gap-1.5">
          <Award size={13} className="text-gold" /> Performance Rating
        </div>

        <div className="text-6xl font-black text-gold drop-shadow-[0_0_25px_rgba(255,215,0,0.4)] my-1">
          {review.performanceRating}
        </div>

        <div className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/10">
          {isPerfAbove ? (
            <span className="text-primary flex items-center gap-1">
              <TrendingUp size={13} /> +{review.performanceDelta} Above Rating
            </span>
          ) : (
            <span className="text-rose-400 flex items-center gap-1">
              <TrendingDown size={13} /> {review.performanceDelta} Below Rating
            </span>
          )}
        </div>
      </div>

      {/* Highlights & Key Moments */}
      <div className="relative z-10 space-y-2">
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="bg-white/5 p-2 rounded-xl border border-white/10">
            <div className="text-[10px] text-white/50 font-bold">Accuracy</div>
            <div className="text-sm font-black text-white">{review.accuracyPercent}%</div>
          </div>
          <div className="bg-white/5 p-2 rounded-xl border border-white/10">
            <div className="text-[10px] text-white/50 font-bold">Avg Speed</div>
            <div className="text-sm font-black text-white">{(review.avgResponseMs / 1000).toFixed(2)}s</div>
          </div>
          <div className="bg-white/5 p-2 rounded-xl border border-white/10">
            <div className="text-[10px] text-white/50 font-bold">Verdict</div>
            <div className="text-[11px] font-black text-gold truncate">{review.matchVerdict}</div>
          </div>
        </div>

        {/* Classification Strip */}
        <div className="flex items-center justify-center gap-1.5 flex-wrap pt-1 text-[10px] font-bold">
          {review.summary.elite > 0 && (
            <span className="px-2 py-0.5 rounded-md bg-gold/20 text-gold border border-gold/40">
              {review.summary.elite} ELITE
            </span>
          )}
          {review.summary.instant > 0 && (
            <span className="px-2 py-0.5 rounded-md bg-cyan-400/20 text-cyan-400 border border-cyan-400/40">
              {review.summary.instant} INSTANT
            </span>
          )}
          {review.summary.good > 0 && (
            <span className="px-2 py-0.5 rounded-md bg-emerald-400/20 text-emerald-400 border border-emerald-400/40">
              {review.summary.good} GOOD
            </span>
          )}
          {review.summary.blunder > 0 && (
            <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-400 border border-rose-500/40">
              {review.summary.blunder} BLUNDER
            </span>
          )}
        </div>
      </div>

      {/* Footer CTA */}
      <div className="relative z-10 border-t border-white/10 pt-3 flex items-center justify-between text-[11px] text-white/60">
        <span className="font-mono">iqarena.gg</span>
        <span className="font-bold text-white flex items-center gap-1">
          Can you beat this? <Sparkles size={12} className="text-gold" />
        </span>
      </div>
    </div>
  );
}
