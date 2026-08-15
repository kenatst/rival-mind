import { modeEngine } from "./modeEngine";

export interface PlayerSkillDimensions {
  speed: number; // 0-100 (derived from response latency relative to peers)
  recall: number; // 0-100 (derived from Free Answer performance)
  precision: number; // 0-100 (derived from overall accuracy)
  knowledge: number; // 0-100 (derived from high difficulty questions solved)
}

export interface PlayerModeRecordsSummary {
  lightningPB: number;
  blitzPB: number;
  streakPB: number;
  perfect10BestTime: string;
  ladderBestLevel: number;
  historyTowerFloor: number;
  geographyTowerFloor: number;
  scienceTowerFloor: number;
  dailyGemStreak: number;
  weekendCupBest: string;
}

class RecordsEngine {
  public getPlayerSkillDimensions(userId: string): PlayerSkillDimensions {
    return {
      speed: 84, // Lightning & Blitz speed
      recall: 79, // Free Answer recall
      precision: 74, // 74% precision
      knowledge: 88, // Diamond tier difficulty mastery
    };
  }

  public getPlayerModeRecords(userId: string): PlayerModeRecordsSummary {
    return {
      lightningPB: modeEngine.getPersonalBest(userId, "lightning") || 24,
      blitzPB: modeEngine.getPersonalBest(userId, "blitz") || 18,
      streakPB: modeEngine.getPersonalBest(userId, "streak") || 22,
      perfect10BestTime: "1m 14s (10/10)",
      ladderBestLevel: modeEngine.getPersonalBest(userId, "ladder") || 7,
      historyTowerFloor: modeEngine.getTowerFloor(userId, "History") || 38,
      geographyTowerFloor: modeEngine.getTowerFloor(userId, "Geography") || 26,
      scienceTowerFloor: modeEngine.getTowerFloor(userId, "Science") || 19,
      dailyGemStreak: modeEngine.getPersonalBest(userId, "daily-gem") || 14,
      weekendCupBest: "Semi-Finalist (#14)",
    };
  }
}

export const recordsEngine = new RecordsEngine();
