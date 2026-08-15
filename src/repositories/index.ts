import { getSupabaseClient } from "@/lib/supabase";
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
const envMode = ((import.meta as any).env?.["VITE_BACKEND_MODE"] as BackendMode) || (client ? "supabase" : "mock");

export const activeBackendMode: BackendMode = client && envMode === "supabase" ? "supabase" : "mock";

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
