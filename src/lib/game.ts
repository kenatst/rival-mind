import { useEffect, useRef, useState } from "react";
import type { DivisionTier } from "./types";
import { soundService } from "./soundService";

export interface TierConfig {
  tier: DivisionTier;
  min: number;
  max: number;
  color: string;
  hasSubdivisions: boolean;
}

export const TIERS: Record<DivisionTier, TierConfig> = {
  Rookie: { tier: "Rookie", min: 0, max: 799, color: "oklch(0.7 0.02 265)", hasSubdivisions: false },
  Bronze: { tier: "Bronze", min: 800, max: 999, color: "oklch(0.66 0.12 55)", hasSubdivisions: true },
  Silver: { tier: "Silver", min: 1000, max: 1199, color: "oklch(0.82 0.02 250)", hasSubdivisions: true },
  Gold: { tier: "Gold", min: 1200, max: 1399, color: "oklch(0.83 0.16 84)", hasSubdivisions: true },
  Platinum: { tier: "Platinum", min: 1400, max: 1599, color: "oklch(0.85 0.1 190)", hasSubdivisions: true },
  Diamond: { tier: "Diamond", min: 1600, max: 1799, color: "oklch(0.8 0.15 215)", hasSubdivisions: true },
  Master: { tier: "Master", min: 1800, max: 1999, color: "oklch(0.7 0.2 300)", hasSubdivisions: true },
  Grandmaster: { tier: "Grandmaster", min: 2000, max: 2199, color: "oklch(0.66 0.26 5)", hasSubdivisions: true },
  Legend: { tier: "Legend", min: 2200, max: 4000, color: "oklch(0.88 0.21 122)", hasSubdivisions: false },
};

export const TIER_ORDER: DivisionTier[] = [
  "Rookie",
  "Bronze",
  "Silver",
  "Gold",
  "Platinum",
  "Diamond",
  "Master",
  "Grandmaster",
  "Legend",
];

export interface ResolvedDivision {
  tier: DivisionTier;
  sub?: "I" | "II" | "III" | undefined;
  label: string;
  color: string;
  floor: number;
  ceiling: number;
  progress: number;
  nextLabel: string;
  eloRemaining: number;
  isPromotionZone: boolean;
}

export function divisionForElo(elo: number): ResolvedDivision {
  let tierKey: DivisionTier = "Rookie";
  for (const t of TIER_ORDER) {
    if (elo >= TIERS[t].min) {
      tierKey = t;
    }
  }

  const currentTier = TIERS[tierKey];
  const tierIndex = TIER_ORDER.indexOf(tierKey);
  const nextTierKey = tierIndex < TIER_ORDER.length - 1 ? TIER_ORDER[tierIndex + 1] : undefined;
  const nextTier = nextTierKey ? TIERS[nextTierKey] : null;

  if (!currentTier.hasSubdivisions) {
    const ceiling = nextTier ? nextTier.min : currentTier.max;
    const span = ceiling - currentTier.min;
    const progress = span > 0 ? Math.max(0, Math.min(1, (elo - currentTier.min) / span)) : 1;
    const eloRemaining = Math.max(0, ceiling - elo);
    return {
      tier: tierKey,
      label: tierKey,
      color: currentTier.color,
      floor: currentTier.min,
      ceiling,
      progress,
      nextLabel: nextTier ? `${nextTier.tier} III` : "Apex Legend",
      eloRemaining,
      isPromotionZone: eloRemaining <= 20 && eloRemaining > 0,
    };
  }

  // 3 subdivisions: III (lower third), II (middle third), I (top third)
  const tierSpan = currentTier.max - currentTier.min + 1; // 200 pts
  const subSpan = tierSpan / 3; // ~66.67 pts
  const offset = elo - currentTier.min;

  let sub: "I" | "II" | "III" = "III";
  let subFloor = currentTier.min;
  let subCeiling = currentTier.min + Math.round(subSpan);
  let nextLabel = `${tierKey} II`;

  if (offset < subSpan) {
    sub = "III";
    subFloor = currentTier.min;
    subCeiling = currentTier.min + Math.round(subSpan);
    nextLabel = `${tierKey} II`;
  } else if (offset < subSpan * 2) {
    sub = "II";
    subFloor = currentTier.min + Math.round(subSpan);
    subCeiling = currentTier.min + Math.round(subSpan * 2);
    nextLabel = `${tierKey} I`;
  } else {
    sub = "I";
    subFloor = currentTier.min + Math.round(subSpan * 2);
    subCeiling = nextTier ? nextTier.min : currentTier.max;
    nextLabel = nextTier ? (nextTier.hasSubdivisions ? `${nextTier.tier} III` : nextTier.tier) : "Apex";
  }

  const progress = Math.max(0, Math.min(1, (elo - subFloor) / (subCeiling - subFloor)));
  const eloRemaining = Math.max(0, subCeiling - elo);

  return {
    tier: tierKey,
    sub,
    label: `${tierKey} ${sub}`,
    color: currentTier.color,
    floor: subFloor,
    ceiling: subCeiling,
    progress,
    nextLabel,
    eloRemaining,
    isPromotionZone: eloRemaining <= 20 && eloRemaining > 0,
  };
}

export const getDivisionFromRating = divisionForElo;

export function getNextDivision(elo: number): string {
  return divisionForElo(elo).nextLabel;
}

export function getRatingToNextDivision(elo: number): number {
  return divisionForElo(elo).eloRemaining;
}

export function getDivisionProgress(elo: number): number {
  return divisionForElo(elo).progress;
}

export const fmt = (n: number) => n.toLocaleString("en-US");

/** Animated counter used for ELO / XP / rank reveal moments. */
export function useCountUp(target: number, duration = 1200, start?: number) {
  const from = useRef(start ?? target);
  const [value, setValue] = useState(start ?? target);

  useEffect(() => {
    const origin = from.current;
    if (origin === target) return;
    const t0 = performance.now();
    let raf = 0;
    let lastTick = origin;

    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const current = Math.round(origin + (target - origin) * eased);
      setValue(current);

      if (Math.abs(current - lastTick) >= 4) {
        soundService.playEloTick();
        lastTick = current;
      }

      if (p < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        from.current = target;
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}

/** Countdown timer with urgency flag. */
export function useCountdown(seconds: number, running = true, onEnd?: () => void) {
  const [left, setLeft] = useState(seconds);
  const endRef = useRef(onEnd);
  endRef.current = onEnd;

  useEffect(() => setLeft(seconds), [seconds]);

  useEffect(() => {
    if (!running) return;
    if (left <= 0) {
      endRef.current?.();
      return;
    }
    const id = setTimeout(() => {
      setLeft((l) => {
        const next = l - 1;
        if (next > 0 && next <= 3) {
          soundService.playCountdown(true);
        } else if (next > 0 && next <= 5) {
          soundService.playCountdown(false);
        }
        return next;
      });
    }, 1000);
    return () => clearTimeout(id);
  }, [left, running]);

  return { left, urgent: left <= 3, reset: () => setLeft(seconds) };
}

export type SoundCue =
  | "answer-correct"
  | "answer-wrong"
  | "correct"
  | "wrong"
  | "countdown"
  | "match-found"
  | "victory"
  | "defeat"
  | "rank-promotion"
  | "daily-perfect"
  | "tap"
  | "select";

export function playCue(cue: SoundCue) {
  switch (cue) {
    case "tap":
      soundService.playTap();
      break;
    case "select":
      soundService.playAnswerSelect();
      break;
    case "answer-correct":
    case "correct":
    case "daily-perfect":
      soundService.playCorrect();
      break;
    case "answer-wrong":
    case "wrong":
      soundService.playWrong();
      break;
    case "match-found":
      soundService.playMatchFound();
      break;
    case "victory":
    case "rank-promotion":
      soundService.playVictory();
      break;
    case "defeat":
      soundService.playDefeat();
      break;
    case "countdown":
      soundService.playCountdown(false);
      break;
  }
}
