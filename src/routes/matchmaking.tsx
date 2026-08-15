import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import * as React from "react";
import { X, Swords, Flame } from "lucide-react";
import { Avatar, DivisionBadge } from "@/components/kit/badges";
import { rivalOpponent } from "@/data/mock";
import { fmt, playCue } from "@/lib/game";
import { gameService } from "@/lib/gameService";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/matchmaking")({
  head: () => ({
    meta: [
      { title: "Finding an opponent — QuizArena" },
      { name: "description", content: "Ranked matchmaking: same skill, same questions, ELO on the line." },
      { property: "og:title", content: "Finding an opponent — QuizArena" },
      { property: "og:description", content: "Ranked matchmaking in progress." },
    ],
  }),
  component: Matchmaking,
});

type Phase = "searching" | "found" | "countdown";

function Matchmaking() {
  const navigate = useNavigate();
  const [profile] = React.useState(() => gameService.getUserProfile());
  const [phase, setPhase] = React.useState<Phase>("searching");
  const [count, setCount] = React.useState(3);

  // Matchmaking sequence
  React.useEffect(() => {
    const t1 = setTimeout(() => {
      setPhase("found");
      playCue("match-found");
    }, 2000);
    const t2 = setTimeout(() => setPhase("countdown"), 4400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  React.useEffect(() => {
    if (phase !== "countdown") return undefined;
    if (count === 0) {
      navigate({ to: "/match" });
      return undefined;
    }
    const t = setTimeout(() => {
      playCue("countdown");
      setCount((c) => c - 1);
    }, 800);
    return () => clearTimeout(t);
  }, [phase, count, navigate]);

  return (
    <div className="stage relative flex min-h-screen flex-col items-center justify-center bg-background px-4 select-none">
      <Link
        to="/play"
        aria-label="Cancel search"
        className="absolute left-4 top-4 rounded-lg p-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <X size={22} strokeWidth={2.5} />
      </Link>

      <div className="w-full max-w-md">
        {/* Your Fighter Card */}
        <Fighter
          name={profile.username}
          initials={profile.initials}
          color={profile.avatarColor}
          elo={profile.elo}
          flag={profile.country.flag}
        />

        {/* Center Tension State */}
        <div className="my-8 text-center">
          {phase === "searching" && (
            <>
              <div className="display text-4xl text-muted-foreground animate-pulse">Searching…</div>
              <div className="mx-auto mt-4 h-1.5 w-48 overflow-hidden rounded-full bg-muted">
                <span className="block h-full w-1/3 animate-[sweep_1.2s_linear_infinite] rounded-full bg-primary" />
              </div>
              <div className="label-xs mt-3 text-muted-foreground font-mono">
                Matching Diamond III Vanguard · Europe Circuit
              </div>
            </>
          )}
          {phase !== "searching" && (
            <div className="space-y-1">
              <div className="animate-slam display text-6xl text-accent sm:text-7xl">VS</div>
              <div className="label-xs inline-flex items-center gap-1.5 rounded-full bg-surface border border-border px-3 py-1 text-gold">
                <Flame size={12} className="fill-gold" /> KENAEL 7 — 6 LUCAS92 · All-Time Rivalry
              </div>
            </div>
          )}
        </div>

        {/* Opponent Fighter Card */}
        <div
          className={cn(
            "transition-all duration-500",
            phase === "searching" ? "opacity-25 blur-sm" : "animate-rise opacity-100",
          )}
        >
          <Fighter
            name={phase === "searching" ? "?????" : rivalOpponent.username}
            initials={phase === "searching" ? "??" : rivalOpponent.initials}
            color={rivalOpponent.avatarColor}
            elo={phase === "searching" ? profile.elo : 1672}
            flag={rivalOpponent.country.flag}
            mirrored
          />
        </div>

        {/* ELO Stakes */}
        {phase !== "searching" && (
          <div className="animate-rise mt-8 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-primary/40 bg-primary/10 p-3 text-center">
              <div className="label-xs text-muted-foreground">Victory Stakes</div>
              <div className="numeric mt-1 text-3xl text-primary font-bold">+18 ELO</div>
            </div>
            <div className="rounded-xl border border-border bg-surface p-3 text-center">
              <div className="label-xs text-muted-foreground">Defeat Risk</div>
              <div className="numeric mt-1 text-3xl text-muted-foreground font-bold">-14 ELO</div>
            </div>
          </div>
        )}
      </div>

      {/* 3-2-1 Countdown Overlay */}
      {phase === "countdown" && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/90 backdrop-blur-md">
          <div className="text-center">
            <div className="label-xs text-muted-foreground tracking-widest font-black uppercase mb-2">
              Match Commencing
            </div>
            <div key={count} className="numeric animate-slam text-[9rem] leading-none text-primary font-black drop-shadow-2xl">
              {count === 0 ? "GO" : count}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Fighter({
  name,
  initials,
  color,
  elo,
  flag,
  mirrored,
}: {
  name: string;
  initials: string;
  color: string;
  elo: number;
  flag: string;
  mirrored?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-lift)]",
        mirrored && "flex-row-reverse text-right",
      )}
    >
      <Avatar initials={initials} color={color} size={60} ring />
      <div className="min-w-0 flex-1">
        <div className="display truncate text-2xl">
          {name} <span className="text-base">{flag}</span>
        </div>
        <div className={cn("mt-1 flex items-center gap-2", mirrored && "justify-end")}>
          <span className="numeric text-lg text-gold font-bold">{fmt(elo)} ELO</span>
          <DivisionBadge elo={elo} size="sm" />
        </div>
      </div>
    </div>
  );
}
