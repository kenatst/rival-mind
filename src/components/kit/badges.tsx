import { cn } from "@/lib/utils";
import { divisionForElo } from "@/lib/game";
import type { Country } from "@/lib/types";

export function Avatar({
  initials,
  color,
  size = 44,
  ring,
  online,
  className,
}: {
  initials: string;
  color: string;
  size?: number;
  ring?: boolean;
  online?: boolean;
  className?: string | undefined;
}) {
  return (
    <div className={cn("relative shrink-0", className)} style={{ width: size, height: size }}>
      <div
        className={cn(
          "numeric grid h-full w-full place-items-center rounded-2xl text-[oklch(0.18_0.03_268)]",
          ring && "ring-2 ring-offset-2 ring-offset-background",
        )}
        style={{
          background: `linear-gradient(140deg, ${color}, color-mix(in oklab, ${color} 55%, black))`,
          fontSize: size * 0.36,
          ...(ring ? { ["--tw-ring-color" as string]: color } : {}),
        }}
      >
        {initials}
      </div>
      {online && (
        <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background bg-success" />
      )}
    </div>
  );
}

export function DivisionBadge({
  elo,
  size = "md",
  className,
}: {
  elo: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const d = divisionForElo(elo);
  return (
    <span
      className={cn(
        "label-xs inline-flex items-center gap-1.5 rounded-lg border px-2 py-1",
        size === "lg" && "px-3 py-1.5 text-sm tracking-[0.12em]",
        size === "sm" && "px-1.5 py-0.5 text-[0.625rem]",
        className,
      )}
      style={{
        color: d.color,
        borderColor: `color-mix(in oklab, ${d.color} 45%, transparent)`,
        background: `color-mix(in oklab, ${d.color} 12%, transparent)`,
      }}
    >
      <span
        className="inline-block h-2 w-2 rotate-45 rounded-[2px]"
        style={{ background: d.color }}
      />
      {d.label}
    </span>
  );
}

export function CountryBadge({
  country,
  rank,
  className,
}: {
  country: Country;
  rank?: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "label-xs inline-flex items-center gap-1.5 rounded-lg bg-surface-2 px-2 py-1 text-muted-foreground",
        className,
      )}
    >
      <span className="text-sm leading-none">{country.flag}</span>
      {country.name}
      {rank !== undefined && <span className="text-foreground">#{rank.toLocaleString("en-US")}</span>}
    </span>
  );
}

export function RankBadge({
  rank,
  label,
  tone = "default",
}: {
  rank: number | string;
  label: string;
  tone?: "default" | "gold" | "primary";
}) {
  return (
    <div className="rounded-xl border border-border bg-surface-2/60 px-3 py-2">
      <div className="label-xs text-muted-foreground">{label}</div>
      <div
        className={cn(
          "numeric mt-1 text-2xl",
          tone === "gold" && "text-gold",
          tone === "primary" && "text-primary",
        )}
      >
        {typeof rank === "number" ? `#${rank.toLocaleString("en-US")}` : rank}
      </div>
    </div>
  );
}
