/** Ephemeral client-side run state. Swappable for a real session/API later. */
export interface LastRun {
  score: number;
  total: number;
}

let lastRun: LastRun = { score: 8, total: 10 };

export const setLastRun = (run: LastRun) => {
  lastRun = run;
};

export const getLastRun = (): LastRun => lastRun;

export interface LastMatch {
  playerScore: number;
  opponentScore: number;
  won?: boolean | undefined;
  isDraw?: boolean | undefined;
  eloDelta?: number | undefined;
  oldElo?: number | undefined;
  newElo?: number | undefined;
  score?: { you: number; them: number } | undefined;
  opponent?: { username: string; initials: string; avatarColor: string; rating: number } | undefined;
}

let lastMatch: LastMatch = { playerScore: 7, opponentScore: 5 };

export const setLastMatch = (m: LastMatch) => {
  lastMatch = m;
};

export const getLastMatch = (): LastMatch => lastMatch;
