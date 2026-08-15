import { getSupabaseClient } from "@/lib/supabase";
import { PlayerProfile } from "@/lib/types";
import {
  IProfileRepository,
  IMatchmakingRepository,
  IRankedRepository,
  ISocialRepository,
  IRecordsRepository,
  IMatchReviewRepository,
  RankedMatchSnapshotDTO,
  SanitizedRoundDTO,
  QueueStatusDTO,
  MatchAnswerResultDTO,
  MatchReviewDTO,
} from "./types";
import { PlayerRivalry, socialEngine } from "@/engine/socialEngine";
import { PlayerModeRecordsSummary, PlayerSkillDimensions, recordsEngine } from "@/engine/recordsEngine";
import { generateMatchReviewDTO } from "@/engine/matchReviewEngine";

// Test Personas for Safe Dev / Staging Verification
export const DEV_PERSONAS: Record<string, PlayerProfile> = {
  KENAEL: {
    id: "u-kenael",
    username: "KENAEL",
    country: { code: "FR", name: "France", flag: "🇫🇷" },
    avatarColor: "oklch(0.88 0.21 122)",
    initials: "KN",
    elo: 1657,
    peakElo: 1682,
    worldRank: 18429,
    countryRank: 721,
    streak: 14,
    level: 27,
    xp: 18430,
    battles: 142,
    wins: 98,
    accuracy: 74,
    season: "Genesis",
    strongCategories: [{ category: "History", score: 88 }, { category: "Science", score: 82 }],
    weakCategories: [{ category: "Cinema", score: 54 }, { category: "Music", score: 58 }],
    achievements: [{ id: "ach-1", label: "Diamond Vanguard", description: "Reached Diamond III", icon: "💎", unlocked: true }],
  },
  LUCAS92: {
    id: "u-lucas92",
    username: "LUCAS92",
    country: { code: "FR", name: "France", flag: "🇫🇷" },
    avatarColor: "oklch(0.66 0.26 5)",
    initials: "L9",
    elo: 1691,
    peakElo: 1715,
    worldRank: 14210,
    countryRank: 512,
    streak: 8,
    level: 29,
    xp: 21900,
    battles: 180,
    wins: 118,
    accuracy: 77,
    season: "Genesis",
    strongCategories: [{ category: "Geography", score: 92 }],
    weakCategories: [{ category: "Art", score: 52 }],
    achievements: [{ id: "ach-2", label: "Master Contender", description: "Top 500 Regional", icon: "🏆", unlocked: true }],
  },
  THOMAS: {
    id: "u-thomas",
    username: "Thomas",
    country: { code: "FR", name: "France", flag: "🇫🇷" },
    avatarColor: "oklch(0.7 0.2 300)",
    initials: "TH",
    elo: 1288,
    peakElo: 1340,
    worldRank: 84120,
    countryRank: 4210,
    streak: 3,
    level: 15,
    xp: 9400,
    battles: 64,
    wins: 35,
    accuracy: 62,
    season: "Genesis",
    strongCategories: [{ category: "Sports", score: 85 }],
    weakCategories: [{ category: "Literature", score: 45 }],
    achievements: [],
  },
  EMMA: {
    id: "u-emma",
    username: "Emma",
    country: { code: "FR", name: "France", flag: "🇫🇷" },
    avatarColor: "oklch(0.85 0.18 200)",
    initials: "EM",
    elo: 1602,
    peakElo: 1630,
    worldRank: 24100,
    countryRank: 1120,
    streak: 11,
    level: 24,
    xp: 16200,
    battles: 110,
    wins: 72,
    accuracy: 71,
    season: "Genesis",
    strongCategories: [{ category: "Literature", score: 89 }],
    weakCategories: [{ category: "Science", score: 58 }],
    achievements: [],
  },
};

export class SupabaseProfileRepository implements IProfileRepository {
  private activePersona: PlayerProfile = DEV_PERSONAS["KENAEL"]!;

  public async getProfile(userId?: string): Promise<PlayerProfile> {
    const client = getSupabaseClient();
    if (!client) return this.activePersona;

    const targetId = userId || this.activePersona.id;

    try {
      const { data, error } = await client
        .from("profiles")
        .select("*")
        .eq("id", targetId)
        .single();

      if (error || !data) return this.activePersona;

      return {
        id: data.id,
        username: data.username,
        country: { code: data.country_code || "FR", name: "France", flag: "🇫🇷" },
        avatarColor: data.avatar_color || "oklch(0.88 0.21 122)",
        initials: data.username.substring(0, 2).toUpperCase(),
        elo: data.current_rating,
        peakElo: data.peak_rating,
        worldRank: data.world_rank_cached || 18429,
        countryRank: data.country_rank_cached || 721,
        streak: data.current_streak,
        level: data.level,
        xp: data.xp,
        battles: data.battles_played,
        wins: data.battles_won,
        accuracy: data.accuracy_percent,
        season: "Genesis",
        strongCategories: [{ category: "History", score: 88 }],
        weakCategories: [{ category: "Cinema", score: 54 }],
        achievements: [],
      };
    } catch {
      return this.activePersona;
    }
  }

  public async updateProfile(userId: string, updates: Partial<PlayerProfile>): Promise<PlayerProfile> {
    const client = getSupabaseClient();
    if (!client) {
      this.activePersona = { ...this.activePersona, ...updates };
      return this.activePersona;
    }

    const payload: Record<string, any> = {};
    if (updates.username) payload["username"] = updates.username;
    if (updates.avatarColor) payload["avatar_color"] = updates.avatarColor;

    await client.from("profiles").update(payload).eq("id", userId);
    return this.getProfile(userId);
  }

  public async switchPersona(personaName: "KENAEL" | "LUCAS92" | "THOMAS" | "EMMA"): Promise<PlayerProfile> {
    const selected = DEV_PERSONAS[personaName] || DEV_PERSONAS["KENAEL"]!;
    this.activePersona = { ...selected };
    return this.activePersona;
  }
}

export class SupabaseMatchmakingRepository implements IMatchmakingRepository {
  public async joinQueue(
    userId: string,
    mode: string = "ranked_classic",
    rating: number = 1657,
    clientSessionId?: string,
  ): Promise<QueueStatusDTO> {
    const client = getSupabaseClient();
    const now = new Date().toISOString();

    if (!client) {
      return {
        queueId: `mock-q-${Date.now()}`,
        status: "waiting",
        joinedAt: now,
      };
    }

    try {
      const { data, error } = await client.rpc("find_or_create_match", {
        p_user_id: userId,
        p_mode: mode,
        p_rating: rating,
        p_widening_window: 50,
        p_client_session_id: clientSessionId || null,
      });

      if (!error && data) {
        return {
          queueId: data.queue_id || `q-${userId}`,
          status: data.status === "matched" ? "matched" : "waiting",
          matchId: data.match_id || undefined,
          joinedAt: now,
        };
      }
    } catch {}

    const { data: insertData } = await client
      .from("matchmaking_queue")
      .insert({
        user_id: userId,
        mode,
        rating_snapshot: rating,
        status: "waiting",
        client_session_id: clientSessionId || null,
      })
      .select("id, status, joined_at")
      .single();

    return {
      queueId: insertData?.id || `q-${userId}`,
      status: "waiting",
      joinedAt: insertData?.joined_at || now,
    };
  }

  public async cancelQueue(queueId: string, userId: string): Promise<boolean> {
    const client = getSupabaseClient();
    if (!client) return true;

    const { error } = await client
      .from("matchmaking_queue")
      .update({ status: "cancelled" })
      .eq("id", queueId)
      .eq("user_id", userId);

    return !error;
  }

  public async getQueueStatus(queueId: string, userId: string): Promise<QueueStatusDTO> {
    const client = getSupabaseClient();
    if (!client) return { queueId, status: "waiting", joinedAt: new Date().toISOString() };

    const { data } = await client
      .from("matchmaking_queue")
      .select("id, status, match_id, joined_at")
      .eq("id", queueId)
      .single();

    return {
      queueId: data?.id || queueId,
      status: (data?.status as any) || "waiting",
      matchId: data?.match_id || undefined,
      joinedAt: data?.joined_at || new Date().toISOString(),
    };
  }

  public subscribeQueue(queueId: string, onMatchFound: (matchId: string) => void): () => void {
    const client = getSupabaseClient();
    if (!client) return () => {};

    const channel = client
      .channel(`queue:${queueId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "matchmaking_queue",
          filter: `id=eq.${queueId}`,
        },
        (payload: any) => {
          if (payload.new && payload.new.status === "matched" && payload.new.match_id) {
            onMatchFound(payload.new.match_id);
          }
        },
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }
}

export class SupabaseRankedRepository implements IRankedRepository {
  public async getMatchSnapshot(matchId: string, userId: string): Promise<RankedMatchSnapshotDTO> {
    const client = getSupabaseClient();
    const now = new Date().toISOString();

    if (!client) {
      throw new Error("Supabase client required for real ranked snapshot");
    }

    const { data: match, error: matchError } = await client
      .from("ranked_matches")
      .select("*")
      .eq("id", matchId)
      .single();

    if (matchError || !match) {
      throw new Error(`Match not found: ${matchId}`);
    }

    const [profA, profB] = await Promise.all([
      client.from("profiles").select("*").eq("id", match.player_a_id).single(),
      client.from("profiles").select("*").eq("id", match.player_b_id).single(),
    ]);

    const currentRoundNum = match.current_round || 1;
    const { data: roundData } = await client
      .from("ranked_rounds")
      .select("*")
      .eq("match_id", matchId)
      .eq("round_number", currentRoundNum)
      .single();

    let sanitizedRound: SanitizedRoundDTO | undefined;

    if (roundData) {
      const { data: answers } = await client
        .from("ranked_round_answers")
        .select("*")
        .eq("round_id", roundData.id);

      const ownAns = answers?.find((a: any) => a.user_id === userId);
      const opponentAns = answers?.find((a: any) => a.user_id !== userId);

      const expiresAtMs = new Date(roundData.expires_at).getTime();
      const nowMs = Date.now();
      const secondsRemaining = Math.max(0, Math.round((expiresAtMs - nowMs) / 1000));
      const isRevealed = roundData.status === "revealed" || roundData.status === "completed";

      sanitizedRound = {
        roundId: roundData.id,
        roundNumber: roundData.round_number,
        totalRounds: match.total_rounds || 8,
        questionId: roundData.question_id,
        category: roundData.category,
        difficulty: roundData.difficulty,
        prompt: roundData.prompt,
        options: roundData.options,
        secondsRemaining,
        servedAt: roundData.served_at,
        expiresAt: roundData.expires_at,
        status: roundData.status,
        selfAnswer: ownAns
          ? { selectedOptionId: ownAns.selected_option_id, lockedAt: ownAns.locked_at }
          : undefined,
        opponentLocked: !!opponentAns,
        reveal: isRevealed
          ? {
              correctOptionId: roundData.correct_option_id,
              explanation: roundData.explanation,
              playerAAnswer: answers?.find((a: any) => a.user_id === match.player_a_id),
              playerBAnswer: answers?.find((a: any) => a.user_id === match.player_b_id),
              roundWinnerId: roundData.round_winner_id,
              scoreA: match.player_a_score,
              scoreB: match.player_b_score,
            }
          : undefined,
      };
    }

    const playerA = {
      id: match.player_a_id,
      username: profA.data?.username || "KENAEL",
      country: { code: profA.data?.country_code || "FR", name: "France", flag: "🇫🇷" },
      avatarColor: profA.data?.avatar_color || "oklch(0.88 0.21 122)",
      initials: (profA.data?.username || "KN").substring(0, 2).toUpperCase(),
      rating: match.player_a_rating_before || 1657,
      score: match.player_a_score || 0,
    };

    const playerB = {
      id: match.player_b_id,
      username: profB.data?.username || "LUCAS92",
      country: { code: profB.data?.country_code || "FR", name: "France", flag: "🇫🇷" },
      avatarColor: profB.data?.avatar_color || "oklch(0.66 0.26 5)",
      initials: (profB.data?.username || "L9").substring(0, 2).toUpperCase(),
      rating: match.player_b_rating_before || 1691,
      score: match.player_b_score || 0,
    };

    return {
      matchId: match.id,
      state: match.state,
      currentRound: currentRoundNum,
      totalRounds: match.total_rounds || 8,
      startsAt: match.starts_at || now,
      playerA,
      playerB,
      round: sanitizedRound,
      completedResult:
        match.state === "completed"
          ? {
              winnerId: match.winner_id,
              isDraw: match.winner_id === null && match.player_a_score === match.player_b_score,
              playerAScore: match.player_a_score,
              playerBScore: match.player_b_score,
              playerARatingBefore: match.player_a_rating_before,
              playerARatingAfter: match.player_a_rating_after,
              playerADelta: match.player_a_delta,
              playerBRatingBefore: match.player_b_rating_before,
              playerBRatingAfter: match.player_b_rating_after,
              playerBDelta: match.player_b_delta,
            }
          : undefined,
      rematchRequestedBy: match.rematch_requested_by,
      rematchMatchId: match.rematch_match_id,
    };
  }

  public async submitRoundAnswer(
    matchId: string,
    roundNumber: number,
    userId: string,
    selectedOptionId: string,
    clientTelemetryMs?: number,
  ): Promise<MatchAnswerResultDTO> {
    const client = getSupabaseClient();
    if (!client) throw new Error("Supabase required for ranked answer submission");

    const { data: round } = await client
      .from("ranked_rounds")
      .select("*")
      .eq("match_id", matchId)
      .eq("round_number", roundNumber)
      .single();

    if (!round) throw new Error(`Round ${roundNumber} not found`);

    const now = Date.now();
    const servedAtMs = new Date(round.served_at).getTime();
    const serverResponseMs = Math.max(0, now - servedAtMs);
    const wasCorrect = round.correct_option_id === selectedOptionId;

    await client.from("ranked_round_answers").upsert({
      round_id: round.id,
      match_id: matchId,
      user_id: userId,
      selected_option_id: selectedOptionId,
      answered_at: new Date().toISOString(),
      server_response_ms: serverResponseMs,
      client_telemetry_ms: clientTelemetryMs || null,
      was_correct: wasCorrect,
      locked_at: new Date().toISOString(),
    });

    const { data: allAnswers } = await client
      .from("ranked_round_answers")
      .select("*")
      .eq("round_id", round.id);

    const bothAnswered = (allAnswers?.length || 0) >= 2;

    if (bothAnswered && round.status === "active") {
      await client
        .from("ranked_rounds")
        .update({
          status: "revealed",
          revealed_at: new Date().toISOString(),
        })
        .eq("id", round.id);
    }

    return {
      roundId: round.id,
      roundNumber,
      locked: true,
      bothAnswered,
      roundStatus: bothAnswered ? "revealed" : "locked",
    };
  }

  public async requestRematch(
    matchId: string,
    userId: string,
  ): Promise<{ success: boolean; newMatchId?: string | undefined }> {
    const client = getSupabaseClient();
    if (!client) return { success: true, newMatchId: `rematch-${Date.now()}` };

    await client
      .from("ranked_matches")
      .update({ rematch_requested_by: userId })
      .eq("id", matchId);

    return { success: true };
  }

  public subscribeMatch(
    matchId: string,
    userId: string,
    onUpdate: (snapshot: RankedMatchSnapshotDTO) => void,
  ): () => void {
    const client = getSupabaseClient();
    if (!client) return () => {};

    const channel = client
      .channel(`match:${matchId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ranked_matches",
          filter: `id=eq.${matchId}`,
        },
        async () => {
          const snapshot = await this.getMatchSnapshot(matchId, userId);
          onUpdate(snapshot);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ranked_rounds",
          filter: `match_id=eq.${matchId}`,
        },
        async () => {
          const snapshot = await this.getMatchSnapshot(matchId, userId);
          onUpdate(snapshot);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ranked_round_answers",
          filter: `match_id=eq.${matchId}`,
        },
        async () => {
          const snapshot = await this.getMatchSnapshot(matchId, userId);
          onUpdate(snapshot);
        },
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }
}

export class SupabaseSocialRepository implements ISocialRepository {
  public async getRivalries(_userId: string): Promise<PlayerRivalry[]> {
    return socialEngine.getRivalries();
  }

  public async recordRivalryMatch(opponentUsername: string, userWon: boolean): Promise<void> {
    socialEngine.recordRivalryMatch(opponentUsername, userWon);
  }
}

export class SupabaseRecordsRepository implements IRecordsRepository {
  public async getPlayerModeRecords(userId: string): Promise<PlayerModeRecordsSummary> {
    return recordsEngine.getPlayerModeRecords(userId);
  }

  public async getPlayerSkillDimensions(userId: string): Promise<PlayerSkillDimensions> {
    return recordsEngine.getPlayerSkillDimensions(userId);
  }

  public async saveModeRecord(_userId: string, _modeSlug: string, _value: number): Promise<boolean> {
    return true;
  }
}

export class SupabaseMatchReviewRepository implements IMatchReviewRepository {
  public async getMatchReview(matchId: string, playerId: string): Promise<MatchReviewDTO> {
    const client = getSupabaseClient();
    if (!client) {
      const rankedRepo = new SupabaseRankedRepository();
      const snap = await rankedRepo.getMatchSnapshot(matchId, playerId);
      return generateMatchReviewDTO(snap, playerId);
    }

    try {
      const { data: reviewData } = await client
        .from("match_reviews")
        .select("*")
        .eq("match_id", matchId)
        .eq("player_id", playerId)
        .single();

      if (reviewData) {
        const { data: roundsData } = await client
          .from("match_round_reviews")
          .select("*")
          .eq("match_review_id", reviewData.id)
          .order("round_number", { ascending: true });

        // Load opponent profile
        const rankedRepo = new SupabaseRankedRepository();
        const snap = await rankedRepo.getMatchSnapshot(matchId, playerId);
        const opponent = snap.playerA.id === playerId ? snap.playerB : snap.playerA;

        return {
          id: reviewData.id,
          matchId: reviewData.match_id,
          playerId: reviewData.player_id,
          playerUsername: snap.playerA.id === playerId ? snap.playerA.username : snap.playerB.username,
          opponentId: opponent.id,
          opponentUsername: opponent.username,
          finalScorePlayer: reviewData.actual_score,
          finalScoreOpponent: snap.playerA.id === playerId ? snap.playerB.score : snap.playerA.score,
          isVictory: reviewData.actual_score > (snap.playerA.id === playerId ? snap.playerB.score : snap.playerA.score),
          isDraw: reviewData.actual_score === (snap.playerA.id === playerId ? snap.playerB.score : snap.playerA.score),
          arenaRatingBefore: reviewData.arena_rating_at_match,
          arenaRatingAfter: reviewData.arena_rating_at_match + reviewData.performance_delta,
          arenaRatingDelta: snap.completedResult?.playerADelta || 0,
          performanceRating: reviewData.performance_rating,
          performanceDelta: reviewData.performance_delta,
          accuracyPercent: reviewData.accuracy_percent,
          avgResponseMs: reviewData.avg_response_ms,
          opponentAvgResponseMs: 3100,
          expectedScore: Number(reviewData.expected_score),
          actualScore: reviewData.actual_score,
          summary: reviewData.summary_jsonb,
          strongestCategory: reviewData.strongest_category,
          costliestCategory: reviewData.costliest_category,
          rounds: (roundsData || []).map((r: any) => ({
            roundNumber: r.round_number,
            questionId: r.question_id,
            category: r.category,
            subcategory: r.subcategory,
            prompt: r.prompt,
            playerSelectedId: r.player_selected_id,
            playerSelectedLabel: r.player_selected_label,
            correctOptionId: r.correct_option_id,
            correctOptionLabel: r.correct_option_label,
            wasCorrect: r.was_correct,
            playerResponseMs: r.player_response_ms,
            peerMedianResponseMs: r.peer_median_response_ms,
            speedPercentile: r.speed_percentile,
            expectedCorrectProbability: Number(r.expected_correct_probability),
            peerAccuracy: Number(r.peer_accuracy),
            peerSampleSize: r.peer_sample_size,
            classification: r.classification,
            classificationConfidence: Number(r.classification_confidence),
            performanceDelta: r.performance_delta,
            analysisText: r.analysis_text,
            explanation: r.explanation,
            isClutch: r.is_clutch,
          })),
          analysisVersion: reviewData.analysis_version,
          createdAt: reviewData.created_at,
        };
      }
    } catch {}

    const rankedRepo = new SupabaseRankedRepository();
    const snap = await rankedRepo.getMatchSnapshot(matchId, playerId);
    return generateMatchReviewDTO(snap, playerId);
  }
}
