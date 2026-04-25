export interface FresherJob {
  id?: string;
  title: string;
  company: string;
  location: string;
  description: string;
  salary_min: number | null;
  salary_max: number | null;
  apply_link: string;
  posted_at: string;
  created_at?: string;
  source?: string;
}

export function getFresherJobsDebugInfo() {
  const configuredAiServicesUrl = process.env.AI_SERVICES_URL;
  return {
    hasSupabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    hasSupabaseServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    hasSupabaseAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    aiServicesUrl: configuredAiServicesUrl || "http://localhost:8000",
    aiServicesCandidates: configuredAiServicesUrl
      ? [configuredAiServicesUrl]
      : ["http://localhost:8000", "http://ai-services:8000"],
  };
}

export interface FresherJobsDebugInfo extends ReturnType<typeof getFresherJobsDebugInfo> {
  refreshRequested: boolean;
  syncAttempted: boolean;
  syncSucceeded: boolean;
  syncCount: number;
  syncError: string | null;
  queryStrategy: "primary" | "legacy" | "none";
  queryError: string | null;
}

export interface FresherJobsResult {
  jobs: FresherJob[];
  debug: FresherJobsDebugInfo;
}

interface JobRow {
  id?: string;
  title: string;
  company: string;
  link: string;
  date: string;
  source: string;
  location?: string | null;
  description?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  created_at?: string | null;
}

interface LegacyJobRow {
  id?: string;
  title: string;
  company: string;
  location?: string | null;
  description?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  apply_link: string;
  posted_at?: string | null;
  created_at?: string | null;
  source?: string | null;
}

function normalizeText(value: string | null | undefined) {
  return (value ?? "").toLowerCase().trim();
}

function isWithinDays(dateString: string, days: number) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return false;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return date >= cutoff;
}

function mapRowToJob(row: JobRow): FresherJob {
  return {
    id: row.id,
    title: row.title,
    company: row.company,
    location: row.location ?? "Remote",
    description: row.description ?? "",
    salary_min: row.salary_min ?? null,
    salary_max: row.salary_max ?? null,
    apply_link: row.link,
    posted_at: row.date,
    created_at: row.created_at ?? undefined,
    source: row.source,
  };
}

function mapLegacyRowToJob(row: LegacyJobRow): FresherJob {
  return {
    id: row.id,
    title: row.title,
    company: row.company,
    location: row.location ?? "Remote",
    description: row.description ?? "",
    salary_min: row.salary_min ?? null,
    salary_max: row.salary_max ?? null,
    apply_link: row.apply_link,
    posted_at: row.posted_at ?? row.created_at ?? new Date().toISOString(),
    created_at: row.created_at ?? undefined,
    source: row.source ?? "legacy",
  };
}

async function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  const { createClient } = await import("@supabase/supabase-js");
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function getAiServiceCandidates() {
  const candidates = getFresherJobsDebugInfo().aiServicesCandidates;
  return [...new Set(candidates.filter(Boolean))];
}

export async function syncFresherJobsToSupabase() {
  let lastError: Error | null = null;

  for (const aiServicesUrl of getAiServiceCandidates()) {
    try {
      const response = await fetch(`${aiServicesUrl}/jobs/sync`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        cache: "no-store",
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.detail || payload.error || `Unable to sync jobs via ${aiServicesUrl}.`);
      }

      return {
        count: payload.deduplicated ?? payload.inserted ?? 0,
        jobs: payload.jobs ?? [],
        sources: payload.sources ?? {},
        aiServicesUrl,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown AI service sync error");
    }
  }

  throw new Error(lastError?.message || "Unable to sync jobs.");
}

export async function getFresherJobs(options?: {
  days?: number;
  limit?: number;
  refresh?: boolean;
}) {
  const days = options?.days ?? 2;
  const limit = options?.limit ?? 100;
  const debug: FresherJobsDebugInfo = {
    ...getFresherJobsDebugInfo(),
    refreshRequested: Boolean(options?.refresh),
    syncAttempted: false,
    syncSucceeded: false,
    syncCount: 0,
    syncError: null,
    queryStrategy: "none",
    queryError: null,
  };

  if (options?.refresh) {
    try {
      debug.syncAttempted = true;
      const syncResult = await syncFresherJobsToSupabase();
      debug.syncSucceeded = true;
      debug.syncCount = syncResult.count;
      debug.aiServicesUrl = syncResult.aiServicesUrl;
    } catch (error) {
      debug.syncError = error instanceof Error ? error.message : "Remote sync skipped";
      console.warn("Remote sync skipped", error);
    }
  }

  const supabase = await getSupabaseClient();
  if (!supabase) {
    debug.queryError = "Supabase client could not be created from current environment variables.";
    return { jobs: [] as FresherJob[], debug };
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const { data, error } = await supabase
    .from("jobs")
    .select("id,title,company,link,date,source,location,description,salary_min,salary_max,created_at")
    .gte("date", cutoff.toISOString())
    .order("date", { ascending: false })
    .limit(limit);

  if (!error) {
    debug.queryStrategy = "primary";
    return {
      jobs: ((data ?? []) as JobRow[])
        .filter((job) => Boolean(job.title && job.company && job.link) && isWithinDays(job.date, days))
        .map(mapRowToJob),
      debug,
    };
  }

  const legacy = await supabase
    .from("jobs")
    .select("id,title,company,location,description,salary_min,salary_max,apply_link,posted_at,created_at,source")
    .gte("posted_at", cutoff.toISOString())
    .order("posted_at", { ascending: false })
    .limit(limit);

  if (legacy.error) {
    debug.queryError = `Primary query failed: ${error.message}. Legacy query failed: ${legacy.error.message}`;
    console.warn("Supabase jobs query failed", {
      primary: error.message,
      legacy: legacy.error.message,
    });
    return { jobs: [] as FresherJob[], debug };
  }

  debug.queryStrategy = "legacy";
  debug.queryError = error.message;

  return {
    jobs: ((legacy.data ?? []) as LegacyJobRow[])
      .filter(
        (job) =>
          Boolean(job.title && job.company && job.apply_link) &&
          isWithinDays(job.posted_at ?? job.created_at ?? "", days)
      )
      .map(mapLegacyRowToJob),
    debug,
  };
}
