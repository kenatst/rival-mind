import { createFileRoute, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { Page } from "@/components/AppShell";
import { QuizEngine } from "@/components/QuizEngine";
import { Button, Panel, Modal } from "@/components/kit/primitives";
import { Avatar } from "@/components/kit/badges";
import { questions, dailyChallenge } from "@/data/mock";
import { fmt, playCue } from "@/lib/game";
import { Share2, Calendar, Check, Copy, Sparkles, Trophy } from "lucide-react";
import confetti from "canvas-confetti";

export const Route = createFileRoute("/daily")({
  head: () => ({
    meta: [
      { title: "Daily 12 — QuizArena" },
      { name: "description", content: "Twelve questions. Same for everyone, every day. Keep your streak alive." },
      { property: "og:title", content: "Daily 12 — QuizArena" },
      { property: "og:description", content: "One shot a day. Keep the streak." },
    ],
  }),
  component: DailyScreen,
});

function DailyScreen() {
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isCompleted, setIsCompleted] = React.useState(true);
  const [score, setScore] = React.useState(11);
  const [isShareModalOpen, setIsShareModalOpen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const daily = dailyChallenge;

  const shareSnippet = `⚡ QUIZARENA DAILY 12 (Aug 15)
Score: ${score} / 12 (TOP 2.8% Worldwide)
🇫🇷 France #8,421
🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩🟥
Play today: https://quizarena.gg/daily`;

  const handleFinish = (finalScore: number) => {
    setScore(finalScore);
    setIsPlaying(false);
    setIsCompleted(true);
    playCue("daily-perfect");
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#76FF03", "#FFD600", "#00E5FF"],
      });
    } catch {
      // safe
    }
  };

  const handleCopySnippet = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isPlaying) {
    return (
      <QuizEngine
        questions={questions.slice(0, 12)}
        exitTo="/home"
        onFinish={handleFinish}
      />
    );
  }

  return (
    <Page
      title="Daily 12"
      subtitle={`${daily.date} · Exactly 12 curated questions. One official worldwide attempt per day.`}
      wide
      action={
        <span className="label-xs rounded-full border border-gold/40 bg-gold/10 px-3 py-1.5 text-gold font-bold">
          {daily.hoursRemaining}h remaining until reset
        </span>
      }
    >
      {isCompleted ? (
        <div className="space-y-6">
          {/* Performance Highlight Tiles */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Panel glow className="text-center p-6 space-y-1">
              <div className="label-xs text-muted-foreground font-black">Your Score</div>
              <div className="numeric text-5xl sm:text-6xl text-primary font-black">
                {score} <span className="text-2xl text-muted-foreground font-normal">/ 12</span>
              </div>
              <div className="label-xs text-success font-bold mt-1">91.7% Accuracy</div>
            </Panel>

            <Panel className="text-center p-6 space-y-1 border-gold/40">
              <div className="label-xs text-muted-foreground font-black">Global Standing</div>
              <div className="numeric text-5xl sm:text-6xl text-gold font-black">
                TOP 2.8%
              </div>
              <div className="label-xs text-muted-foreground font-mono mt-1">Ahead of 97.2% of players</div>
            </Panel>

            <Panel className="text-center p-6 space-y-1 border-accent/40">
              <div className="label-xs text-muted-foreground font-black">France Standing</div>
              <div className="numeric text-5xl sm:text-6xl text-foreground font-black">
                #{fmt(daily.countryRank)}
              </div>
              <div className="label-xs text-muted-foreground font-mono mt-1">Out of 114,500 entries</div>
            </Panel>
          </div>

          {/* Performance Map */}
          <Panel className="p-6 text-center space-y-3">
            <div className="label-xs text-muted-foreground font-black">
              12 Questions Performance Map
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 max-w-md mx-auto">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center numeric text-sm font-black border-2 transition-transform hover:scale-105 ${
                    i === 11
                      ? "border-danger bg-danger/20 text-danger"
                      : "border-success bg-success/20 text-success"
                  }`}
                >
                  {i + 1}
                </div>
              ))}
            </div>
          </Panel>

          {/* Friends Daily Leaderboard */}
          <Panel className="p-5 space-y-3">
            <div className="label-xs flex items-center justify-between text-muted-foreground font-black">
              <span>Friends Daily Rank</span>
              <span>Score</span>
            </div>

            <div className="space-y-1.5">
              {daily.friends.map((f, idx) => {
                const isMe = f.player.username.includes("YOU");
                return (
                  <div
                    key={f.player.id}
                    className={`flex items-center justify-between rounded-xl px-3 py-2.5 transition-colors ${
                      isMe ? "bg-primary/10 border border-primary/40 font-bold" : "bg-surface-2/40"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="numeric text-base font-bold text-muted-foreground w-6">
                        #{idx + 1}
                      </span>
                      <Avatar initials={f.player.initials} color={f.player.avatarColor} size={34} />
                      <span className="display text-sm font-bold text-foreground">
                        {f.player.username}
                      </span>
                    </div>
                    <span className="numeric text-xl text-gold font-black">{f.score} / 12</span>
                  </div>
                );
              })}
            </div>
          </Panel>

          {/* Share Action */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              size="xl"
              full
              variant="primary"
              onClick={() => setIsShareModalOpen(true)}
              className="shadow-[0_6px_0_0_color-mix(in_oklab,var(--primary)_55%,black)]"
            >
              <Share2 size={20} /> Share Daily Result
            </Button>
            <Button size="xl" variant="surface" onClick={() => setIsPlaying(true)}>
              Play Again (Practice)
            </Button>
          </div>
        </div>
      ) : (
        <Panel className="text-center p-8 space-y-6">
          <div className="grid h-16 w-16 mx-auto place-items-center rounded-2xl bg-gold/20 text-gold text-3xl">
            🎯
          </div>
          <div>
            <h2 className="display text-3xl sm:text-4xl">Ready for Today's 12?</h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
              Same 12 questions for all players globally today. Score high to earn bonus XP and climb France's ranking.
            </p>
          </div>
          <Button size="xl" variant="primary" onClick={() => setIsPlaying(true)}>
            Start Daily 12
          </Button>
        </Panel>
      )}

      {/* Share Modal */}
      <Modal open={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} title="Share Daily 12">
        <div className="space-y-4 text-center">
          <pre className="rounded-xl border border-primary/40 bg-surface-2 p-4 text-left font-mono text-xs text-primary whitespace-pre-wrap">
            {shareSnippet}
          </pre>

          <Button full onClick={handleCopySnippet} variant="primary">
            {copied ? (
              <>
                <Check size={18} /> Copied to Clipboard!
              </>
            ) : (
              <>
                <Copy size={18} /> Copy Share Snippet
              </>
            )}
          </Button>
        </div>
      </Modal>
    </Page>
  );
}
