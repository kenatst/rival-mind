import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import * as React from "react";
import { X } from "lucide-react";
import { Avatar, DivisionBadge } from "@/components/kit/badges";
import { currentUser, rivalOpponent } from "@/data/mock";
import { fmt, playCue } from "@/lib/game";
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
  const [phase, setPhase] = React.useState<Phase>("searching");
  const [count, setCount] = React.useState(3);

  React.useEffect(() => {
    const t1 = setTimeout(() => {
      setPhase("found");
      playCue("match-found");
    }, 2200);
    const t2 = setTimeout(() => setPhase("countdown"), 4600);
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
    const t = setTimeout(() => setCount((c) => c - 1), 800);
    return () => clearTimeout(t);
  }, [phase, count, navigate]);

  return (
    <div className="stage relative flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <Link
        to="/play"
        aria-label="Cancel search"
        className="absolute left-4 top-4 rounded-lg p-2 text-muted-foreground hover:text-foreground"
      >
        <X size={20} strokeWidth={2.5} />
      </Link>

      <div className="w-full max-w-md">
        <Fighter
          name={currentUser.username}
          initials={currentUser.initials}
          color={currentUser.avatarColor}
          elo={currentUser.elo}
          flag={currentUser.country.flag}
        />

        <div className="my-8 text-center">
          {phase === "searching" && (
            <>
              <div className="display text-4xl text-muted-foreground">Searching…</div>
              <div className="mx-auto mt-4 h-1.5 w-40 overflow-hidden rounded-full bg-muted">
                <span className="block h-full w-1/3 animate-[sweep_1.2s_linear_infinite] rounded-full bg-primary" />
              </div>
            </>
          )}
          {phase !== "searching" && (
            <div className="animate-slam display text-6xl text-accent sm:text-7xl">VS</div>
          )}
        </div>

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
            elo={rivalOpponent.elo}
            flag={rivalOpponent.country.flag}
            mirrored
          />
        </div>

        {phase !== "searching" && (
          <div className="animate-rise mt-8 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-primary/40 bg-primary/10 p-3 text-center">
              <div className="label-xs text-muted-foreground">Win</div>
              <div className="numeric mt-1 text-3xl text-primary">+18</div>
            </div>
            <div className="rounded-xl border border-border bg-surface p-3 text-center">
              <div className="label-xs text-muted-foreground">Loss</div>
              <div className="numeric mt-1 text-3xl text-muted-foreground">-14</div>
            </div>
          </div>
        )}
      </div>

      {phase === "countdown" && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/85 backdrop-blur">
          <div className="text-center">
            <div className="label-xs text-muted-foreground">Match starting</div>
            <div key={count} className="numeric animate-slam text-[9rem] leading-none text-primary">
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
        "flex items-center gap-4 rounded-2xl border border-border bg-surface p-4",
        mirrored && "flex-row-reverse text-right",
      )}
    >
      <Avatar initials={initials} color={color} size={60} ring />
      <div className="min-w-0 flex-1">
        <div className="display truncate text-2xl">
          {name} <span className="text-base">{flag}</span>
        </div>
        <div className={cn("mt-1 flex items-center gap-2", mirrored && "justify-end")}>
          <span className="numeric text-lg text-gold">{fmt(elo)}</span>
          <DivisionBadge elo={elo} size="sm" />
        </div>
      </div>
    </div>
  );
}
