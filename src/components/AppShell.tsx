import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, Home, Swords, Trophy, Users, Globe2, User } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { currentUser, notifications } from "@/data/mock";
import { Avatar, DivisionBadge } from "@/components/kit/badges";
import { fmt } from "@/lib/game";

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
      <span className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground">
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
  const unread = notifications.filter((n) => n.unread).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop rail */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[15rem] flex-col border-r border-border bg-surface/60 px-4 py-6 lg:flex">
        <Logo className="mb-8 px-2" />
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
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-surface-2 hover:text-foreground",
                )}
              >
                <Icon size={18} strokeWidth={2.5} />
                {label}
              </Link>
            );
          })}
        </nav>
        <Link
          to="/notifications"
          className="label-xs mb-3 flex items-center gap-3 rounded-xl px-3 py-3 text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
        >
          <span className="relative">
            <Bell size={18} strokeWidth={2.5} />
            {unread > 0 && (
              <span className="absolute -right-1.5 -top-1.5 grid h-4 w-4 place-items-center rounded-full bg-accent text-[0.5rem] text-accent-foreground">
                {unread}
              </span>
            )}
          </span>
          Alerts
        </Link>
        <Link
          to="/profile"
          className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3"
        >
          <Avatar initials={currentUser.initials} color={currentUser.avatarColor} size={38} />
          <div className="min-w-0">
            <div className="display truncate text-sm">{currentUser.username}</div>
            <div className="numeric text-xs text-muted-foreground">{fmt(currentUser.elo)} ELO</div>
          </div>
        </Link>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur lg:hidden">
        <Logo className="text-base" />
        <div className="flex items-center gap-2">
          <DivisionBadge elo={currentUser.elo} size="sm" />
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
                active ? "text-primary" : "text-muted-foreground",
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
