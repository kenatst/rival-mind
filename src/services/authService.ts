import { getSupabaseClient } from "@/lib/supabase";
import { env } from "@/lib/env";
import { authoritativeGameEngine } from "@/engine/gameEngine";
import type { PlayerProfile } from "@/lib/types";
import { currentUser as defaultUser } from "@/data/mock";

export interface AuthState {
  user: { id: string; email?: string | undefined } | null;
  profile: PlayerProfile;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

class AuthService {
  private listeners: Set<() => void> = new Set();
  private currentProfile: PlayerProfile;
  private currentUser: { id: string; email?: string | undefined } | null = null;
  private isAdminUser = false;

  constructor() {
    this.currentProfile = authoritativeGameEngine.getProfile(defaultUser.id);
    this.initSupabaseListener();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((fn) => fn());
  }

  private async initSupabaseListener() {
    const client = getSupabaseClient();
    if (!client) return;

    try {
      const { data } = await client.auth.getSession();
      if (data.session?.user) {
        this.currentUser = {
          id: data.session.user.id,
          email: data.session.user.email,
        };
        await this.loadUserProfile(data.session.user.id);
      }

      client.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          this.currentUser = {
            id: session.user.id,
            email: session.user.email,
          };
          await this.loadUserProfile(session.user.id);
        } else {
          this.currentUser = null;
          this.currentProfile = authoritativeGameEngine.getProfile(defaultUser.id);
          this.isAdminUser = false;
        }
        this.notify();
      });
    } catch (e) {
      console.warn("Auth initialization fallback:", e);
    }
  }

  private async loadUserProfile(userId: string) {
    const client = getSupabaseClient();
    if (client) {
      const { data: profile } = await client
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (profile) {
        this.currentProfile = {
          ...this.currentProfile,
          id: profile.id,
          username: profile.username,
          elo: profile.current_rating,
          peakElo: profile.peak_rating,
          worldRank: profile.world_rank_cached || 18429,
          countryRank: profile.country_rank_cached || 721,
          streak: profile.current_streak,
          level: profile.level,
          xp: profile.xp,
          battles: profile.battles_played,
          wins: profile.battles_won,
          accuracy: profile.accuracy_percent,
        };
      }

      // Check admin role
      const { data: role } = await client
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .single();

      this.isAdminUser = role?.role === "admin";
    }
    this.notify();
  }

  public getAuthState(): AuthState {
    return {
      user: this.currentUser,
      profile: this.currentProfile,
      isAuthenticated: Boolean(this.currentUser),
      isAdmin: this.isAdminUser || env.isDev,
    };
  }

  public async signUpWithEmail(email: string, pass: string, username: string) {
    const client = getSupabaseClient();
    if (!client) {
      // Local development simulation
      this.currentUser = { id: "user-" + Math.random().toString(36).substring(2, 8), email };
      this.currentProfile = authoritativeGameEngine.updateProfile(this.currentProfile.id, {
        username: username.toUpperCase(),
      });
      this.notify();
      return { user: this.currentUser, profile: this.currentProfile };
    }

    const { data, error } = await client.auth.signUp({
      email,
      password: pass,
      options: {
        data: { username },
      },
    });

    if (error) throw error;
    return data;
  }

  public async signInWithEmail(email: string, pass: string) {
    const client = getSupabaseClient();
    if (!client) {
      this.currentUser = { id: defaultUser.id, email };
      this.notify();
      return { user: this.currentUser };
    }

    const { data, error } = await client.auth.signInWithPassword({
      email,
      password: pass,
    });

    if (error) throw error;
    return data;
  }

  public async signOut() {
    const client = getSupabaseClient();
    if (client) {
      await client.auth.signOut();
    }
    this.currentUser = null;
    this.currentProfile = authoritativeGameEngine.getProfile(defaultUser.id);
    this.isAdminUser = false;
    this.notify();
  }

  /**
   * Guest ➔ Account Conversion: Validates server calibration token and transfers authoritative provisional rating.
   */
  public async claimRankAndRegister(email: string, pass: string, username: string, calibrationToken?: string) {
    const res = await this.signUpWithEmail(email, pass, username);
    const updated = authoritativeGameEngine.registerUserWithCalibrationClaim(
      this.currentProfile.id,
      username,
      calibrationToken,
    );
    this.currentProfile = updated;
    this.notify();
    return res;
  }
}

export const authService = new AuthService();
