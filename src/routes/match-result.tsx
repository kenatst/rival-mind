import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { Button, Panel } from "@/components/kit/primitives";
import { Avatar, DivisionBadge } from "@/components/kit/badges";
import { EloCounter } from "@/components/kit/game";
import { currentUser, rivalOpponent } from "@/data/mock";
import { fmt, playCue, useCountUp } from "@/lib/game";
import { getLastMatch } from "@/lib/session";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/match-result")({
  head: () => ({
    meta: [
      { title: "Match result — QuizArena" },
      { name: "description", content: "Your ELO change, new division and updated world ranking." },
      { property: "og:title", content: "Match result — QuizArena" },
      { property: "og:description", content: "ELO change and world ranking update." },
    ],
  }),
  component: MatchResultScreen,
});

function MatchResultScreen() {
  const navigate = useNavigate();
  const { playerScore, opponentScore } = getLastMatch();
  const win = playerScore >= opponentScore;
  const delta = win ? 18 : -14;
  const eloBefore = currentUser.elo;
  const eloAfter = eloBefore + delta;
  const rankBefore = currentUser.worldRank;
  const rankAfter = win ? 17882 : 18990;
  const rank = useCountUp(rankAfter, 1600, rankBefore);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    playCue(win ? "victory" : "defeat");
  }, [win]);

  return (
    <div className="stage min-h-screen bg-background px-4 py-8">
      <div className="mx-auto w-full max-w-lg">
        <div
          className={cn(
            "display animate-slam text-center text-6xl sm:text-8xl",
            win ? "text-primary" : "text-muted-foreground",
          )}
        >
          {win ? "Victory" : "Defeat"}
        </div>

        <Panel className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="flex flex-col items-center gap-2">
            <Avatar initials={currentUser.initials} color={currentUser.avatarColor} size={48} />
            <span className="display text-sm">{currentUser.username}</span>
            <span className="numeric text-4xl">{playerScore}</span>
          </div>
          <span className="display text-muted-foreground">vs</span>
          <div className="flex flex-col items-center gap-2">
            <Avatar initials={rivalOpponent.initials} color={rivalOpponent.avatarColor} size={48} />
            <span className="display text-sm">{rivalOpponent.username}</span>
            <span className="numeric text-4xl text-muted-foreground">{opponentScore}</span>
          </div>
        </Panel>

        <Panel glow={win} className="mt-4 py-8">
          <div className="label-xs text-center text-muted-foreground">New rating</div>
          <EloCounter from={eloBefore} to={eloAfter} className="mt-3" />
          <div className="mt-5 flex justify-center">
            <DivisionBadge elo={eloAfter} size="lg" />
          </div>
        </Panel>

        <Panel className="mt-4 flex items-center justify-between">
          <div>
            <div className="label-xs text-muted-foreground">World ranking</div>
            <div className="numeric mt-1 text-3xl">#{fmt(rank)}</div>
          </div>
          <div
            className={cn(
              "numeric text-xl",
              rankAfter < rankBefore ? "text-success" : "text-muted-foreground",
            )}
          >
            {rankAfter < rankBefore ? "▲" : "▼"} {fmt(Math.abs(rankBefore - rankAfter))}
          </div>
        </Panel>

        {!win && (
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Close one. You were 2 points from Diamond II — one win puts it back in reach.
          </p>
        )}

        <div className="mt-6 space-y-3">
          <Link to="/matchmaking" className="block">
            <Button full size="xl">
              Next opponent
            </Button>
          </Link>
          <div className="grid grid-cols-2 gap-3">
            <Link to="/matchmaking">
              <Button variant="surface" full>
                Rematch
              </Button>
            </Link>
            <Button
              variant="outline"
              full
              onClick={() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 1600);
              }}
            >
              {copied ? "Link copied" : "Share"}
            </Button>
          </div>
          <Button variant="ghost" full onClick={() => navigate({ to: "/home" })}>
            Back to lobby
          </Button>
        </div>
      </div>
    </div>
  );
}
