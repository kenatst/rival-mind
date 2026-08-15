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
  Shield,
  LogIn,
  Check,
} from "lucide-react";
import { ReactNode, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Avatar, DivisionBadge } from "@/components/kit/badges";
import { fmt, divisionForElo } from "@/lib/game";
import { soundService } from "@/lib/soundService";
import { gameService } from "@/lib/gameService";
import { authService, AuthState } from "@/services/authService";
import { AuthModal } from "@/components/AuthModal";
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
    <Link to="/" className={cn("display flex items-center gap-2 text-xl tracking-tight select-none", className)}>
      <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-primary-foreground font-black text-sm shadow-[0_2px_0_0_color-mix(in_oklab,var(--primary)_55%,black)]">
        IQ
      </span>
      <span className="font-black text-foreground">
        IQ <span className="text-primary">ARENA</span>
      </span>
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [profile, setProfile] = useState(() => gameService.getUserProfile());
  const [daily, setDaily] = useState(() => gameService.getDailyChallenge());
  const [notifications, setNotifications] = useState(() => gameService.getNotifications());
  const [isMuted, setIsMuted] = useState(() => soundService.getIsMuted());
  const [isDebugOpen, setIsDebugOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [customElo, setCustomElo] = useState(profile.elo);
  const [auth, setAuth] = useState<AuthState>(() => authService.getAuthState());

  useEffect(() => {
    const un1 = gameService.subscribe(() => {
      const p = gameService.getUserProfile();
      setProfile(p);
      setDaily(gameService.getDailyChallenge());
      setNotifications(gameService.getNotifications());
      setCustomElo(p.elo);
    });

    const un2 = authService.subscribe(() => {
      setAuth(authService.getAuthState());
    });

    return () => {
      un1();
      un2();
    };
  }, []);

  const unread = notifications.filter((n) => n.unread).length;
  const isDev = Boolean(import.meta.env?.DEV);

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

  const handleToggleDailyCompleted = () => {
    gameService.setDailyCompleted(!daily.completed, 11);
  };

  return (
    <div
      className="min-h-screen bg-background text-foreground select-none"
      onClick={() => soundService.initOnGesture()}
    >
      {/* Desktop sidebar rail */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[15rem] flex-col border-r border-border bg-surface/85 px-4 py-6 backdrop-blur lg:flex">
        <Logo className="mb-6 px-2" />

        {/* Season 1 Badge in sidebar */}
        <div className="mb-4 rounded-2xl border border-primary/30 bg-primary/10 p-3 text-xs">
          <div className="label-xs flex items-center gap-1.5 text-primary font-black">
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
                    ? "bg-primary text-primary-foreground font-black shadow-[0_3px_0_0_color-mix(in_oklab,var(--primary)_55%,black)]"
                    : "text-muted-foreground hover:bg-surface-2 hover:text-foreground",
                )}
              >
                <Icon size={18} strokeWidth={2.5} />
                {label}
              </Link>
            );
          })}

          {/* Admin Question Center in sidebar */}
          {auth.isAdmin && (
            <Link
              to="/admin/questions"
              className={cn(
                "label-xs flex items-center gap-3 rounded-xl px-3 py-3 mt-2 border border-gold/40 transition-colors",
                pathname.startsWith("/admin")
                  ? "bg-gold text-primary-foreground font-black"
                  : "text-gold hover:bg-gold/15",
              )}
            >
              <Shield size={18} strokeWidth={2.5} />
              Admin Center
            </Link>
          )}
        </nav>

        {/* Controls footer */}
        <div className="space-y-2 pt-3 border-t border-border">
          <div className="flex items-center justify-between px-2">
            <button
              onClick={handleToggleSound}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
              title={isMuted ? "Unmute Audio" : "Mute Audio"}
            >
              {isMuted ? <VolumeX size={16} className="text-danger" /> : <Volume2 size={16} className="text-primary" />}
              <span className="label-xs font-bold">{isMuted ? "Muted" : "Audio"}</span>
            </button>

            {isDev && (
              <button
                onClick={() => setIsDebugOpen(true)}
                className="label-xs rounded-lg border border-primary/40 bg-primary/10 px-2 py-1 text-primary hover:bg-primary hover:text-primary-foreground transition-colors flex items-center gap-1 font-bold"
              >
                <Sliders size={12} /> DEV
              </button>
            )}
          </div>

          <Link
            to="/notifications"
            className="label-xs flex items-center gap-3 rounded-xl px-3 py-2.5 text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
          >
            <span className="relative">
              <Bell size={18} strokeWidth={2.5} />
              {unread > 0 && (
                <span className="absolute -right-1.5 -top-1.5 grid h-4 w-4 place-items-center rounded-full bg-accent text-[0.5rem] font-black text-accent-foreground">
                  {unread}
                </span>
              )}
            </span>
            Alerts
          </Link>

          {auth.isAuthenticated ? (
            <Link
              to="/profile"
              className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-2.5 hover:border-primary/50 transition-colors"
            >
              <Avatar initials={profile.initials} color={profile.avatarColor} size={38} />
              <div className="min-w-0">
                <div className="display truncate text-sm font-bold">{profile.username}</div>
                <div className="numeric text-xs text-gold font-black">{fmt(profile.elo)} ELO</div>
              </div>
            </Link>
          ) : (
            <button
              onClick={() => setIsAuthOpen(true)}
              className="w-full flex items-center justify-center gap-2 rounded-2xl border border-primary/40 bg-primary/10 p-2.5 text-xs text-primary font-bold hover:bg-primary/20 transition-colors"
            >
              <LogIn size={15} /> Sign In / Claim Rank
            </button>
          )}
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
            aria-label="Toggle sound"
          >
            {isMuted ? <VolumeX size={18} className="text-danger" /> : <Volume2 size={18} className="text-primary" />}
          </button>
          {isDev && (
            <button
              onClick={() => setIsDebugOpen(true)}
              className="label-xs rounded-md border border-primary/40 bg-primary/10 px-1.5 py-1 text-[10px] text-primary font-bold"
            >
              DEV
            </button>
          )}
          <Link to="/notifications" className="relative rounded-lg p-2 text-muted-foreground" aria-label="Notifications">
            <Bell size={18} strokeWidth={2.5} />
            {unread > 0 && (
              <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-accent animate-pulse" />
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

      {/* Auth Modal */}
      <AuthModal open={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

      {/* Dev Debug Panel Modal (Only in DEV) */}
      {isDev && (
        <Modal open={isDebugOpen} onClose={() => setIsDebugOpen(false)} title="IQ ARENA Dev Debugger">
          <div className="space-y-4 text-xs">
            <div>
              <div className="label-xs mb-1.5 text-muted-foreground font-black">Modify ELO Rating ({customElo} ELO)</div>
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
              <div className="label-xs mb-1 text-muted-foreground font-black">Division Presets</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {[
                  { label: "Rookie 720", elo: 720 },
                  { label: "Bronze II 910", elo: 910 },
                  { label: "Silver II 1120", elo: 1120 },
                  { label: "Gold II 1310", elo: 1310 },
                  { label: "Platinum II 1510", elo: 1510 },
                  { label: "Diamond III 1657", elo: 1657 },
                  { label: "Diamond I Promo 1795", elo: 1795 },
                  { label: "Master II 1910", elo: 1910 },
                  { label: "Grandmaster 2110", elo: 2110 },
                  { label: "Apex Legend 2450", elo: 2450 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => handleSetEloPreset(preset.elo)}
                    className="rounded-lg border border-border bg-surface px-2 py-1.5 text-[11px] hover:border-primary hover:text-primary transition-colors text-left font-bold"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-border space-y-2">
              <div className="label-xs text-muted-foreground font-black">Admin Shortcuts</div>
              <Link to="/admin/questions" onClick={() => setIsDebugOpen(false)}>
                <button className="w-full flex items-center justify-between rounded-xl border border-gold/40 bg-gold/10 p-2.5 text-gold font-bold">
                  <span>🛡️ Open Admin Question Center</span>
                  <span>→</span>
                </button>
              </Link>
            </div>

            <div className="pt-2 border-t border-border space-y-2">
              <div className="label-xs text-muted-foreground font-black">State Toggles</div>
              <div className="flex items-center justify-between rounded-xl border border-border bg-surface p-2.5">
                <span className="font-bold">Daily 12 Completed</span>
                <button
                  onClick={handleToggleDailyCompleted}
                  className={cn(
                    "label-xs rounded-lg px-2.5 py-1 font-black transition-colors",
                    daily.completed ? "bg-success text-success-foreground" : "bg-surface-2 text-muted-foreground",
                  )}
                >
                  {daily.completed ? "YES (11/12)" : "NO (Open)"}
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
                className="label-xs flex items-center gap-1 text-danger hover:underline font-bold"
              >
                <RotateCcw size={12} /> Reset to Defaults (1657 ELO)
              </button>

              <button
                onClick={() => setIsDebugOpen(false)}
                className="label-xs rounded-lg bg-surface-2 px-3 py-1.5 text-foreground font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
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
          <h1 className="display text-3xl sm:text-5xl font-black">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}
