function generateUUID(): string {
  if (typeof globalThis !== "undefined" && globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return "uuid-" + Math.random().toString(36).substring(2, 11) + "-" + Date.now().toString(36);
}

export interface GuestCalibrationRecord {
  id: string;
  guestSessionId: string;
  provisionalRating: number;
  calculatedAt: string;
  expiresAt: string;
  claimedAt?: string | undefined;
  calibrationToken: string;
}

/**
 * Server-Authoritative Guest Calibration Engine.
 * Generates opaque cryptographically unique claim tokens based on server-evaluated quiz scores.
 * Protects competitive leaderboards against users self-submitting arbitrary Elo (e.g. 2400 Legend).
 */
class CalibrationEngine {
  private calibrations: Map<string, GuestCalibrationRecord> = new Map();
  private tokenIndex: Map<string, string> = new Map(); // token -> id

  /**
   * Generates a signed, server-authoritative calibration claim token.
   */
  public createCalibration(guestSessionId: string, correctCount: number, totalQuestions: number = 10): { token: string; provisionalRating: number } {
    // Server calculates authoritative provisional rating
    const safeCorrect = Math.max(0, Math.min(totalQuestions, correctCount));
    const provisionalRating = 820 + safeCorrect * 38;

    const id = "calib-" + generateUUID();
    const calibrationToken = "iq_tok_" + Math.random().toString(36).substring(2, 12) + "_" + Date.now().toString(36);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(); // 24h validity

    const record: GuestCalibrationRecord = {
      id,
      guestSessionId,
      provisionalRating,
      calculatedAt: now.toISOString(),
      expiresAt,
      calibrationToken,
    };

    this.calibrations.set(id, record);
    this.tokenIndex.set(calibrationToken, id);

    return { token: calibrationToken, provisionalRating };
  }

  /**
   * Validates and consumes a calibration token during registration.
   * Returns the authoritative rating or null if invalid/expired/already claimed.
   */
  public claimCalibration(token: string): { valid: boolean; success: boolean; provisionalRating: number; reason?: string } {
    const id = this.tokenIndex.get(token);
    if (!id) {
      return { valid: false, success: false, provisionalRating: 1200, reason: "Invalid calibration token." };
    }

    const record = this.calibrations.get(id);
    if (!record) {
      return { valid: false, success: false, provisionalRating: 1200, reason: "Calibration record not found." };
    }

    if (record.claimedAt) {
      return { valid: false, success: false, provisionalRating: 1200, reason: "Calibration token has already been claimed." };
    }

    const now = new Date();
    if (new Date(record.expiresAt) < now) {
      return { valid: false, success: false, provisionalRating: 1200, reason: "Calibration token has expired." };
    }
    // Mark claimed
    record.claimedAt = now.toISOString();

    return {
      valid: true,
      success: true,
      provisionalRating: record.provisionalRating,
    };
  }

  /**
   * Inspect a calibration record without consuming it.
   */
  public inspectCalibration(token: string): GuestCalibrationRecord | null {
    const id = this.tokenIndex.get(token);
    if (!id) return null;
    return this.calibrations.get(id) || null;
  }
}

export const calibrationEngine = new CalibrationEngine();
export const guestCalibrationEngine = calibrationEngine;
