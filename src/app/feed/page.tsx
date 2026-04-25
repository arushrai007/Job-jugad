"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Heart, 
  Share2, 
  Briefcase, 
  MapPin, 
  DollarSign, 
  ChevronUp, 
  ChevronDown,
  Sparkles,
  ExternalLink,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  salary_min: number | null;
  salary_max: number | null;
  apply_link: string;
  posted_at: string;
  source?: string;
}

export default function FeedPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [indiaOnly, setIndiaOnly] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const lastWheelEventRef = useRef(0);

  useEffect(() => {
    fetchJobs(false);
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      fetchJobs(false);
    }, 60000);

    return () => window.clearInterval(interval);
  }, []);

  const fetchJobs = async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);

      const response = await fetch(`/api/jobs/fresher-feed?days=2&limit=80${refresh ? "&refresh=1" : ""}`, {
        cache: "no-store",
      });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Unable to load fresher reels.");
      }

      setJobs((payload.jobs || []) as Job[]);
    } catch (err) {
      console.error("Failed to fetch jobs", err);
      toast.error("Failed to load jobs. Please try again later.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filteredJobs = jobs.filter(job => {
    const isIndia = job.location?.toLowerCase().includes('india') || job.location?.toLowerCase().includes('remote');
    const matchesIndia = !indiaOnly || isIndia;
    return matchesIndia;
  });

  const currentJob = filteredJobs[currentIndex];

  useEffect(() => {
    if (currentIndex > Math.max(filteredJobs.length - 1, 0)) {
      setCurrentIndex(0);
    }
  }, [currentIndex, filteredJobs.length]);

  const nextJob = () => {
    if (currentIndex < filteredJobs.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      toast.info("You've reached the end of the feed!");
    }
  };

  const prevJob = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowDown") nextJob();
      if (event.key === "ArrowUp") prevJob();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, filteredJobs.length]);

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    const now = Date.now();
    if (now - lastWheelEventRef.current < 500) return;

    if (Math.abs(event.deltaY) < 10) return;

    lastWheelEventRef.current = now;
    if (event.deltaY > 0) {
      nextJob();
    } else {
      prevJob();
    }
  };

  const openApplyLink = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleShare = async () => {
    if (!currentJob) return;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `${currentJob.title} at ${currentJob.company}`,
          text: `Fresher role: ${currentJob.title} at ${currentJob.company}`,
          url: currentJob.apply_link,
        });
      } else {
        await navigator.clipboard.writeText(currentJob.apply_link);
        toast.success("Application link copied.");
      }
    } catch {
      toast.error("Could not share this job right now.");
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950 text-white">
        <Sparkles className="h-12 w-12 animate-pulse text-primary" />
      </div>
    );
  }

  if (filteredJobs.length === 0) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-zinc-950 text-white gap-4">
        <h2 className="text-2xl font-bold">No jobs found</h2>
        <p className="text-zinc-400 text-center max-w-sm">Try broadening the India filter or refresh the feed to pull the latest fresher jobs from the last 48 hours.</p>
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => { setIndiaOnly(false); setCurrentIndex(0); }}>
            Reset Filters
          </Button>
          <Button variant="outline" onClick={() => fetchJobs(true)} disabled={refreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh Feed
          </Button>
          <Button onClick={() => window.location.href = "/"}>Back to Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-zinc-950 overflow-hidden relative font-sans" onWheel={handleWheel}>
      {/* Background Glow */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-[20%] left-[10%] h-[400px] w-[400px] rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute bottom-[20%] right-[10%] h-[400px] w-[400px] rounded-full bg-purple-600/10 blur-[120px]" />
      </div>

      {/* Filter Overlay */}
      <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50 flex gap-2">
        <Button 
          variant={indiaOnly ? "default" : "outline"} 
          size="sm" 
          className="rounded-full bg-zinc-900/50 border-white/20 text-white"
          onClick={() => { setIndiaOnly(!indiaOnly); setCurrentIndex(0); }}
        >
          🇮🇳 India
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="rounded-full bg-zinc-900/50 border-white/20 text-white"
          onClick={() => fetchJobs(true)}
          disabled={refreshing}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh 48-Hour Feed
        </Button>
      </div>

      {/* Navigation Controls */}
      <div className="absolute right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-4">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={prevJob}
          className="rounded-full bg-white/10 border-white/20 text-white hover:bg-white/20 h-12 w-12"
          disabled={currentIndex === 0}
        >
          <ChevronUp />
        </Button>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={nextJob}
          className="rounded-full bg-white/10 border-white/20 text-white hover:bg-white/20 h-12 w-12"
          disabled={currentIndex === filteredJobs.length - 1}
        >
          <ChevronDown />
        </Button>
      </div>

      <div className="h-full w-full flex items-center justify-center p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -100 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="w-full max-w-lg aspect-[9/16] max-h-[850px] relative rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl bg-zinc-900 group"
          >
            {/* Job Header Info */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent flex flex-col justify-end p-8 gap-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex gap-2 mb-4">
                  <Badge className="bg-primary hover:bg-primary/90 text-white px-3 py-1">
                    Fresher Role
                  </Badge>
                  {new Date(currentJob.posted_at) >= new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) && (
                    <Badge className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1">
                      New
                    </Badge>
                  )}
                  {currentJob.source && (
                    <Badge variant="outline" className="border-white/20 bg-white/10 capitalize text-white">
                      {currentJob.source}
                    </Badge>
                  )}
                </div>
                <h2 className="text-4xl font-extrabold text-white tracking-tight mb-2">
                  {currentJob.title}
                </h2>
                <div className="flex items-center gap-2 text-zinc-300 font-medium text-lg">
                  <Briefcase className="h-5 w-5 text-primary" />
                  {currentJob.company}
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex flex-wrap gap-3"
              >
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-white text-sm border border-white/10">
                  <MapPin className="h-4 w-4" /> {currentJob.location}
                </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-white text-sm border border-white/10">
                    <DollarSign className="h-4 w-4" /> {currentJob.salary_min ? `₹${(currentJob.salary_min / 100000).toFixed(1)}L+` : 'Competitive Pay'}
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-white text-sm border border-white/10">
                    Posted {new Date(currentJob.posted_at).toLocaleDateString()}
                  </div>
                </motion.div>

                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-zinc-400 text-sm line-clamp-3 leading-relaxed"
                >
                  {currentJob.description}
                </motion.p>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex gap-3"
                >
                  <Button 
                    className="flex-1 h-14 rounded-2xl text-lg font-bold shadow-lg"
                    onClick={() => openApplyLink(currentJob.apply_link)}
                  >
                    Apply Now <ExternalLink className="ml-2 h-5 w-5" />
                  </Button>

                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-14 w-14 rounded-2xl border-white/20 bg-white/10 hover:bg-white/20 text-white"
                  onClick={() => openApplyLink(currentJob.apply_link)}
                >
                  <Heart className="h-6 w-6" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-14 w-14 rounded-2xl border-white/20 bg-white/10 hover:bg-white/20 text-white"
                  onClick={handleShare}
                >
                  <Share2 className="h-6 w-6" />
                </Button>
              </motion.div>
            </div>
            
            {/* Visual Flare */}
            <div className="absolute top-8 left-8">
              <div className="h-12 w-12 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center font-bold text-white text-xl">
                JJ
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Header Overlay */}
      <div className="absolute top-8 left-8 z-50 hidden md:block">
        <h1 className="text-white text-2xl font-bold flex items-center gap-2">
          <Sparkles className="text-primary h-6 w-6" /> Job Reels
        </h1>
        <p className="mt-2 text-sm text-zinc-400">Scroll or use arrow keys to move through live fresher jobs.</p>
      </div>

      {/* Back Button */}
      <div className="absolute top-8 right-8 z-50">
        <Button 
          variant="ghost" 
          className="text-white hover:bg-white/10"
          onClick={() => window.location.href = "/"}
        >
          Back to Home
        </Button>
      </div>
    </div>
  );
}
