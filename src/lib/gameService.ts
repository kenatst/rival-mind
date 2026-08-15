import {
  PlayerProfile,
  DailyChallenge,
  League,
  AppNotification,
  LeaderboardEntry,
  CountryRanking,
  BattleChallenge,
} from "./types";
import {
  currentUser as defaultUser,
  dailyChallenge as defaultDaily,
  privateLeague as defaultLeague,
  notifications as defaultNotifications,
  nearbyLeaderboard as defaultNearby,
  topLeaderboard as defaultTop,
  franceLeaderboard as defaultFrance,
  friendsLeaderboard as defaultFriends,
  countryRankings as defaultCountries,
  pendingBattleChallenge,
} from "@/data/mock";

const STORAGE_KEY = "iq_arena_state_v3";

export interface PersistedGameState {
  profile: PlayerProfile;
  daily: DailyChallenge;
  notifications: AppNotification[];
  recentBattles: { who: string; res: string; tone: string }[];
  isMuted: boolean;
}

export interface IGameRepository {
  getUserProfile(): PlayerProfile;
  updateElo(newElo: number): PlayerProfile;
  recordMatchResult(won: boolean, deltaElo: number, xpGained: number): PlayerProfile;
  setStreak(streak: number): PlayerProfile;
  getDailyChallenge(): DailyChallenge;
  setDailyCompleted(completed: boolean, score?: number): void;
  getPrivateLeague(): League;
  getNotifications(): AppNotification[];
  markNotificationRead(id: string): void;
  markAllNotificationsRead(): void;
  getNearbyPlayers(): LeaderboardEntry[];
  getTop100(): LeaderboardEntry[];
  getFranceTop(): LeaderboardEntry[];
  getFriendsLeaderboard(): LeaderboardEntry[];
  getCountryRankings(): CountryRanking[];
  getPendingBattle(): BattleChallenge;
  getRecentBattles(): { who: string; res: string; tone: string }[];
  createChallengeLink(opponentName?: string): string;
  resetAll(): void;
}

class GameRepositoryService implements IGameRepository {
  private state: PersistedGameState;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.state = this.loadState();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.saveState();
    this.listeners.forEach((fn) => fn());
  }

  private loadState(): PersistedGameState {
    try {
      if (typeof window !== "undefined") {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          // ensure required properties exist
          if (parsed && parsed.profile && parsed.daily) {
            return parsed;
          }
        }
      }
    } catch {
      // safe fallback
    }

    return {
      profile: { ...defaultUser },
      daily: { ...defaultDaily },
      notifications: [...defaultNotifications],
      recentBattles: [
        { who: "LUCAS92", res: "Won 7–5", tone: "text-success" },
        { who: "Emma", res: "Lost 6–8", tone: "text-danger" },
        { who: "Chloé", res: "Won 9–4", tone: "text-success" },
      ],
      isMuted: false,
    };
  }

  private saveState(): void {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      }
    } catch {
      // safe
    }
  }

  // --- Player Profile ---
  public getUserProfile(): PlayerProfile {
    return this.state.profile;
  }

  public updateElo(newElo: number): PlayerProfile {
    const updated: PlayerProfile = {
      ...this.state.profile,
      elo: newElo,
    };
    this.state.profile = updated;
    this.notify();
    return updated;
  }

  public setStreak(streak: number): PlayerProfile {
    const updated: PlayerProfile = {
      ...this.state.profile,
      streak,
    };
    this.state.profile = updated;
    this.notify();
    return updated;
  }

  public recordMatchResult(won: boolean, deltaElo: number, xpGained: number): PlayerProfile {
    const newElo = Math.max(100, this.state.profile.elo + deltaElo);
    const newBattles = this.state.profile.battles + 1;
    const newWins = won ? this.state.profile.wins + 1 : this.state.profile.wins;
    const newXP = this.state.profile.xp + xpGained;
    const newLevel = Math.floor(newXP / 700) + 1;
    const newWorldRank = won
      ? Math.max(1, this.state.profile.worldRank - Math.abs(deltaElo * 30))
      : this.state.profile.worldRank + Math.abs(deltaElo * 24);
    const newCountryRank = won
      ? Math.max(1, this.state.profile.countryRank - Math.abs(Math.round(deltaElo * 1.2)))
      : this.state.profile.countryRank + Math.abs(Math.round(deltaElo * 0.9));

    const updated: PlayerProfile = {
      ...this.state.profile,
      elo: newElo,
      peakElo: Math.max(this.state.profile.peakElo, newElo),
      battles: newBattles,
      wins: newWins,
      xp: newXP,
      level: newLevel,
      worldRank: newWorldRank,
      countryRank: newCountryRank,
      accuracy: Math.round((newWins / newBattles) * 100),
    };

    this.state.profile = updated;
    this.notify();
    return updated;
  }

  // --- Daily 12 ---
  public getDailyChallenge(): DailyChallenge {
    return this.state.daily;
  }

  public setDailyCompleted(completed: boolean, score: number = 11): void {
    const updatedDaily: DailyChallenge = {
      ...this.state.daily,
      completed,
      score: completed ? score : 0,
    };
    this.state.daily = updatedDaily;
    this.notify();
  }

  // --- Private League ---
  public getPrivateLeague(): League {
    const league = { ...defaultLeague };
    // update current user row with real elo
    league.members = league.members.map((m) => {
      if (m.isYou) {
        return {
          ...m,
          elo: this.state.profile.elo,
        };
      }
      return m;
    });
    return league;
  }

  // --- Notifications ---
  public getNotifications(): AppNotification[] {
    return this.state.notifications;
  }

  public markNotificationRead(id: string): void {
    this.state.notifications = this.state.notifications.map((n) =>
      n.id === id ? { ...n, unread: false } : n,
    );
    this.notify();
  }

  public markAllNotificationsRead(): void {
    this.state.notifications = this.state.notifications.map((n) => ({
      ...n,
      unread: false,
    }));
    this.notify();
  }

  // --- Rankings ---
  public getNearbyPlayers(): LeaderboardEntry[] {
    const p = this.state.profile;
    return [
      { rank: p.worldRank - 3, player: defaultNearby[0]!.player, elo: p.elo + 3, trend: 1 },
      { rank: p.worldRank - 2, player: defaultNearby[1]!.player, elo: p.elo + 2, trend: -1 },
      { rank: p.worldRank - 1, player: defaultNearby[2]!.player, elo: p.elo + 1, trend: 0 },
      {
        rank: p.worldRank,
        player: {
          id: p.id,
          username: p.username,
          country: p.country,
          avatarColor: p.avatarColor,
          initials: p.initials,
        },
        elo: p.elo,
        isYou: true,
        trend: 2,
        streak: p.streak,
      },
      { rank: p.worldRank + 1, player: defaultNearby[4]!.player, elo: p.elo - 1, trend: -1 },
      { rank: p.worldRank + 2, player: defaultNearby[5]!.player, elo: p.elo - 2, trend: 0 },
      { rank: p.worldRank + 3, player: defaultNearby[6]!.player, elo: p.elo - 3, trend: -2 },
    ];
  }

  public getTop100(): LeaderboardEntry[] {
    return defaultTop;
  }

  public getFranceTop(): LeaderboardEntry[] {
    return defaultFrance;
  }

  public getFriendsLeaderboard(): LeaderboardEntry[] {
    const p = this.state.profile;
    const list = [...defaultFriends];
    return list.map((e) => {
      if (e.isYou) {
        return {
          ...e,
          elo: p.elo,
          rank: p.elo >= 1691 ? 1 : 2,
        };
      }
      return e;
    }).sort((a, b) => b.elo - a.elo);
  }

  public getCountryRankings(): CountryRanking[] {
    return defaultCountries;
  }

  // --- Battles ---
  public getPendingBattle(): BattleChallenge {
    return pendingBattleChallenge;
  }

  public getRecentBattles(): { who: string; res: string; tone: string }[] {
    return this.state.recentBattles;
  }

  public createChallengeLink(opponentName: string = "friend"): string {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `iqarena.gg/battle/${code}`;
  }

  // --- Reset ---
  public resetAll(): void {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // safe
    }
    this.state = {
      profile: { ...defaultUser },
      daily: { ...defaultDaily },
      notifications: [...defaultNotifications],
      recentBattles: [
        { who: "LUCAS92", res: "Won 7–5", tone: "text-success" },
        { who: "Emma", res: "Lost 6–8", tone: "text-danger" },
        { who: "Chloé", res: "Won 9–4", tone: "text-success" },
      ],
      isMuted: false,
    };
    this.notify();
  }
}

export const gameService = new GameRepositoryService();
