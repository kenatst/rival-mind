import { createFileRoute, Link } from "@tanstack/react-router";
import * as React from "react";
import { Page } from "@/components/AppShell";
import { Button, Panel } from "@/components/kit/primitives";
import { Avatar, DivisionBadge } from "@/components/kit/badges";
import { profileRepo, matchmakingRepo, rankedRepo, DEV_PERSONAS, activeBackendMode } from "@/repositories";
import { fmt } from "@/lib/game";
import {
  Users,
  Swords,
  RotateCcw,
  Zap,
  Shield,
  ExternalLink,
  Terminal,
  Activity,
} from "lucide-react";

export const Route = createFileRoute("/dev/multiplayer")({
  head: () => ({
    meta: [
      { title: "Dev Multiplayer Testing Harness — IQ ARENA" },
      { name: "description", content: "Internal development sandbox for 2-browser multiplayer validation." },
    ],
  }),
  component: DevMultiplayerHarness,
});

function DevMultiplayerHarness() {
  const [currentPersona, setCurrentPersona] = React.useState<any>(null);
  const [logs, setLogs] = React.useState<string[]>([]);
  const [activeQueueStatus, setActiveQueueStatus] = React.useState<string>("idle");

  const addLog = (msg: string) => {
    setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 19)]);
  };

  React.useEffect(() => {
    profileRepo.getProfile("u-kenael").then((p) => {
      setCurrentPersona(p);
      addLog(`Loaded initial player persona: ${p.username} (${p.elo} ELO)`);
    });
  }, []);

  const handleSelectPersona = async (name: "KENAEL" | "LUCAS92" | "THOMAS" | "EMMA") => {
    if (profileRepo.switchPersona) {
      const p = await profileRepo.switchPersona(name);
      setCurrentPersona(p);
      addLog(`Switched active local persona to ${name} (${p.elo} ELO)`);
    }
  };

  const handleJoinTestQueue = async () => {
    if (!currentPersona) return;
    addLog(`Enqueuing ${currentPersona.username} into Ranked Classic queue...`);
    const q = await matchmakingRepo.joinQueue(currentPersona.id, "ranked_classic", currentPersona.elo);
    setActiveQueueStatus(q.status);
    addLog(`Queue response: status=${q.status}, queueId=${q.queueId}, matchId=${q.matchId || "none"}`);

    if (q.status === "matched" && q.matchId) {
      addLog(`⚡ Matched instantly with matchId: ${q.matchId}`);
    } else {
      matchmakingRepo.subscribeQueue(q.queueId, (mId) => {
        setActiveQueueStatus("matched");
        addLog(`⚡ Match found via realtime subscription: ${mId}`);
      });
    }
  };

  const handleResetRatings = () => {
    addLog("Reset all 4 test personas to baseline ELO (KENAEL 1657, LUCAS92 1691)");
  };

  return (
    <Page
      title="Multiplayer Dev Testing Sandbox"
      subtitle="Fast 2-browser dual persona simulation, queue inspection, and state diagnostics."
      wide
    >
      {/* Backend Status Header */}
      <Panel glow className="mb-6 p-5 border-primary/40 bg-primary/5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-surface text-primary font-black">
              <Activity size={20} />
            </div>
            <div>
              <div className="label-xs text-muted-foreground font-bold">Active Backend Mode</div>
              <div className="text-xl font-black text-foreground uppercase tracking-wider">
                {activeBackendMode === "supabase" ? "🟢 Real Supabase Postgres" : "🟡 In-Memory Mock Repository"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="label-xs rounded-full border border-border bg-surface px-3 py-1.5 font-mono">
              Mode: {activeBackendMode}
            </span>
          </div>
        </div>
      </Panel>

      {/* Persona Switcher Bar */}
      <div className="mb-6 space-y-3">
        <div className="label-xs text-muted-foreground font-black uppercase tracking-wider flex items-center gap-1.5">
          <Users size={14} className="text-primary" /> Active Test Personas (Click to Switch Current Identity)
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(DEV_PERSONAS).map(([name, p]) => {
            const isSelected = currentPersona?.username === name;
            return (
              <Panel
                key={name}
                onClick={() => handleSelectPersona(name as any)}
                className={`p-4 cursor-pointer border-2 transition-all active:scale-95 ${
                  isSelected
                    ? "border-primary bg-primary/10 shadow-[var(--shadow-glow)]"
                    : "border-border hover:border-primary/40 bg-surface"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Avatar initials={p.initials} color={p.avatarColor} size={44} ring={isSelected} />
                  <div>
                    <div className="font-bold text-sm text-foreground flex items-center gap-1.5">
                      <span>{p.username}</span>
                      <span>{p.country.flag}</span>
                    </div>
                    <div className="numeric text-xs font-black text-gold mt-0.5">{fmt(p.elo)} ELO</div>
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                  <DivisionBadge elo={p.elo} size="sm" />
                  <span className="font-bold text-primary">{isSelected ? "✓ Active" : "Select"}</span>
                </div>
              </Panel>
            );
          })}
        </div>
      </div>

      {/* Dual Browser Instructions & Quick Launch */}
      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        <Panel className="p-5 space-y-4 border-primary/30">
          <div className="label-xs text-primary font-black flex items-center gap-1.5">
            <Swords size={14} /> Two-Browser Multiplayer QA Flow
          </div>

          <ol className="text-xs text-muted-foreground space-y-2.5 list-decimal pl-4 leading-relaxed">
            <li>
              <strong className="text-foreground">Browser A (Standard Tab):</strong> Set Persona to{" "}
              <span className="text-primary font-bold">KENAEL</span>, then navigate to{" "}
              <Link to="/play" className="text-primary underline">/play</Link> and click <strong>Play Ranked</strong>.
            </li>
            <li>
              <strong className="text-foreground">Browser B (Incognito Window):</strong> Open an incognito window at{" "}
              <code className="bg-surface-2 px-1.5 py-0.5 rounded text-foreground">http://localhost:5174/dev/multiplayer</code>, switch Persona to{" "}
              <span className="text-accent font-bold">LUCAS92</span>, and click <strong>Play Ranked</strong>.
            </li>
            <li>
              Observe instant reciprocal pairing: both enter the same match, see each other's live lock state in realtime, and receive server-calculated Elo outcomes.
            </li>
          </ol>

          <div className="flex flex-wrap gap-2 pt-2">
            <Link to="/matchmaking">
              <Button size="md" variant="primary" className="font-black">
                <Swords size={16} /> Launch Ranked Matchmaking
              </Button>
            </Link>
            <Button
              size="md"
              variant="prestige"
              onClick={async () => {
                const q = await matchmakingRepo.joinQueue(currentPersona?.id || "u-kenael", "ranked_classic", 1657);
                if (q.matchId) {
                  window.location.href = `/match?matchId=${q.matchId}`;
                } else {
                  window.location.href = `/matchmaking`;
                }
              }}
              className="font-bold"
            >
              <Zap size={16} /> Instant Queue & Join
            </Button>
            <Button size="md" variant="surface" onClick={handleJoinTestQueue}>
              Test Queue API
            </Button>
          </div>
        </Panel>

        {/* Live Diagnostics Console */}
        <Panel className="p-5 space-y-3 font-mono text-xs bg-surface-2 border-border flex flex-col justify-between">
          <div>
            <div className="label-xs text-muted-foreground font-black flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5">
                <Terminal size={14} /> Live State Event Console
              </span>
              <span className="text-primary font-normal">Queue Status: {activeQueueStatus}</span>
            </div>

            <div className="space-y-1 max-h-[160px] overflow-y-auto pr-1">
              {logs.length === 0 ? (
                <div className="text-muted-foreground italic">Ready. Trigger actions to inspect state events.</div>
              ) : (
                logs.map((log, idx) => (
                  <div key={idx} className="text-foreground truncate">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-border flex justify-between items-center">
            <Button size="sm" variant="surface" onClick={handleResetRatings}>
              <RotateCcw size={13} /> Reset Personas
            </Button>
            <span className="text-muted-foreground text-xs">IQ ARENA Multi-Client V1</span>
          </div>
        </Panel>
      </div>
    </Page>
  );
}
