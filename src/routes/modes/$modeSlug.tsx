import { createFileRoute, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { UnifiedModeRunner } from "@/components/UnifiedModeRunner";
import { getModeBySlug } from "@/engine/modes/registry";

export interface ModeSearch {
  category?: string | undefined;
}

export const Route = createFileRoute("/modes/$modeSlug")({
  validateSearch: (search: Record<string, unknown>): ModeSearch => {
    return {
      category: search["category"] ? String(search["category"]) : undefined,
    };
  },
  head: ({ params }) => {
    const mode = getModeBySlug(params.modeSlug);
    return {
      meta: [
        { title: `${mode ? mode.displayName : "Game Mode"} — IQ ARENA` },
        { name: "description", content: mode ? mode.description : "Competitive knowledge game mode." },
      ],
    };
  },
  component: ModeScreen,
});

function ModeScreen() {
  const { modeSlug } = Route.useParams();
  const search = Route.useSearch();

  return (
    <UnifiedModeRunner
      modeSlug={modeSlug}
      category={search.category}
      onExit="/play"
    />
  );
}
