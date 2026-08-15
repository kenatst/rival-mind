import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import {
  Swords,
  Zap,
  Flame,
  Target,
  Trophy,
  TrendingUp,
  Coins,
  BrainCircuit,
  Building2,
  Users,
  Flag,
  Sparkles,
  ShieldCheck,
  Crown,
  Skull,
  Globe,
  Keyboard,
  Layers,
  Infinity as InfinityIcon,
  ShieldAlert,
  HelpCircle,
  Clock,
} from "lucide-react";
import { Button, Panel, Tabs, Modal } from "@/components/kit/primitives";
import { Page } from "@/components/AppShell";
import { divisionForElo, fmt } from "@/lib/game";
import { gameService } from "@/lib/gameService";
import { GAME_MODES, getModesByFamily } from "@/engine/modes/registry";
import { GameModeDefinition, ModeFamily } from "@/engine/modes/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/play")({
  head: () => ({
    meta: [
      { title: "Play Arena — All Modes | IQ ARENA" },
      {
        name: "description",
        content: "Competitive ranked circuits, 60s lightning, 5s blitz, free answer recall, streak survival, and category towers.",
      },
    ],
  }),
  component: PlayHub,
});

function PlayHub() {
  const navigate = useNavigate();
  const [activeFamily, setActiveFamily] = React.useState<ModeFamily>("compete");
  const [profile, setProfile] = React.useState(() => gameService.getUserProfile());
  const [isCategoryModalOpen, setIsCategoryModalOpen] = React.useState(false);
  const [categoryModalMode, setCategoryModalMode] = React.useState<string>("category-runs");

  React.useEffect(() => {
    return gameService.subscribe(() => {
      setProfile(gameService.getUserProfile());
    });
  }, []);

  const d = divisionForElo(profile.elo);
  const modes = getModesByFamily(activeFamily);

  const categories = [
    { name: "History", icon: "🏛️", desc: "Civilizations, empires & wars" },
    { name: "Geography", icon: "🌍", desc: "Capitals, maps & borders" },
    { name: "Science", icon: "🔬", desc: "Chemistry, physics & discoveries" },
    { name: "Literature", icon: "📚", desc: "Masterpiece novels & authors" },
    { name: "Art", icon: "🎨", desc: "Paintings & sculptures" },
    { name: "Cinema", icon: "🎬", desc: "Iconic films & directors" },
    { name: "Music", icon: "🎵", desc: "Classical & world music" },
    { name: "Technology", icon: "💻", desc: "Inventions & computing" },
    { name: "Nature", icon: "🌿", desc: "Animals & biology" },
    { name: "Food & Culture", icon: "🍷", desc: "Gastronomy & traditions" },
    { name: "Sports", icon: "⚽", desc: "Championships & legends" },
  ];

  const handleOpenCategoryPicker = (modeSlug: string) => {
    setCategoryModalMode(modeSlug);
    setIsCategoryModalOpen(true);
  };

  const getModeIcon = (iconName: string) => {
    switch (iconName) {
      case "Swords": return <Swords size={20} />;
      case "Zap": return <Zap size={20} />;
      case "Keyboard": return <Keyboard size={20} />;
      case "Trophy": return <Trophy size={20} />;
      case "ShieldCheck": return <ShieldCheck size={20} />;
      case "Crown": return <Crown size={20} />;
      case "Skull": return <Skull size={20} />;
      case "Globe": return <Globe size={20} />;
      case "Flame": return <Flame size={20} />;
      case "Target": return <Target size={20} />;
      case "Coins": return <Coins size={20} />;
      case "TrendingUp": return <TrendingUp size={20} />;
      case "Sparkles": return <Sparkles size={20} />;
      case "HelpCircle": return <HelpCircle size={20} />;
      case "Infinity": return <InfinityIcon size={20} />;
      case "BrainCircuit": return <BrainCircuit size={20} />;
      case "Layers": return <Layers size={20} />;
      case "Building2": return <Building2 size={20} />;
      case "ShieldAlert": return <ShieldAlert size={20} />;
      case "Users": return <Users size={20} />;
      case "Flag": return <Flag size={20} />;
      default: return <Swords size={20} />;
    }
  };

  return (
    <Page
      title="Play Hub"
      subtitle="4 Sacred Families · 20+ High-Stakes Competitive & Quick Modes"
      wide
    >
      {/* Featured Ranked Arena Card */}
      <Link to="/matchmaking" className="block mb-6">
        <div className="stage group relative overflow-hidden rounded-3xl border-2 border-gold/50 p-6 sm:p-8 transition-transform active:scale-[0.99] shadow-[var(--shadow-lift)]">
          <div className="label-xs text-gold flex items-center gap-1.5 font-black">
            <Sparkles size={14} /> Official Ranked Circuit · Arena Rating
          </div>
          <h2 className="display mt-2 text-4xl sm:text-6xl font-black">Ranked 1v1 Arena</h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Head-to-head live duel, 8 identical questions, 10s per round, server-authoritative Elo on the line.
          </p>
          <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="label-xs text-muted-foreground font-bold">Your Rating</div>
              <div className="numeric text-4xl sm:text-5xl font-black text-gold">
                {fmt(profile.elo)} ELO
              </div>
              <div className="label-xs mt-0.5 font-bold" style={{ color: d.color }}>
                {d.label}
              </div>
            </div>
            <Button size="lg" variant="prestige" className="font-black shadow-[0_5px_0_0_oklch(0.55_0.13_60)]">
              <Swords size={20} /> Play Ranked Classic
            </Button>
          </div>
        </div>
      </Link>

      {/* Mode Families Tab Selector */}
      <div className="mb-6">
        <Tabs
          value={activeFamily}
          onChange={(val) => setActiveFamily(val as ModeFamily)}
          tabs={[
            { id: "compete", label: "⚔️ Compete (Prestige)" },
            { id: "quick", label: "⚡ Quick (Arcade & PBs)" },
            { id: "train", label: "🧠 Train (Skill Mastery)" },
            { id: "social", label: "👥 Social (Battles & Wars)" },
          ]}
        />
      </div>

      {/* Grid of Mode Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modes.map((mode) => {
          const isCategoryMode = mode.slug === "category-runs" || mode.slug === "category-tower";
          const isClassicRanked = mode.slug === "ranked-classic";
          const isFriendBattle = mode.slug === "friend-battle";
          const isRivalry = mode.slug === "rivalries";

          let targetUrl = `/modes/${mode.slug}`;
          if (isClassicRanked) targetUrl = "/matchmaking";
          else if (isFriendBattle || isRivalry) targetUrl = "/battles";

          const cardContent = (
            <Panel
              className={cn(
                "h-full p-5 flex flex-col justify-between transition-all border group cursor-pointer hover:border-primary/60 active:scale-[0.99]",
                mode.ranked && "border-gold/30 bg-gold/5",
              )}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div
                    className="p-2 rounded-xl text-foreground font-black"
                    style={{ color: mode.accentColor, backgroundColor: "var(--surface-2)" }}
                  >
                    {getModeIcon(mode.iconName)}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="label-xs rounded bg-surface-2 text-muted-foreground px-2 py-0.5 font-mono">
                      <Clock size={11} className="inline mr-1" />
                      {mode.estimatedDuration}
                    </span>
                    {mode.ranked ? (
                      <span className="label-xs rounded bg-gold/20 text-gold border border-gold/40 px-2 py-0.5 font-black">
                        Ranked
                      </span>
                    ) : (
                      <span className="label-xs rounded bg-surface-2 text-muted-foreground px-2 py-0.5 font-bold">
                        Arcade
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="display text-xl font-black text-foreground group-hover:text-primary transition-colors">
                  {mode.displayName}
                </h3>
                <div className="label-xs text-primary font-bold mt-0.5">{mode.shortTagline}</div>
                <p className="mt-2 text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                  {mode.description}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-border flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground">
                  {mode.badgeLabel || "Play Mode"}
                </span>
                <span className="text-xs font-black text-primary group-hover:translate-x-1 transition-transform flex items-center gap-1">
                  Start →
                </span>
              </div>
            </Panel>
          );

          if (isCategoryMode) {
            return (
              <div key={mode.id} onClick={() => handleOpenCategoryPicker(mode.slug)}>
                {cardContent}
              </div>
            );
          }

          return (
            <Link key={mode.id} to={targetUrl as any}>
              {cardContent}
            </Link>
          );
        })}
      </div>

      {/* Category Picker Modal */}
      {isCategoryModalOpen && (
        <Modal
          title={categoryModalMode === "category-tower" ? "Select Category Tower" : "Select Category Sprint"}
          isOpen={isCategoryModalOpen}
          onClose={() => setIsCategoryModalOpen(false)}
        >
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Choose the knowledge domain you want to master:
            </p>

            <div className="grid gap-2 sm:grid-cols-2 max-h-[360px] overflow-y-auto pr-1">
              {categories.map((c) => (
                <button
                  key={c.name}
                  onClick={() => {
                    setIsCategoryModalOpen(false);
                    navigate({
                      to: `/modes/${categoryModalMode}` as any,
                      search: { category: c.name } as any,
                    });
                  }}
                  className="flex items-center gap-3 p-3 rounded-2xl border border-border bg-surface text-left hover:border-primary hover:bg-surface-2 transition-all active:scale-95"
                >
                  <span className="text-2xl">{c.icon}</span>
                  <div>
                    <div className="font-bold text-sm text-foreground">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{c.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </Page>
  );
}
