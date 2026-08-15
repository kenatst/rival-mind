/**
 * Typed environment configuration.
 * Separates browser-safe variables from server-only variables.
 */

export const env = {
  // Public browser-safe variables
  supabaseUrl: (typeof import.meta !== "undefined" && import.meta.env && import.meta.env["VITE_SUPABASE_URL"]) || "",
  supabaseAnonKey: (typeof import.meta !== "undefined" && import.meta.env && import.meta.env["VITE_SUPABASE_ANON_KEY"]) || "",
  useMockBackend: (typeof import.meta !== "undefined" && import.meta.env && import.meta.env["VITE_USE_MOCK_BACKEND"] === "true") || false,
  isDev: (typeof import.meta !== "undefined" && import.meta.env?.DEV) || false,
  isProd: (typeof import.meta !== "undefined" && import.meta.env?.PROD) || false,

  // Helper to check if real Supabase credentials are configured
  isSupabaseConfigured(): boolean {
    return Boolean(this.supabaseUrl && this.supabaseAnonKey && this.supabaseUrl !== "https://your-project.supabase.co");
  },
};
