import * as React from "react";
import { cn } from "@/lib/utils";
import { fmt, useCountUp } from "@/lib/game";
import type { Answer, LeaderboardEntry, PlayerProfile } from "@/lib/types";
import { Avatar, DivisionBadge } from "./badges";

/* ---------------------------------- Timer ---------------------------------- */

export function Timer({ seconds, total, urgent }: { seconds: number; total: number; urgent: boolean }) {
  const pct = Math.max(0, seconds / total);
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid h-24 w-24 place-items-center">
      <svg viewBox="0 0 80 80" className="absolute inset-0 h-full w-full -rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" stroke="var(--muted)" strokeWidth="6" />
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke={urgent ? "var(--danger)" : "var(--primary)"}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          className="transition-[stroke-dashoffset] duration-1000 ease-linear"
        />
      </svg>
      <span
        className={cn(
          "numeric text-4xl",
          urgent ? "animate-pulse text-danger" : "text-foreground",
        )}
      >
        {String(Math.max(0, seconds)).padStart(2, "0")}
      </span>
    </div>
  );
}

/* ------------------------------- Answer card ------------------------------- */

export type AnswerState = "idle" | "selected" | "correct" | "wrong" | "dimmed";

export function AnswerCard({
  answer,
  index,
  state,
  onSelect,
  disabled,
}: {
  answer: Answer;
  index: number;
  state: AnswerState;
  onSelect: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onSelect}
      disabled={disabled}
      className={cn(
        "group flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-4 text-left transition-all duration-200 active:scale-[0.985] sm:py-5",
        state === "idle" &&
          "border-border bg-surface hover:border-border-strong hover:bg-surface-2",
        state === "selected" && "animate-pop border-primary bg-primary/15",
        state === "correct" && "animate-pop border-success bg-success/20",
        state === "wrong" && "animate-shake border-danger bg-danger/15",
        state === "dimmed" && "border-border bg-surface opacity-40",
      )}
    >
      <span
        className={cn(
          "numeric grid h-9 w-9 shrink-0 place-items-center rounded-lg border text-base",
          state === "correct" && "border-success text-success",
          state === "wrong" && "border-danger text-danger",
          state !== "correct" && state !== "wrong" && "border-border text-muted-foreground",
        )}
      >
        {String.fromCharCode(65 + index)}
      </span>
      <span className="min-w-0 text-base font-bold leading-tight sm:text-lg">{answer.label}</span>
    </button>
  );
}

/* ------------------------------ Score counter ------------------------------ */

export function ScoreCounter({
  value,
  className,
  size = "lg",
}: {
  value: number;
  className?: string;
  size?: "md" | "lg" | "xl";
}) {
  const [bump, setBump] = React.useState(false);
  const prev = React.useRef(value);
  React.useEffect(() => {
    if (prev.current !== value) {
      prev.current = value;
      setBump(true);
      const t = setTimeout(() => setBump(false), 300);
      return () => clearTimeout(t);
    }
  }, [value]);
  return (
    <span
      className={cn(
        "numeric inline-block transition-transform",
        size === "md" && "text-3xl",
        size === "lg" && "text-5xl",
        size === "xl" && "text-7xl",
        bump && "animate-pop text-primary",
        className,
      )}
    >
      {value}
    </span>
  );
}

/* -------------------------------- ELO counter ------------------------------- */

export function EloCounter({
  from,
  to,
  className,
}: {
  from: number;
  to: number;
  className?: string;
}) {
  const value = useCountUp(to, 1600, from);
  const delta = to - from;
  return (
    <div className={cn("text-center", className)}>
      <div className="numeric animate-slam text-6xl sm:text-8xl">{fmt(value)}</div>
      <div
        className={cn(
          "numeric mt-2 text-2xl",
          delta >= 0 ? "text-primary" : "text-muted-foreground",
        )}
      >
        {delta >= 0 ? "+" : ""}
        {delta} ELO
      </div>
    </div>
  );
}

/* ------------------------------- Player card ------------------------------- */

export function PlayerCard({
  player,
  compact,
  right,
}: {
  player: Pick<PlayerProfile, "username" | "initials" | "avatarColor" | "elo" | "country">;
  compact?: boolean;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <Avatar initials={player.initials} color={player.avatarColor} size={compact ? 40 : 52} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="display truncate text-lg">{player.username}</span>
          <span className="text-sm leading-none">{player.country.flag}</span>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <span className="numeric text-sm text-muted-foreground">{fmt(player.elo)} ELO</span>
          <DivisionBadge elo={player.elo} size="sm" />
        </div>
      </div>
      {right}
    </div>
  );
}

/* ----------------------------- Leaderboard row ----------------------------- */

export function LeaderboardRow({ entry, metric = "ELO" }: { entry: LeaderboardEntry; metric?: string }) {
  return (
    <div
      className={cn(
        "grid grid-cols-[2.75rem_auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors",
        entry.isYou
          ? "border-primary/60 bg-primary/10"
          : "border-transparent bg-surface hover:bg-surface-2",
      )}
    >
      <span
        className={cn(
          "numeric text-right text-base",
          entry.rank <= 3 ? "text-gold" : "text-muted-foreground",
        )}
      >
        {entry.rank}
      </span>
      <Avatar initials={entry.player.initials} color={entry.player.avatarColor} size={34} />
      <span className="flex min-w-0 items-center gap-2">
        <span className="text-sm leading-none">{entry.player.country.flag}</span>
        <span className={cn("truncate font-bold", entry.isYou && "text-primary")}>
          {entry.player.username}
        </span>
        {entry.trend !== undefined && entry.trend !== 0 && (
          <span
            className={cn(
              "label-xs",
              entry.trend > 0 ? "text-success" : "text-danger",
            )}
          >
            {entry.trend > 0 ? "▲" : "▼"}
            {Math.abs(entry.trend)}
          </span>
        )}
      </span>
      <span className="numeric text-lg">
        {fmt(entry.elo)}
        <span className="label-xs ml-1 text-muted-foreground">{metric}</span>
      </span>
    </div>
  );
}

/* --------------------------------- Stat tile -------------------------------- */

export function StatTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  accent?: "primary" | "gold" | "accent";
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-3">
      <div className="label-xs text-muted-foreground">{label}</div>
      <div
        className={cn(
          "numeric mt-1.5 text-2xl",
          accent === "primary" && "text-primary",
          accent === "gold" && "text-gold",
          accent === "accent" && "text-accent",
        )}
      >
        {value}
      </div>
    </div>
  );
}
