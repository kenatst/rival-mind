import { useEffect, useRef, useState } from "react";
import type { DivisionTier } from "./types";

/** Business logic kept out of components so a real API can replace it later. */

const TIERS: { tier: DivisionTier; min: number; color: string }[] = [
  { tier: "Rookie", min: 0, color: "oklch(0.7 0.02 265)" },
  { tier: "Bronze", min: 800, color: "oklch(0.66 0.12 55)" },
  { tier: "Silver", min: 1000, color: "oklch(0.82 0.02 250)" },
  { tier: "Gold", min: 1200, color: "oklch(0.83 0.16 84)" },
  { tier: "Platinum", min: 1350, color: "oklch(0.85 0.1 190)" },
  { tier: "Diamond", min: 1400, color: "oklch(0.8 0.15 215)" },
  { tier: "Master", min: 1800, color: "oklch(0.7 0.2 300)" },
  { tier: "Grandmaster", min: 2200, color: "oklch(0.66 0.26 5)" },
  { tier: "Legend", min: 2600, color: "oklch(0.88 0.21 122)" },
];

export interface ResolvedDivision {
  tier: DivisionTier;
  sub?: "I" | "II" | "III";
  label: string;
  color: string;
  floor: number;
  ceiling: number;
  progress: number;
  nextLabel: string;
}

export function divisionForElo(elo: number): ResolvedDivision {
  let index = 0;
  for (let i = 0; i < TIERS.length; i++) if (elo >= TIERS[i]!.min) index = i;
  const tier = TIERS[index]!;
  const next = TIERS[index + 1];
  const ceiling = next ? next.min : tier.min + 400;
  const span = (ceiling - tier.min) / 3;
  const step = Math.min(2, Math.floor((elo - tier.min) / span));
  const subs = ["III", "II", "I"] as const;
  const sub = next ? subs[step] : undefined;
  const floor = tier.min + step * span;
  const subCeiling = next ? floor + span : ceiling;
  return {
    tier: tier.tier,
    sub,
    label: sub ? `${tier.tier} ${sub}` : tier.tier,
    color: tier.color,
    floor: Math.round(floor),
    ceiling: Math.round(subCeiling),
    progress: Math.max(0, Math.min(1, (elo - floor) / (subCeiling - floor))),
    nextLabel: sub
      ? sub === "I"
        ? `${next!.tier} III`
        : `${tier.tier} ${subs[step + 1]}`
      : "Legend",
  };
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
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(origin + (target - origin) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
      else from.current = target;
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
    const id = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(id);
  }, [left, running]);

  return { left, urgent: left <= 3, reset: () => setLeft(seconds) };
}

/** Sound hook placeholder — real files are wired later, UI stays usable muted. */
export type SoundCue =
  | "answer-correct"
  | "answer-wrong"
  | "countdown"
  | "match-found"
  | "victory"
  | "defeat"
  | "rank-promotion"
  | "daily-perfect"
  | "tap";

export function playCue(cue: SoundCue) {
  if (typeof window === "undefined") return;
  (window as unknown as { __sfx?: SoundCue[] }).__sfx ??= [];
  (window as unknown as { __sfx: SoundCue[] }).__sfx.push(cue);
}
