import { createFileRoute } from "@tanstack/react-router";
import { Page } from "@/components/AppShell";
import { Button, Panel } from "@/components/kit/primitives";
import { StatTile } from "@/components/kit/game";

export const Route = createFileRoute("/live")({
  head: () => ({
    meta: [
      { title: "Live Show — coming soon | QuizArena" },
      { name: "description", content: "A weekly televised-style live quiz where thousands play the same questions at the same second." },
      { property: "og:title", content: "Live Show — QuizArena" },
      { property: "og:description", content: "Sunday 21:00. One question at a time. Last player standing." },
    ],
  }),
  component: Live,
});

function Live() {
  return (
    <Page title="Live Show" subtitle="Coming soon" wide>
      <div className="stage rounded-3xl border border-danger/40 p-6 sm:p-10">
        <div className="label-xs inline-flex items-center gap-2 rounded-full bg-danger/15 px-3 py-1 text-danger">
          <span className="h-2 w-2 animate-pulse rounded-full bg-danger" /> Preview
        </div>
        <h2 className="display mt-4 text-4xl sm:text-6xl">Sunday, 21:00</h2>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Thousands of players. One question at a time. Miss one and you're out — survive to the end and
          split the prestige pot.
        </p>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="Players expected" value="48K" accent="primary" />
          <StatTile label="Questions" value="15" />
          <StatTile label="Time per Q" value="7s" />
          <StatTile label="Prize" value="Legend badge" accent="gold" />
        </div>

        <Button variant="live" size="xl" className="mt-8" full>
          Notify me when it goes live
        </Button>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {[
          { t: "Sudden death", d: "One wrong answer ends your run. No second chances." },
          { t: "Live crowd", d: "Watch the survivor count crash in real time after each question." },
          { t: "Season finals", d: "Top division players qualify for the monthly televised final." },
        ].map((f) => (
          <Panel key={f.t}>
            <div className="display text-lg">{f.t}</div>
            <p className="mt-2 text-sm text-muted-foreground">{f.d}</p>
          </Panel>
        ))}
      </div>
    </Page>
  );
}
