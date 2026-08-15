import { PlayerProfile, User } from "./types";
import { currentUser as defaultUser, countries } from "@/data/mock";

const STORAGE_KEY = "quizarena_profile_v2";
const PLACEMENT_KEY = "quizarena_placements";

export interface PlacementState {
  isUnranked: boolean;
  completedMatches: number;
  totalRequired: number;
  estimatedElo: number;
}

export interface IGameRepository {
  getUserProfile(): PlayerProfile;
  updateElo(newElo: number): PlayerProfile;
  recordMatchResult(won: boolean, deltaElo: number, xpGained: number): PlayerProfile;
  getPlacements(): PlacementState;
  setPlacements(state: PlacementState): void;
  resetAll(): void;
}

class LocalGameService implements IGameRepository {
  private profile: PlayerProfile;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.profile = this.loadProfile();
  }

  public subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify(): void {
    this.listeners.forEach((fn) => fn());
  }

  private loadProfile(): PlayerProfile {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // safe fallback
    }
    return {
      ...defaultUser,
      elo: 1657, // Diamond III as mandated
      worldRank: 18429,
      countryRank: 721,
      streak: 14,
      level: 27,
      xp: 18430,
      battles: 438,
      wins: 287,
      accuracy: 72,
    };
  }

  private saveProfile(p: PlayerProfile): void {
    this.profile = p;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
    } catch {
      // safe
    }
    this.notify();
  }

  public getUserProfile(): PlayerProfile {
    return this.profile;
  }

  public updateElo(newElo: number): PlayerProfile {
    const updated: PlayerProfile = {
      ...this.profile,
      elo: newElo,
      worldRank: Math.max(1, Math.round(28000 - newElo * 6)),
    };
    this.saveProfile(updated);
    return updated;
  }

  public setStreak(streak: number): PlayerProfile {
    const updated: PlayerProfile = {
      ...this.profile,
      streak,
    };
    this.saveProfile(updated);
    return updated;
  }

  public recordMatchResult(won: boolean, deltaElo: number, xpGained: number): PlayerProfile {
    const newElo = Math.max(100, this.profile.elo + deltaElo);
    const newBattles = this.profile.battles + 1;
    const newWins = won ? this.profile.wins + 1 : this.profile.wins;
    const newXP = this.profile.xp + xpGained;
    const newLevel = Math.floor(newXP / 700) + 1;
    const newWorldRank = won
      ? Math.max(1, this.profile.worldRank - Math.abs(deltaElo * 30))
      : this.profile.worldRank + Math.abs(deltaElo * 25);

    const updated: PlayerProfile = {
      ...this.profile,
      elo: newElo,
      battles: newBattles,
      wins: newWins,
      xp: newXP,
      level: newLevel,
      worldRank: newWorldRank,
      accuracy: Math.round((newWins / newBattles) * 100),
    };

    this.saveProfile(updated);
    return updated;
  }

  public getPlacements(): PlacementState {
    try {
      const saved = localStorage.getItem(PLACEMENT_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return {
      isUnranked: false,
      completedMatches: 5,
      totalRequired: 5,
      estimatedElo: 1657,
    };
  }

  public setPlacements(state: PlacementState): void {
    try {
      localStorage.setItem(PLACEMENT_KEY, JSON.stringify(state));
    } catch {
      // safe
    }
    this.notify();
  }

  public resetAll(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(PLACEMENT_KEY);
    } catch {
      // safe
    }
    this.profile = {
      ...defaultUser,
      elo: 1657,
      worldRank: 18429,
      countryRank: 721,
      streak: 14,
      level: 27,
      xp: 18430,
      battles: 438,
      wins: 287,
      accuracy: 72,
    };
    this.notify();
  }
}

export const gameService = new LocalGameService();
