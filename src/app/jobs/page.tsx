"use client";

import { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import { 
  Search, 
  MapPin, 
  Briefcase, 
  DollarSign, 
  ArrowRight,
  RefreshCw,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  salary_min: number | null;
  salary_max: number | null;
  apply_link: string;
  created_at: string;
  posted_at: string;
  source?: string;
}

interface JobsDebug {
  hasSupabaseUrl: boolean;
  hasSupabaseServiceRoleKey: boolean;
  hasSupabaseAnonKey: boolean;
  aiServicesUrl: string;
  aiServicesCandidates: string[];
  refreshRequested: boolean;
  syncAttempted: boolean;
  syncSucceeded: boolean;
  syncCount: number;
  syncError: string | null;
  queryStrategy: "primary" | "legacy" | "none";
  queryError: string | null;
}

interface BrowserFallbackResult {
  jobs: Job[];
  error: string | null;
}

function JobsList() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("q") || "";
  
  const [jobs, setJobs] = useState<Job[]>([]);
  const [search, setSearch] = useState(initialSearch);
  const [loading, setLoading] = useState(true);
  const [indiaOnly, setIndiaOnly] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [debug, setDebug] = useState<JobsDebug | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [browserFallbackStatus, setBrowserFallbackStatus] = useState<string | null>(null);

  useEffect(() => {
    fetchJobs(false);
  }, []);

  const fetchJobsFromBrowserSupabase = async (days = 2, limit = 120): Promise<BrowserFallbackResult> => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const primary = await supabase
      .from("jobs")
      .select("id,title,company,link,date,source,location,description,salary_min,salary_max,created_at")
      .gte("date", cutoff.toISOString())
      .order("date", { ascending: false })
      .limit(limit);

    if (!primary.error) {
      return {
        jobs: (primary.data ?? []).map((job: any) => ({
          id: job.id,
          title: job.title,
          company: job.company,
          location: job.location ?? "Remote",
          description: job.description ?? "",
          salary_min: job.salary_min ?? null,
          salary_max: job.salary_max ?? null,
          apply_link: job.link,
          posted_at: job.date,
          created_at: job.created_at,
          source: job.source,
        })) as Job[],
        error: null,
      };
    }

    const legacy = await supabase
      .from("jobs")
      .select("id,title,company,location,description,salary_min,salary_max,apply_link,posted_at,created_at,source")
      .gte("posted_at", cutoff.toISOString())
      .order("posted_at", { ascending: false })
      .limit(limit);

    if (legacy.error) {
      return {
        jobs: [],
        error: `Browser fallback failed. Primary: ${primary.error.message}. Legacy: ${legacy.error.message}`,
      };
    }

    return {
      jobs: (legacy.data ?? []) as Job[],
      error: primary.error.message,
    };
  };

  const fetchJobs = async (refresh = false) => {
    try {
      setRefreshing(refresh);
      setFetchError(null);
      setBrowserFallbackStatus(null);

      const response = await fetch(`/api/jobs/fresher-feed?days=2&limit=120${refresh ? "&refresh=1" : ""}`, {
        cache: "no-store",
      });
      const payload = await response.json();
      console.info("Fresher jobs API payload", payload);

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Unable to load jobs.");
      }

      setJobs(payload.jobs || []);
      setDebug(payload.debug || null);

      if ((payload.jobs || []).length === 0 && payload.debug?.queryError?.includes("fetch failed")) {
        const fallback = await fetchJobsFromBrowserSupabase();
        if (fallback.jobs.length > 0) {
          setJobs(fallback.jobs);
          setBrowserFallbackStatus(`Loaded ${fallback.jobs.length} jobs using browser Supabase fallback.`);
        } else {
          setBrowserFallbackStatus(fallback.error || "Browser fallback returned no jobs.");
        }
      }
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Failed to fetch fresher jobs.";
      setFetchError(message);

      const fallback = await fetchJobsFromBrowserSupabase();
      if (fallback.jobs.length > 0) {
        setJobs(fallback.jobs);
        setBrowserFallbackStatus(`API failed, but browser fallback loaded ${fallback.jobs.length} jobs.`);
      } else {
        setBrowserFallbackStatus(fallback.error || "Browser fallback was attempted but returned no jobs.");
        toast.error("Failed to fetch fresher jobs.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = 
      job.title?.toLowerCase().includes(search.toLowerCase()) || 
      job.company?.toLowerCase().includes(search.toLowerCase()) ||
      job.location?.toLowerCase().includes(search.toLowerCase()) ||
      job.description?.toLowerCase().includes(search.toLowerCase());
    
    const isIndia = job.location?.toLowerCase().includes('india') || job.location?.toLowerCase().includes('remote');
    const matchesIndia = !indiaOnly || isIndia;

    return matchesSearch && matchesIndia;
  });

  return (
    <div className="container mx-auto px-4">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Job Discovery</h1>
          <p className="text-muted-foreground mt-2">Explore {filteredJobs.length} fresher roles posted in the last 48 hours.</p>
        </div>
        <div className="flex flex-col w-full md:w-auto gap-4">
          <div className="flex gap-2">
            <Button 
              variant={indiaOnly ? "default" : "outline"} 
              size="sm" 
              className="rounded-full"
              onClick={() => setIndiaOnly(!indiaOnly)}
            >
              🇮🇳 India Only
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="rounded-full"
              onClick={() => fetchJobs(true)}
              disabled={refreshing}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              Refresh Jobs
            </Button>
          </div>
          <div className="flex w-full md:w-auto gap-3">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search jobs..." 
                className="pl-10 rounded-xl"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-white/70 dark:bg-zinc-900/70 p-4 text-sm">
        <p className="font-medium">Fetch debug</p>
        <p className="text-muted-foreground mt-1">
          Open DevTools and check the browser console for the full `/api/jobs/fresher-feed` payload.
        </p>
        <div className="mt-3 grid gap-1 text-muted-foreground">
          <p>Jobs loaded: {jobs.length}</p>
          <p>Refresh requested: {debug ? (debug.refreshRequested ? "yes" : "no") : "unknown"}</p>
          <p>Sync attempted: {debug ? (debug.syncAttempted ? "yes" : "no") : "unknown"}</p>
          <p>Sync succeeded: {debug ? (debug.syncSucceeded ? "yes" : "no") : "unknown"}</p>
          <p>Synced jobs count: {debug?.syncCount ?? "unknown"}</p>
          <p>Sync error: {debug?.syncError || "none"}</p>
          <p>Supabase URL configured: {debug ? (debug.hasSupabaseUrl ? "yes" : "no") : "unknown"}</p>
          <p>Supabase anon key configured: {debug ? (debug.hasSupabaseAnonKey ? "yes" : "no") : "unknown"}</p>
          <p>Supabase service role configured: {debug ? (debug.hasSupabaseServiceRoleKey ? "yes" : "no") : "unknown"}</p>
          <p>AI services URL: {debug?.aiServicesUrl || "unknown"}</p>
          <p>AI service candidates: {debug?.aiServicesCandidates?.join(", ") || "unknown"}</p>
          <p>Query strategy: {debug?.queryStrategy || "unknown"}</p>
          <p>Query error: {debug?.queryError || "none"}</p>
          <p>Browser fallback: {browserFallbackStatus || "not used"}</p>
          <p>Last fetch error: {fetchError || "none"}</p>
        </div>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 bg-muted animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.length > 0 ? (
            filteredJobs.map((job, i) => (
              <motion.div
                key={job.id || job.apply_link}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 hover:shadow-xl transition-all h-full flex flex-col group">
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex gap-2">
                        <Badge variant="secondary">Fresher</Badge>
                        {new Date(job.posted_at) >= new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) && (
                          <Badge className="bg-orange-500 hover:bg-orange-600">New</Badge>
                        )}
                        {job.source && (
                          <Badge variant="outline" className="capitalize">{job.source}</Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(job.posted_at || job.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <CardTitle className="text-xl group-hover:text-primary transition-colors line-clamp-1">{job.title}</CardTitle>
                    <CardDescription className="flex items-center gap-1 font-medium">
                      <Briefcase className="h-3.5 w-3.5" /> {job.company}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" /> {job.location}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 font-semibold">
                        <DollarSign className="h-4 w-4" /> 
                        {job.salary_min ? (
                          `₹${(job.salary_min / 100000).toFixed(1)}L ${job.salary_max ? `- ${(job.salary_max / 100000).toFixed(1)}L` : '+'}`
                        ) : (
                          "Competitive Pay"
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {job.description}
                    </p>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button 
                      className="w-full rounded-xl" 
                      variant="outline" 
                      onClick={() => window.open(job.apply_link, "_blank", "noopener,noreferrer")}
                    >
                      Apply Now <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full text-center py-20">
              <p className="text-xl text-muted-foreground">No jobs found matching your search.</p>
              <Button variant="link" onClick={() => setSearch("")}>Clear search</Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function JobsPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pt-32 pb-20">
      <Suspense fallback={<div className="container mx-auto px-4 pt-20 text-center">Loading jobs...</div>}>
        <JobsList />
      </Suspense>
      
      <div className="fixed bottom-8 right-8">
        <Button className="rounded-full h-14 w-14 shadow-2xl" onClick={() => window.location.href = "/feed"}>
          <Zap className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}
