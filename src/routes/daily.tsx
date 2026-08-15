import { createFileRoute } from "@tanstack/react-router";
import { Page } from "@/components/AppShell";
import { QuizEngine } from "@/components/QuizEngine";
import { questionBank } from "@/data/mock";

export const Route = createFileRoute("/daily")({
  head: () => ({
    meta: [
      { title: "Daily 12 — QuizArena" },
      { name: "description", content: "Twelve questions. Same for everyone, every day. Keep your streak alive." },
      { property: "og:title", content: "Daily 12 — QuizArena" },
      { property: "og:description", content: "One shot a day. Keep the streak." },
    ],
  }),
  component: Daily,
});

function Daily() {
  return (
    <Page title="Daily 12" subtitle="Same 12 questions for every player today." >
      <QuizEngine questions={questionBank.slice(0, 12)} mode="daily" />
    </Page>
  );
}
