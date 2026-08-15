export interface PlayerRivalry {
  id: string;
  opponentUsername: string;
  opponentInitials: string;
  opponentColor: string;
  opponentElo: number;
  userWins: number;
  opponentWins: number;
  draws: number;
  lastMatchDate: string;
  currentLeader: "user" | "opponent" | "tied";
  streakHolder: string;
  streakCount: number;
  narrativeContext: string;
}

class SocialEngine {
  private rivalries: Map<string, PlayerRivalry> = new Map();

  constructor() {
    this.rivalries.set("u-lucas92", {
      id: "riv-lucas92",
      opponentUsername: "LUCAS92",
      opponentInitials: "L9",
      opponentColor: "oklch(0.66 0.26 5)",
      opponentElo: 1691,
      userWins: 7,
      opponentWins: 6,
      draws: 1,
      lastMatchDate: "Yesterday",
      currentLeader: "user",
      streakHolder: "LUCAS92",
      streakCount: 2,
      narrativeContext: "LUCAS92 beat you yesterday. Victory ties the series for them.",
    });

    this.rivalries.set("u-emma", {
      id: "riv-emma",
      opponentUsername: "Emma",
      opponentInitials: "EM",
      opponentColor: "oklch(0.85 0.18 200)",
      opponentElo: 1645,
      userWins: 9,
      opponentWins: 4,
      draws: 0,
      lastMatchDate: "3 days ago",
      currentLeader: "user",
      streakHolder: "KENAEL",
      streakCount: 4,
      narrativeContext: "You are on a 4-match win streak against Emma.",
    });
  }

  public getRivalries(): PlayerRivalry[] {
    return Array.from(this.rivalries.values());
  }

  public getRivalryWith(opponentUsername: string): PlayerRivalry | undefined {
    return Array.from(this.rivalries.values()).find(
      (r) => r.opponentUsername.toLowerCase() === opponentUsername.toLowerCase(),
    );
  }

  public recordRivalryMatch(opponentUsername: string, userWon: boolean) {
    const rivalry = this.getRivalryWith(opponentUsername);
    if (!rivalry) return;

    if (userWon) {
      rivalry.userWins += 1;
      if (rivalry.streakHolder === "KENAEL") rivalry.streakCount += 1;
      else {
        rivalry.streakHolder = "KENAEL";
        rivalry.streakCount = 1;
      }
    } else {
      rivalry.opponentWins += 1;
      if (rivalry.streakHolder === rivalry.opponentUsername) rivalry.streakCount += 1;
      else {
        rivalry.streakHolder = rivalry.opponentUsername;
        rivalry.streakCount = 1;
      }
    }

    rivalry.currentLeader =
      rivalry.userWins > rivalry.opponentWins
        ? "user"
        : rivalry.userWins < rivalry.opponentWins
        ? "opponent"
        : "tied";
    rivalry.lastMatchDate = "Just now";
  }
}

export const socialEngine = new SocialEngine();
