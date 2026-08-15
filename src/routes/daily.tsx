import { createFileRoute } from "@tanstack/react-router";
import { Page } from "@/components/AppShell";
import { QuizEngine } from "@/components/QuizEngine";
import { useNavigate } from "@tanstack/react-router";
import { questions } from "@/data/mock";

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
  const navigate = useNavigate();
  return (
    <Page title="Daily 12" subtitle="Same 12 questions for every player today." >
      <QuizEngine questions={questions.slice(0, 12)} onFinish={() => navigate({ to: "/home" })} />
    </Page>
  );
}
