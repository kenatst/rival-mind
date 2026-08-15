import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";
import { playCue } from "@/lib/game";

/* ---------------------------------- Button --------------------------------- */

const buttonVariants = cva(
  "relative inline-flex select-none items-center justify-center gap-2 rounded-xl font-display font-extrabold uppercase tracking-tight transition-[transform,box-shadow,background-color,color] duration-150 active:translate-y-[2px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-45",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground shadow-[0_5px_0_0_color-mix(in_oklab,var(--primary)_55%,black)] hover:brightness-110 active:shadow-[0_2px_0_0_color-mix(in_oklab,var(--primary)_55%,black)]",
        prestige:
          "bg-[image:var(--gradient-prestige)] text-[oklch(0.2_0.05_60)] shadow-[0_5px_0_0_oklch(0.55_0.13_60)] hover:brightness-110 active:shadow-[0_2px_0_0_oklch(0.55_0.13_60)]",
        live: "bg-accent text-accent-foreground shadow-[0_5px_0_0_color-mix(in_oklab,var(--accent)_55%,black)] hover:brightness-110 active:shadow-[0_2px_0_0_color-mix(in_oklab,var(--accent)_55%,black)]",
        surface:
          "bg-surface-2 text-foreground shadow-[0_4px_0_0_var(--border)] hover:bg-[color-mix(in_oklab,var(--surface-2)_80%,white)] active:shadow-[0_1px_0_0_var(--border)]",
        outline:
          "border-2 border-border-strong bg-transparent text-foreground hover:border-primary hover:text-primary",
        ghost: "text-muted-foreground hover:bg-surface hover:text-foreground",
      },
      size: {
        sm: "h-9 px-3 text-xs",
        md: "h-11 px-5 text-sm",
        lg: "h-14 px-7 text-base",
        xl: "h-16 px-8 text-xl",
        icon: "h-10 w-10",
      },
      full: { true: "w-full", false: "" },
    },
    defaultVariants: { variant: "primary", size: "md", full: false },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, full, onClick, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, full }), className)}
      onClick={(e) => {
        playCue("tap");
        onClick?.(e);
      }}
      {...props}
    />
  ),
);
Button.displayName = "Button";

/* ---------------------------------- Panel ---------------------------------- */

export function Panel({
  className,
  glow,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { glow?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-lift)]",
        glow && "border-primary/40 shadow-[var(--shadow-glow)]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function SectionTitle({
  children,
  action,
  className,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-3 flex items-center justify-between gap-3", className)}>
      <h2 className="label-xs text-muted-foreground">{children}</h2>
      {action}
    </div>
  );
}

/* ----------------------------------- Tabs ---------------------------------- */

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex gap-1 overflow-x-auto rounded-xl border border-border bg-surface p-1",
        className,
      )}
      role="tablist"
    >
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={value === t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            "label-xs flex-1 whitespace-nowrap rounded-lg px-3 py-2 transition-colors",
            value === t.id
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

/* ---------------------------------- Modal ---------------------------------- */

export function Modal({
  open,
  isOpen,
  onClose,
  title,
  children,
}: {
  open?: boolean;
  isOpen?: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const isVisible = open !== undefined ? open : !!isOpen;
  if (!isVisible) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-6">
      <button aria-label="Close" className="absolute inset-0 cursor-default" onClick={onClose} />
      <div className="animate-rise relative w-full max-w-md rounded-t-3xl border border-border bg-popover p-6 shadow-[var(--shadow-lift)] sm:rounded-3xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h3 className="display text-2xl">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1 text-muted-foreground hover:bg-surface hover:text-foreground"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* -------------------------------- Progress --------------------------------- */

export function ProgressBar({
  value,
  className,
  color,
  height = 10,
  striped,
}: {
  value: number;
  className?: string;
  color?: string;
  height?: number;
  striped?: boolean;
}) {
  return (
    <div
      className={cn("w-full overflow-hidden rounded-full bg-muted", className)}
      style={{ height }}
      role="progressbar"
      aria-valuenow={Math.round(value * 100)}
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-700 ease-out",
          striped && "relative overflow-hidden",
        )}
        style={{
          width: `${Math.max(2, Math.min(100, value * 100))}%`,
          background: color ?? "var(--gradient-primary)",
        }}
      >
        {striped && (
          <span className="absolute inset-0 animate-[sweep_2.4s_linear_infinite] bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.35),transparent)]" />
        )}
      </div>
    </div>
  );
}

/* ---------------------------------- Toast ---------------------------------- */

export function Toast({ message, tone = "info" }: { message: string; tone?: "info" | "good" | "bad" }) {
  return (
    <div className="pointer-events-none fixed left-1/2 top-4 z-[60] w-[min(92vw,26rem)] -translate-x-1/2">
      <div
        className={cn(
          "animate-rise rounded-xl border px-4 py-3 text-sm font-semibold shadow-[var(--shadow-lift)]",
          tone === "good" && "border-success/50 bg-surface text-success",
          tone === "bad" && "border-danger/50 bg-surface text-danger",
          tone === "info" && "border-border bg-surface text-foreground",
        )}
      >
        {message}
      </div>
    </div>
  );
}
