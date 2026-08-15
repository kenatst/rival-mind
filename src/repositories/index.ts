import { getSupabaseClient } from "@/lib/supabase";
import { env } from "@/lib/env";
import {
  IProfileRepository,
  IMatchmakingRepository,
  IRankedRepository,
  ISocialRepository,
  IRecordsRepository,
  IMatchReviewRepository,
  BackendMode,
} from "./types";
import {
  SupabaseProfileRepository,
  SupabaseMatchmakingRepository,
  SupabaseRankedRepository,
  SupabaseSocialRepository,
  SupabaseRecordsRepository,
  SupabaseMatchReviewRepository,
  DEV_PERSONAS,
} from "./supabaseRepository";
import {
  MockProfileRepository,
  MockMatchmakingRepository,
  MockRankedRepository,
  MockSocialRepository,
  MockRecordsRepository,
  MockMatchReviewRepository,
} from "./mockRepository";

const client = getSupabaseClient();
const isProd = env.isProd;
const requestedMode = env.backendMode as BackendMode;

// In production, refuse to silently fall back to mock (Part 59)
if (isProd && !client && requestedMode === "supabase") {
  throw new Error(
    "FATAL CONFIGURATION ERROR: Supabase credentials are missing or invalid in production environment. Refusing to run in unauthenticated mock mode.",
  );
}

export const activeBackendMode: BackendMode = client && (requestedMode === "supabase" || isProd) ? "supabase" : "mock";

export const profileRepo: IProfileRepository =
  activeBackendMode === "supabase" ? new SupabaseProfileRepository() : new MockProfileRepository();

export const matchmakingRepo: IMatchmakingRepository =
  activeBackendMode === "supabase" ? new SupabaseMatchmakingRepository() : new MockMatchmakingRepository();

export const rankedRepo: IRankedRepository =
  activeBackendMode === "supabase" ? new SupabaseRankedRepository() : new MockRankedRepository();

export const socialRepo: ISocialRepository =
  activeBackendMode === "supabase" ? new SupabaseSocialRepository() : new MockSocialRepository();

export const recordsRepo: IRecordsRepository =
  activeBackendMode === "supabase" ? new SupabaseRecordsRepository() : new MockRecordsRepository();

export const matchReviewRepo: IMatchReviewRepository =
  activeBackendMode === "supabase" ? new SupabaseMatchReviewRepository() : new MockMatchReviewRepository();

export { DEV_PERSONAS };
export * from "./types";
