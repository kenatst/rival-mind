import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import * as React from "react";
import { X, Swords, Flame, Sparkles } from "lucide-react";
import { Avatar, DivisionBadge } from "@/components/kit/badges";
import { fmt, playCue } from "@/lib/game";
import { profileRepo, matchmakingRepo, rankedRepo, RankedMatchSnapshotDTO } from "@/repositories";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/matchmaking")({
  head: () => ({
    meta: [
      { title: "Finding an Opponent — IQ ARENA" },
      { name: "description", content: "Ranked matchmaking: same skill, same questions, ELO on the line." },
    ],
  }),
  component: Matchmaking,
});

type Phase = "searching" | "found" | "countdown";

function Matchmaking() {
  const navigate = useNavigate();
  const [profile, setProfile] = React.useState<any>(null);
  const [phase, setPhase] = React.useState<Phase>("searching");
  const [count, setCount] = React.useState(3);
  const [queueId, setQueueId] = React.useState<string | null>(null);
  const [matchedMatchId, setMatchedMatchId] = React.useState<string | null>(null);
  const [matchedOpponent, setMatchedOpponent] = React.useState<any>(null);
  const [elapsedSeconds, setElapsedSeconds] = React.useState(0);

  // Load Profile and Join Queue
  React.useEffect(() => {
    let unsubscribeQueue: (() => void) | undefined;
    let isCancelled = false;

    async function initQueue() {
      const p = await profileRepo.getProfile("u-kenael");
      if (isCancelled) return;
      setProfile(p);

      const q = await matchmakingRepo.joinQueue(p.id, "ranked_classic", p.elo);
      if (isCancelled) return;
      setQueueId(q.queueId);

      if (q.status === "matched" && q.matchId) {
        handleMatchFound(q.matchId, p.id);
      } else {
        unsubscribeQueue = matchmakingRepo.subscribeQueue(q.queueId, (mId) => {
          handleMatchFound(mId, p.id);
        });
      }
    }

    initQueue();

    return () => {
      isCancelled = true;
      if (unsubscribeQueue) unsubscribeQueue();
    };
  }, []);

  // Search Timer & Widening Elo Window
  React.useEffect(() => {
    if (phase !== "searching") return;
    const interval = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  const handleMatchFound = async (matchId: string, userId: string) => {
    setMatchedMatchId(matchId);
    setPhase("found");
    playCue("match-found");

    try {
      const snap = await rankedRepo.getMatchSnapshot(matchId, userId);
      const opp = snap.playerA.id === userId ? snap.playerB : snap.playerA;
      setMatchedOpponent(opp);
    } catch {}

    setTimeout(() => {
      setPhase("countdown");
    }, 2000);
  };

  // Synchronized 3.. 2.. 1.. Countdown
  React.useEffect(() => {
    if (phase !== "countdown") return undefined;
    if (count === 0) {
      if (matchedMatchId) {
        navigate({ to: "/match", search: { matchId: matchedMatchId } as any });
      } else {
        navigate({ to: "/match" });
      }
      return undefined;
    }
    const t = setTimeout(() => {
      playCue("countdown");
      setCount((c) => c - 1);
    }, 800);
    return () => clearTimeout(t);
  }, [phase, count, matchedMatchId, navigate]);

  const handleCancel = async () => {
    if (queueId && profile) {
      await matchmakingRepo.cancelQueue(queueId, profile.id);
    }
    navigate({ to: "/home" });
  };

  if (!profile) {
    return (
      <div className="stage min-h-screen grid place-items-center bg-background text-foreground">
        <div className="animate-spin text-primary text-2xl">⏳</div>
      </div>
    );
  }

  // Calculate widening search bracket
  let searchBracket = "±50 ELO (Fair Tier)";
  if (elapsedSeconds > 10) searchBracket = "±200 ELO (Extended Tier)";
  else if (elapsedSeconds > 5) searchBracket = "±100 ELO (Standard Tier)";

  return (
    <div className="stage relative flex min-h-screen flex-col items-center justify-center bg-background px-4 select-none">
      <button
        onClick={handleCancel}
        aria-label="Cancel search"
        className="absolute left-4 top-4 rounded-xl p-2 text-muted-foreground hover:text-foreground transition-colors hover:bg-surface"
      >
        <X size={22} strokeWidth={2.5} />
      </button>

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
              <div className="display text-4xl text-muted-foreground animate-pulse font-black">
                Searching… ({elapsedSeconds}s)
              </div>
              <div className="mx-auto mt-4 h-1.5 w-48 overflow-hidden rounded-full bg-muted">
                <span className="block h-full w-1/3 animate-[sweep_1.2s_linear_infinite] rounded-full bg-primary" />
              </div>
              <div className="label-xs mt-3 text-muted-foreground font-mono">
                Matching Window: <strong className="text-primary">{searchBracket}</strong>
              </div>
            </>
          )}
          {phase !== "searching" && (
            <div className="space-y-1">
              <div className="animate-slam display text-6xl text-accent sm:text-7xl font-black">VS</div>
              <div className="label-xs inline-flex items-center gap-1.5 rounded-full bg-surface border border-border px-3 py-1 text-gold font-bold">
                <Flame size={12} className="fill-gold" /> {profile.username} vs {matchedOpponent?.username || "LUCAS92"} · Ranked Duel
              </div>
            </div>
          )}
        </div>

        {/* Opponent Fighter Card */}
        <div
          className={cn(
            "transition-all duration-500",
            phase === "searching" ? "scale-95 opacity-40 blur-[1px]" : "scale-100 opacity-100 blur-0",
          )}
        >
          <Fighter
            name={phase === "searching" ? "Searching for rival..." : matchedOpponent?.username || "LUCAS92"}
            initials={phase === "searching" ? "?" : matchedOpponent?.initials || "L9"}
            color={phase === "searching" ? "oklch(0.5 0 0)" : matchedOpponent?.avatarColor || "oklch(0.66 0.26 5)"}
            elo={phase === "searching" ? 1650 : matchedOpponent?.rating || 1691}
            flag={phase === "searching" ? "🌍" : matchedOpponent?.country?.flag || "🇫🇷"}
            isOpponent
          />
        </div>

        {/* 3.. 2.. 1.. Start Banner */}
        {phase === "countdown" && (
          <div className="mt-8 text-center animate-rise">
            <div className="numeric text-6xl sm:text-7xl font-black text-primary animate-ping">
              {count}
            </div>
            <div className="label-xs mt-1 text-muted-foreground font-bold">Match starting on server...</div>
          </div>
        )}
      </div>
    </div>
  );
}

function Fighter({
  name,
  initials,
  color,
  elo,
  flag,
  isOpponent,
}: {
  name: string;
  initials: string;
  color: string;
  elo: number;
  flag: string;
  isOpponent?: boolean;
}) {
  return (
    <div
      className={cn(
        "stage relative flex items-center justify-between rounded-3xl border-2 p-5 sm:p-6 shadow-[var(--shadow-lift)]",
        isOpponent ? "border-accent/40 bg-accent/5" : "border-primary/40 bg-primary/5",
      )}
    >
      <div className="flex items-center gap-4">
        <Avatar initials={initials} color={color} size={56} ring />
        <div>
          <div className="flex items-center gap-2">
            <span className="display text-2xl font-black">{name}</span>
            <span className="text-xl leading-none">{flag}</span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <DivisionBadge elo={elo} size="sm" />
            <span className="label-xs text-muted-foreground font-bold">{isOpponent ? "Opponent" : "You"}</span>
          </div>
        </div>
      </div>
      <div className="text-right">
        <div className="numeric text-3xl sm:text-4xl font-black text-gold">{fmt(elo)}</div>
        <div className="label-xs text-muted-foreground font-mono">ELO</div>
      </div>
    </div>
  );
}
