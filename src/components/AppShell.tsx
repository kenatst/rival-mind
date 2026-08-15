import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  Bell,
  Home,
  Swords,
  Trophy,
  Users,
  Globe2,
  User,
  Volume2,
  VolumeX,
  Sparkles,
  Sliders,
  RotateCcw,
  Flame,
  Check,
} from "lucide-react";
import { ReactNode, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { notifications } from "@/data/mock";
import { Avatar, DivisionBadge } from "@/components/kit/badges";
import { fmt, divisionForElo } from "@/lib/game";
import { soundService } from "@/lib/soundService";
import { gameService } from "@/lib/gameService";
import { Modal } from "@/components/kit/primitives";

const NAV = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/play", label: "Play", icon: Swords },
  { to: "/battles", label: "Battles", icon: Users },
  { to: "/leagues", label: "Leagues", icon: Trophy },
  { to: "/rankings", label: "Rankings", icon: Globe2 },
  { to: "/profile", label: "Profile", icon: User },
] as const;

/** Routes that run fullscreen gameplay without navigation chrome. */
const IMMERSIVE = ["/", "/quiz", "/result", "/matchmaking", "/match", "/match-result"];

export function useImmersive() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return IMMERSIVE.includes(pathname);
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link to="/" className={cn("display flex items-center gap-2 text-xl", className)}>
      <span className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground font-black">
        Q
      </span>
      <span>
        QUIZ<span className="text-primary">ARENA</span>
      </span>
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [profile, setProfile] = useState(() => gameService.getUserProfile());
  const [isMuted, setIsMuted] = useState(() => soundService.getIsMuted());
  const [isDebugOpen, setIsDebugOpen] = useState(false);
  const [customElo, setCustomElo] = useState(profile.elo);

  useEffect(() => {
    return gameService.subscribe(() => {
      const p = gameService.getUserProfile();
      setProfile(p);
      setCustomElo(p.elo);
    });
  }, []);

  const unread = notifications.filter((n) => n.unread).length;

  const handleToggleSound = () => {
    const muted = soundService.toggleMute();
    setIsMuted(muted);
  };

  const handleSetEloPreset = (elo: number) => {
    gameService.updateElo(elo);
    setCustomElo(elo);
  };

  const handleApplyElo = () => {
    gameService.updateElo(Number(customElo));
  };

  return (
    <div className="min-h-screen bg-background text-foreground" onClick={() => soundService.initOnGesture()}>
      {/* Desktop sidebar rail */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[15rem] flex-col border-r border-border bg-surface/80 px-4 py-6 backdrop-blur lg:flex">
        <Logo className="mb-6 px-2" />

        {/* Season 1 Badge in sidebar */}
        <div className="mb-4 rounded-xl border border-primary/30 bg-primary/10 p-2.5 text-xs">
          <div className="label-xs flex items-center gap-1.5 text-primary">
            <Sparkles size={13} /> Season 1 · Genesis
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground font-mono">
            38 days remaining
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "label-xs flex items-center gap-3 rounded-xl px-3 py-3 transition-colors",
                  active
                    ? "bg-primary text-primary-foreground font-black"
                    : "text-muted-foreground hover:bg-surface-2 hover:text-foreground",
                )}
              >
                <Icon size={18} strokeWidth={2.5} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Controls footer */}
        <div className="space-y-2 pt-3 border-t border-border">
          <div className="flex items-center justify-between px-2">
            <button
              onClick={handleToggleSound}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
              title={isMuted ? "Unmute Sound" : "Mute Sound"}
            >
              {isMuted ? <VolumeX size={16} className="text-danger" /> : <Volume2 size={16} className="text-primary" />}
              <span className="label-xs">{isMuted ? "Muted" : "Audio On"}</span>
            </button>

            <button
              onClick={() => setIsDebugOpen(true)}
              className="label-xs rounded-lg border border-border bg-surface px-2 py-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors flex items-center gap-1"
            >
              <Sliders size={12} /> Debug
            </button>
          </div>

          <Link
            to="/notifications"
            className="label-xs flex items-center gap-3 rounded-xl px-3 py-2.5 text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
          >
            <span className="relative">
              <Bell size={18} strokeWidth={2.5} />
              {unread > 0 && (
                <span className="absolute -right-1.5 -top-1.5 grid h-4 w-4 place-items-center rounded-full bg-accent text-[0.5rem] font-bold text-accent-foreground">
                  {unread}
                </span>
              )}
            </span>
            Alerts
          </Link>

          <Link
            to="/profile"
            className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-2.5 hover:border-border-strong transition-colors"
          >
            <Avatar initials={profile.initials} color={profile.avatarColor} size={36} />
            <div className="min-w-0">
              <div className="display truncate text-sm">{profile.username}</div>
              <div className="numeric text-xs text-gold font-bold">{fmt(profile.elo)} ELO</div>
            </div>
          </Link>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur lg:hidden">
        <Logo className="text-base" />
        <div className="flex items-center gap-2">
          <DivisionBadge elo={profile.elo} size="sm" />
          <button
            onClick={handleToggleSound}
            className="p-2 text-muted-foreground hover:text-foreground"
          >
            {isMuted ? <VolumeX size={17} className="text-danger" /> : <Volume2 size={17} className="text-primary" />}
          </button>
          <button
            onClick={() => setIsDebugOpen(true)}
            className="label-xs rounded-md border border-border bg-surface px-1.5 py-1 text-[10px] text-muted-foreground"
          >
            DEV
          </button>
          <Link to="/notifications" className="relative rounded-lg p-2 text-muted-foreground">
            <Bell size={18} strokeWidth={2.5} />
            {unread > 0 && (
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-accent" />
            )}
          </Link>
        </div>
      </header>

      <main className="pb-24 lg:pb-10 lg:pl-[15rem]">{children}</main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-6 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        {NAV.map(({ to, label, icon: Icon }) => {
          const active = pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex flex-col items-center gap-1 py-2.5 transition-colors",
                active ? "text-primary font-black" : "text-muted-foreground",
              )}
            >
              <Icon size={20} strokeWidth={2.5} />
              <span className="text-[0.5625rem] font-extrabold uppercase tracking-wider">
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Dev Debug Panel Modal */}
      <Modal open={isDebugOpen} onClose={() => setIsDebugOpen(false)} title="Developer Debug Panel">
        <div className="space-y-4 text-xs">
          <div>
            <div className="label-xs mb-1.5 text-muted-foreground">Modify ELO Rating ({customElo} ELO)</div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="400"
                max="2800"
                step="25"
                value={customElo}
                onChange={(e) => setCustomElo(Number(e.target.value))}
                className="flex-1 accent-primary"
              />
              <button
                onClick={handleApplyElo}
                className="label-xs rounded-lg bg-primary px-3 py-1.5 text-primary-foreground font-black"
              >
                Apply
              </button>
            </div>
          </div>

          <div>
            <div className="label-xs mb-1 text-muted-foreground">Division Milestones Presets</div>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { label: "Rookie 720", elo: 720 },
                { label: "Bronze II 910", elo: 910 },
                { label: "Silver II 1120", elo: 1120 },
                { label: "Gold II 1310", elo: 1310 },
                { label: "Platinum 1520", elo: 1520 },
                { label: "Diamond III 1657", elo: 1657 },
                { label: "Diamond I Promo 1795", elo: 1795 },
                { label: "Master 1920", elo: 1920 },
                { label: "Grandmaster 2110", elo: 2110 },
                { label: "Legend 2450", elo: 2450 },
              ].map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => handleSetEloPreset(preset.elo)}
                  className="rounded-lg border border-border bg-surface px-2 py-1 text-[11px] hover:border-primary hover:text-primary transition-colors text-left"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="label-xs mb-1 text-muted-foreground">Quick Action Triggers</div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setIsDebugOpen(false);
                  navigate({ to: "/matchmaking" });
                }}
                className="rounded-lg border border-border bg-surface p-2 text-left hover:border-primary transition-colors"
              >
                ⚔️ Start Matchmaking
              </button>

              <button
                onClick={() => {
                  setIsDebugOpen(false);
                  navigate({ to: "/match-result" });
                }}
                className="rounded-lg border border-border bg-surface p-2 text-left hover:border-primary transition-colors"
              >
                🏆 Test Victory Screen
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-border flex items-center justify-between">
            <button
              onClick={() => {
                gameService.resetAll();
                soundService.playTap();
                setIsDebugOpen(false);
              }}
              className="label-xs flex items-center gap-1 text-danger hover:underline"
            >
              <RotateCcw size={12} /> Reset to Defaults (1657 ELO)
            </button>

            <button
              onClick={() => setIsDebugOpen(false)}
              className="label-xs rounded-lg bg-surface-2 px-3 py-1.5 text-foreground"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export function Page({
  title,
  subtitle,
  children,
  action,
  wide,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={cn("mx-auto w-full px-4 py-6 sm:px-6 lg:py-10", wide ? "max-w-6xl" : "max-w-4xl")}>
      <div className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
        <div className="min-w-0">
          <h1 className="display text-3xl sm:text-5xl">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}
