import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { Page } from "@/components/AppShell";
import { Button, Modal, Panel } from "@/components/kit/primitives";
import { Avatar, DivisionBadge } from "@/components/kit/badges";
import { friends, rivalOpponent } from "@/data/mock";
import { fmt, divisionForElo } from "@/lib/game";
import { gameService } from "@/lib/gameService";
import { Swords, Share2, Copy, Check, UserPlus } from "lucide-react";

export const Route = createFileRoute("/battles")({
  head: () => ({
    meta: [
      { title: "Friend Battles — 1v1 Duels | IQ ARENA" },
      { name: "description", content: "Send a 10-question challenge link. Same questions, highest score wins." },
      { property: "og:title", content: "Friend Battles — IQ ARENA" },
      { property: "og:description", content: "Challenge a friend or rival with one shareable link." },
    ],
  }),
  component: BattlesScreen,
});

function BattlesScreen() {
  const navigate = useNavigate();
  const [profile] = React.useState(() => gameService.getUserProfile());
  const [challengeLink, setChallengeLink] = React.useState("iqarena.gg/battle/KENAEL-9X42");
  const [share, setShare] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const pendingChallenge = gameService.getPendingBattle();
  const recentBattles = gameService.getRecentBattles();

  const handleCreateChallenge = () => {
    const link = gameService.createChallengeLink();
    setChallengeLink(link);
    setShare(true);
  };

  const handleCopyLink = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Page
      title="Friend Battles"
      subtitle="Identical 10 questions. Synchronous or async. Highest score takes the victory."
      wide
      action={
        <Button size="sm" onClick={handleCreateChallenge}>
          <Share2 size={15} /> Create Challenge Link
        </Button>
      }
    >
      {/* Featured Incoming Challenge */}
      <div className="stage rounded-3xl border border-accent/40 p-6 sm:p-8 shadow-[var(--shadow-lift)]">
        <div className="label-xs text-accent font-black flex items-center gap-1.5">
          <Swords size={14} /> Incoming 1v1 Battle Invitation
        </div>
        <h2 className="display mt-2 text-3xl sm:text-5xl font-black">
          {pendingChallenge.challenger.username} Challenges You
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {pendingChallenge.questionsCount} questions · Identical seed · Rivalry standing: KENAEL {pendingChallenge.rivalryWins} — {pendingChallenge.rivalryLosses} {pendingChallenge.challenger.username}
        </p>

        <div className="mt-7 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <Side
            name={profile.username}
            initials={profile.initials}
            color={profile.avatarColor}
            elo={profile.elo}
          />
          <span className="display text-3xl text-accent sm:text-5xl font-black">VS</span>
          <Side
            name={pendingChallenge.challenger.username}
            initials={pendingChallenge.challenger.initials}
            color={pendingChallenge.challenger.avatarColor}
            elo={pendingChallenge.challenger.elo}
          />
        </div>

        <Link
          to="/quiz"
          search={{ mode: "battle", opponent: pendingChallenge.challenger.username.toLowerCase() } as any}
          className="mt-7 block"
        >
          <Button variant="live" size="xl" full className="text-xl font-black shadow-[0_5px_0_0_color-mix(in_oklab,var(--accent)_55%,black)]">
            <Swords size={22} /> Accept Battle Duel
          </Button>
        </Link>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {/* Create a Battle Card */}
        <Panel className="flex flex-col justify-between space-y-4">
          <div>
            <div className="label-xs text-primary font-black">Create Custom Battle</div>
            <p className="mt-2 text-sm text-muted-foreground">
              Generate a unique challenge seed and send it on WhatsApp, Discord, or Telegram. Anyone with the link faces your score.
            </p>
          </div>
          <Button full size="lg" onClick={handleCreateChallenge}>
            <Share2 size={16} /> Generate Challenge Link
          </Button>
        </Panel>

        {/* Challenge a Friend Grid */}
        <Panel className="space-y-3">
          <div className="label-xs text-muted-foreground font-black">Challenge a Friend Directly</div>
          <div className="space-y-1">
            {friends.slice(0, 4).map((f) => (
              <div
                key={f.id}
                className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-surface-2 transition-colors"
              >
                <Avatar initials={f.initials} color={f.avatarColor} size={36} online={f.online ?? false} />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-bold text-sm">{f.username}</div>
                  <div className="numeric text-xs text-muted-foreground">{fmt(f.elo)} ELO</div>
                </div>
                <Link
                  to="/quiz"
                  search={{ mode: "battle", opponent: f.username.toLowerCase() } as any}
                >
                  <Button size="sm" variant={f.online ? "primary" : "surface"}>
                    <Swords size={13} /> Duel
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* Recent Battles History */}
      <Panel className="mt-6">
        <div className="label-xs mb-3 text-muted-foreground font-black">Recent Friend Battles History</div>
        <div className="space-y-2 text-sm">
          {recentBattles.map((r, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-xl bg-surface-2/50 px-3.5 py-2.5"
            >
              <div className="flex items-center gap-2">
                <span className="font-bold text-foreground">Duel vs {r.who}</span>
                <span className="label-xs text-muted-foreground font-mono">10 Questions</span>
              </div>
              <span className={`numeric font-bold ${r.tone}`}>{r.res}</span>
            </div>
          ))}
        </div>
      </Panel>

      {/* Share Modal */}
      <Modal open={share} onClose={() => setShare(false)} title="Challenge Link Generated">
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Share this link with any friend. They will play the exact same 10-question seed:
          </p>
          <div className="flex items-center gap-2 rounded-xl border border-primary/40 bg-surface-2 p-3">
            <code className="min-w-0 flex-1 truncate text-xs font-mono text-primary font-bold">
              {challengeLink}
            </code>
            <Button
              size="sm"
              variant="primary"
              onClick={handleCopyLink}
            >
              {copied ? (
                <>
                  <Check size={14} /> Copied!
                </>
              ) : (
                <>
                  <Copy size={14} /> Copy
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </Page>
  );
}

function Side({
  name,
  initials,
  color,
  elo,
}: {
  name: string;
  initials: string;
  color: string;
  elo: number;
}) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <Avatar initials={initials} color={color} size={56} ring />
      <div className="display text-lg font-bold">{name}</div>
      <DivisionBadge elo={elo} size="sm" />
    </div>
  );
}
