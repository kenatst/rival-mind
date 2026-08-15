export interface TournamentBracketMatch {
  matchId: string;
  roundName: "Round of 64" | "Round of 32" | "Quarter-Final" | "Semi-Final" | "Grand Final";
  playerA: { id: string; username: string; elo: number; avatarColor: string; score?: number };
  playerB: { id: string; username: string; elo: number; avatarColor: string; score?: number };
  winnerId?: string | undefined;
  completed: boolean;
}

export interface WeekendCupState {
  cupId: string;
  name: string;
  season: string;
  status: "registration_open" | "active" | "completed";
  currentRound: number;
  totalRounds: number;
  userPlacement?: string | undefined;
  bracket: TournamentBracketMatch[];
}

export interface KingOfHillState {
  eventId: string;
  startingPlayers: number;
  remainingPlayers: number;
  currentRound: number;
  totalRounds: number;
  eliminationPercentile: number; // e.g. 20%
  userStatus: "active" | "eliminated" | "winner";
}

class TournamentEngine {
  private weekendCups: Map<string, WeekendCupState> = new Map();
  private kingOfHillEvents: Map<string, KingOfHillState> = new Map();

  constructor() {
    // Seed Weekend Cup
    this.weekendCups.set("cup-genesis-1", {
      cupId: "cup-genesis-1",
      name: "Weekend Cup #14 — Diamond Circuit",
      season: "Genesis",
      status: "active",
      currentRound: 3,
      totalRounds: 4,
      userPlacement: "Semi-Finalist",
      bracket: [
        {
          matchId: "m-qf-1",
          roundName: "Quarter-Final",
          playerA: { id: "u-kenael", username: "KENAEL", elo: 1657, avatarColor: "oklch(0.88 0.21 122)", score: 8 },
          playerB: { id: "u-bot1", username: "ALEX_PARIS", elo: 1620, avatarColor: "oklch(0.7 0.2 300)", score: 6 },
          winnerId: "u-kenael",
          completed: true,
        },
        {
          matchId: "m-qf-2",
          roundName: "Quarter-Final",
          playerA: { id: "u-lucas92", username: "LUCAS92", elo: 1691, avatarColor: "oklch(0.66 0.26 5)", score: 7 },
          playerB: { id: "u-bot2", username: "SOPHIE_B", elo: 1640, avatarColor: "oklch(0.8 0.15 215)", score: 5 },
          winnerId: "u-lucas92",
          completed: true,
        },
        {
          matchId: "m-sf-1",
          roundName: "Semi-Final",
          playerA: { id: "u-kenael", username: "KENAEL", elo: 1657, avatarColor: "oklch(0.88 0.21 122)" },
          playerB: { id: "u-lucas92", username: "LUCAS92", elo: 1691, avatarColor: "oklch(0.66 0.26 5)" },
          completed: false,
        },
      ],
    });

    // Seed King of the Hill
    this.kingOfHillEvents.set("koth-live", {
      eventId: "koth-live",
      startingPlayers: 100,
      remainingPlayers: 34,
      currentRound: 4,
      totalRounds: 6,
      eliminationPercentile: 20,
      userStatus: "active",
    });
  }

  public getWeekendCup(cupId: string = "cup-genesis-1"): WeekendCupState {
    return this.weekendCups.get(cupId)!;
  }

  public getKingOfHill(eventId: string = "koth-live"): KingOfHillState {
    return this.kingOfHillEvents.get(eventId)!;
  }

  /**
   * Server check for tournament qualification.
   * Diamond+ OR Top 10% Daily OR Weekend Cup finalist.
   */
  public verifyQualifierEligibility(userElo: number, dailyRank: number): { eligible: boolean; reasons: string[] } {
    const reasons: string[] = [];
    let eligible = false;

    if (userElo >= 1600) {
      eligible = true;
      reasons.push("Diamond Division standing (1600+ ELO)");
    }
    if (dailyRank <= 1000) {
      eligible = true;
      reasons.push("Top 1,000 Worldwide in Daily Challenge");
    }

    if (!eligible) {
      reasons.push("Requires Diamond Division (1600+ ELO) or Top 1,000 in Daily 12");
    }

    return { eligible, reasons };
  }
}

export const tournamentEngine = new TournamentEngine();
