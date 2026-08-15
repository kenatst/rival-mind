import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { QuizEngine } from "@/components/QuizEngine";
import { questions } from "@/data/mock";

export const Route = createFileRoute("/quiz")({
  head: () => ({
    meta: [
      { title: "Play now — QuizArena" },
      {
        name: "description",
        content: "Ten general knowledge questions to estimate your world ELO. No account needed.",
      },
      { property: "og:title", content: "Play now — QuizArena" },
      { property: "og:description", content: "Ten questions to estimate your world knowledge ELO." },
    ],
  }),
  component: GuestQuiz,
});

function GuestQuiz() {
  const navigate = useNavigate();
  return (
    <QuizEngine
      questions={questions.slice(0, 10)}
      exitTo="/"
      onFinish={(score) => navigate({ to: "/result", search: { score } })}
    />
  );
}
