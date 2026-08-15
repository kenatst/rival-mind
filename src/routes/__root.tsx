import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AppShell, useImmersive } from "../components/AppShell";
import { Swords, Home as HomeIcon } from "lucide-react";

function NotFoundComponent() {
  return (
    <div className="stage flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center space-y-4">
        <div className="numeric text-8xl text-primary font-black">404</div>
        <h1 className="display text-3xl font-black">ARENA NOT FOUND</h1>
        <p className="text-sm text-muted-foreground">
          This match sector does not exist. Return to the global arena and continue climbing.
        </p>
        <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/home"
            className="display inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm text-primary-foreground font-black shadow-[0_4px_0_0_color-mix(in_oklab,var(--primary)_55%,black)]"
          >
            <HomeIcon size={16} /> Return to Lobby
          </Link>
          <Link
            to="/matchmaking"
            className="display inline-flex items-center gap-2 rounded-xl border-2 border-border bg-surface px-5 py-3 text-sm text-foreground font-bold hover:border-primary"
          >
            <Swords size={16} /> Play Ranked
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center space-y-3">
        <h1 className="display text-3xl font-black text-danger">ARENA INTERRUPTED</h1>
        <p className="text-sm text-muted-foreground">
          A temporary network disruption occurred. Reconnect to resume your match.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="display rounded-xl bg-primary px-5 py-3 text-sm text-primary-foreground font-black shadow-[0_4px_0_0_color-mix(in_oklab,var(--primary)_55%,black)]"
          >
            Try Again
          </button>
          <a
            href="/home"
            className="display rounded-xl border border-border bg-surface px-5 py-3 text-sm text-foreground font-bold"
          >
            Return to Lobby
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" },
      { title: "IQ ARENA — The World Competitive Knowledge Sport" },
      {
        name: "description",
        content:
          "Answer general knowledge questions, earn your world ELO rating and climb the global rankings.",
      },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "IQ ARENA — World Competitive Knowledge Sport" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Archivo:wght@400;600;700;800;900&display=swap",
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <Chrome />
    </QueryClientProvider>
  );
}

function Chrome() {
  const immersive = useImmersive();
  if (immersive) return <Outlet />;
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
