import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { QuizEngine } from "@/components/QuizEngine";
import { questions } from "@/data/mock";
import { setLastRun } from "@/lib/session";
import type { MatchMode } from "@/lib/types";
import { z } from "zod";

export interface QuizSearch {
  mode?: MatchMode | undefined;
  category?: string | undefined;
  opponent?: string | undefined;
}

export const Route = createFileRoute("/quiz")({
  validateSearch: (search: Record<string, unknown>): QuizSearch => {
    return {
      mode: (search["mode"] as MatchMode) || "guest",
      category: search["category"] ? String(search["category"]) : undefined,
      opponent: search["opponent"] ? String(search["opponent"]) : undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "Quiz Arena — IQ ARENA" },
      {
        name: "description",
        content: "Ten general knowledge questions to estimate your world ELO. No account needed.",
      },
      { property: "og:title", content: "Play Quiz — IQ ARENA" },
      { property: "og:description", content: "Test your general knowledge and climb the ranking." },
    ],
  }),
  component: QuizScreen,
});

function QuizScreen() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const mode = (search.mode || "guest") as MatchMode;

  return (
    <QuizEngine
      questions={questions}
      mode={mode}
      categoryName={search.category}
      opponentName={search.opponent}
      exitTo={mode === "guest" ? "/" : "/play"}
      onFinish={(score) => {
        if (mode === "guest") {
          setLastRun({ score, total: 10 });
          navigate({ to: "/result" });
        } else if (mode === "daily") {
          navigate({ to: "/daily" });
        } else {
          navigate({ to: "/play" });
        }
      }}
    />
  );
}
