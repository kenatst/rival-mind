import * as React from "react";
import { Modal, Button } from "@/components/kit/primitives";
import { authService } from "@/services/authService";
import { Sparkles, Mail, Lock, User as UserIcon, Check } from "lucide-react";

export function AuthModal({
  open,
  onClose,
  estimatedElo,
}: {
  open: boolean;
  onClose: () => void;
  estimatedElo?: number;
}) {
  const [mode, setMode] = React.useState<"signup" | "signin">("signup");
  const [username, setUsername] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === "signup") {
        if (!username) throw new Error("Please enter a username.");
        if (estimatedElo) {
          await authService.claimRankAndRegister(email, password, username, estimatedElo);
        } else {
          await authService.signUpWithEmail(email, password, username);
        }
      } else {
        await authService.signInWithEmail(email, password);
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err?.message || "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "signup" ? "Claim Your Rank & Register" : "Sign In to IQ ARENA"}
    >
      {success ? (
        <div className="py-6 text-center space-y-3">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-success/20 text-success">
            <Check size={24} />
          </div>
          <div className="display text-xl font-bold text-success">
            {mode === "signup" ? "Account Created & Rank Claimed!" : "Welcome Back!"}
          </div>
          <p className="text-xs text-muted-foreground">Entering the competitive arena...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {estimatedElo && mode === "signup" && (
            <div className="rounded-xl border border-gold/40 bg-gold/10 p-3 text-center">
              <div className="label-xs text-gold font-bold">Calibration Rating</div>
              <div className="numeric text-2xl text-gold font-black mt-0.5">{estimatedElo} ELO</div>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-danger/40 bg-danger/10 p-2.5 text-danger font-bold">
              {error}
            </div>
          )}

          {mode === "signup" && (
            <div>
              <label className="label-xs mb-1.5 block text-muted-foreground">Public Gamer Username</label>
              <div className="relative">
                <UserIcon size={16} className="absolute left-3 top-2.5 text-muted-foreground" />
                <input
                  type="text"
                  required
                  placeholder="e.g. KENAEL_99"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface pl-9 pr-3 py-2.5 text-foreground font-bold outline-none focus:border-primary placeholder:text-muted-foreground/40 uppercase"
                />
              </div>
            </div>
          )}

          <div>
            <label className="label-xs mb-1.5 block text-muted-foreground">Email Address</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-2.5 text-muted-foreground" />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface pl-9 pr-3 py-2.5 text-foreground outline-none focus:border-primary placeholder:text-muted-foreground/40"
              />
            </div>
          </div>

          <div>
            <label className="label-xs mb-1.5 block text-muted-foreground">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-2.5 text-muted-foreground" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface pl-9 pr-3 py-2.5 text-foreground outline-none focus:border-primary placeholder:text-muted-foreground/40"
              />
            </div>
          </div>

          <Button full size="lg" variant="primary" type="submit" disabled={loading}>
            {loading ? "Processing..." : mode === "signup" ? "Create Account & Save Rank" : "Sign In"}
          </Button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              {mode === "signup"
                ? "Already have an account? Sign in here."
                : "Need an account? Sign up here."}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
