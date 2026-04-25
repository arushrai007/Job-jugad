"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Search, Zap, TrendingUp, Target, ChevronRight, Menu, X, Sparkles, Palette, FileText, Layout, Pencil } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { AnimatedBackground } from "@/components/animated-background";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function LandingPage() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [latestJob, setLatestJob] = useState<any>(null);
  const [totalJobs, setTotalJobs] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/jobs?q=${encodeURIComponent(searchQuery)}`);
    } else {
      router.push('/jobs');
    }
  };

  useEffect(() => {
    async function fetchData() {
      const { data: jobs } = await supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (jobs && jobs.length > 0) {
        setLatestJob(jobs[0]);
      }

      const { count } = await supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true });
      
      if (count) {
        setTotalJobs(count);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <AnimatedBackground />
      
      {/* Navbar */}
      <nav className="fixed top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-xl">
              JJ
            </div>
            <span className="text-xl font-bold tracking-tight">Job Jugaad</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link href="/feed" className="text-sm font-medium hover:text-primary transition-colors">Feed</Link>
            <Link href="/jobs" className="text-sm font-medium hover:text-primary transition-colors">Jobs</Link>
            <Link href="/salary" className="text-sm font-medium hover:text-primary transition-colors">Salary Predictor</Link>
            <div className="flex items-center gap-4 border-l pl-4 border-border/50">
              <Link href="/resume" className="text-sm font-medium hover:text-primary transition-colors">Resume AI</Link>
              <Link href="/resume/maker" className="text-sm font-medium px-3 py-1 bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors">Resume Maker</Link>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <ThemeSwitcher />
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </div>

          <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden border-b bg-background p-4 flex flex-col gap-4"
          >
            <div className="flex justify-between items-center px-2">
              <span className="text-sm font-medium text-muted-foreground">Appearance</span>
              <ThemeSwitcher />
            </div>
            <hr />
            <Link href="/feed" className="text-lg font-medium">Feed</Link>
            <Link href="/jobs" className="text-lg font-medium">Jobs</Link>
            <Link href="/salary" className="text-lg font-medium">Salary Predictor</Link>
            <Link href="/resume" className="text-lg font-medium">Resume AI</Link>
            <Link href="/resume/maker" className="text-lg font-medium text-primary">Resume Maker</Link>
            <hr />
            <Link href="/login" className="w-full">
              <Button variant="outline" className="w-full">Login</Button>
            </Link>
            <Link href="/register" className="w-full">
              <Button className="w-full">Register</Button>
            </Link>
          </motion.div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Badge variant="secondary" className="mb-6 px-4 py-1 text-sm font-medium">
              #1 Platform for {totalJobs > 0 ? totalJobs.toLocaleString() + "+" : ""} Freshers & Students 🚀
            </Badge>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mx-auto max-w-4xl text-5xl font-extrabold tracking-tight md:text-7xl lg:text-8xl"
          >
            Land Your First Job with <span className="text-primary">AI Jugaad</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mx-auto mt-8 max-w-2xl text-lg text-muted-foreground md:text-xl"
          >
            No Experience? No Problem. We use AI to match your potential with {totalJobs > 0 ? totalJobs.toLocaleString() : "10,000+"} fresher-only roles across the globe.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-2xl">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
                <Input 
                  placeholder="Search 'Junior Developer', 'Intern'..." 
                  className="pl-10 h-14 rounded-full text-lg shadow-xl border-primary/20 focus-visible:ring-primary"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button type="submit" size="lg" className="h-14 px-8 rounded-full text-lg shadow-lg w-full sm:w-auto">
                Find Jobs
              </Button>
            </form>
          </motion.div>
        </div>
      </section>

      {/* Resume Maker Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2">
              <Badge variant="outline" className="mb-4 border-primary text-primary">Resume Maker 2.0</Badge>
              <h2 className="text-4xl md:text-5xl font-black mb-6 leading-tight">
                Build a Resume that <br />
                <span className="text-primary underline decoration-wavy underline-offset-8">Actually</span> Gets Read.
              </h2>
              <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
                Choose from our library of high-converting templates designed specifically for freshers. 
                Edit live, see changes instantly, and export to PDF in seconds. No more formatting nightmares.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
                <div className="flex gap-4">
                  <div className="h-10 w-10 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <Layout className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold">ATS-Friendly</h4>
                    <p className="text-sm text-muted-foreground">Optimized layouts for systems.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="h-10 w-10 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <Pencil className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold">Live Editor</h4>
                    <p className="text-sm text-muted-foreground">See your changes in real-time.</p>
                  </div>
                </div>
              </div>

              <Link href="/resume/maker">
                <Button size="lg" className="rounded-full h-14 px-10 text-lg shadow-xl shadow-primary/20">
                  Start Building Now <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>

            <div className="lg:w-1/2 relative">
              <div className="relative z-10 p-4 bg-muted/50 rounded-[2rem] border backdrop-blur-sm">
                <div className="bg-background rounded-2xl border shadow-2xl overflow-hidden aspect-[3/4] p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-primary/20 rounded animate-pulse" />
                      <div className="h-2 w-48 bg-muted rounded" />
                    </div>
                    <div className="h-12 w-12 bg-muted rounded-full" />
                  </div>
                  <div className="space-y-4">
                    <div className="h-3 w-full bg-muted rounded" />
                    <div className="h-3 w-[90%] bg-muted rounded" />
                    <div className="h-3 w-[95%] bg-muted rounded" />
                  </div>
                  <div className="mt-12 space-y-6">
                    <div className="space-y-2">
                      <div className="h-3 w-24 bg-primary/20 rounded" />
                      <div className="h-3 w-full bg-muted rounded" />
                      <div className="h-3 w-[80%] bg-muted rounded" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 w-24 bg-primary/20 rounded" />
                      <div className="h-3 w-full bg-muted rounded" />
                      <div className="h-3 w-[85%] bg-muted rounded" />
                    </div>
                  </div>
                </div>
                
                {/* Floating Preview Card */}
                <motion.div 
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -top-6 -right-6 p-4 bg-background rounded-2xl border shadow-xl flex items-center gap-3"
                >
                  <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">ATS Score</p>
                    <p className="text-sm font-bold">98/100</p>
                  </div>
                </motion.div>
                
                {/* Template Switcher Preview */}
                <motion.div 
                  animate={{ x: [0, 10, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -bottom-6 -left-6 p-4 bg-background rounded-2xl border shadow-xl"
                >
                  <div className="flex gap-2">
                    <div className="h-8 w-8 rounded bg-zinc-100 border" />
                    <div className="h-8 w-8 rounded bg-primary/10 border-primary border" />
                    <div className="h-8 w-8 rounded bg-zinc-900 border" />
                  </div>
                  <p className="text-[10px] text-center mt-2 font-medium text-muted-foreground">Select Template</p>
                </motion.div>
              </div>
              
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[120%] w-[120%] bg-primary/5 rounded-full blur-[100px] -z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold md:text-4xl">Engineered for the 0-2 Year Pro</h2>
            <p className="mt-4 text-muted-foreground">Why settle for platforms built for senior devs?</p>
          </div>

          <motion.div 
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid gap-8 md:grid-cols-2 lg:grid-cols-4"
          >
            {[
              {
                icon: <Zap className="h-8 w-8 text-yellow-500" />,
                title: "Real-time Scraping",
                desc: "Fresher jobs from LinkedIn, Indeed & Wellfound fetched every 15 minutes."
              },
              {
                icon: <Target className="h-8 w-8 text-primary" />,
                title: "AI Resume Match",
                desc: "Our NLP model scores your projects against job descriptions automatically."
              },
              {
                icon: <TrendingUp className="h-8 w-8 text-green-500" />,
                title: "Salary Predictor",
                desc: "Know your worth before you sign. Predict salaries based on your unique skills."
              },
              {
                icon: <Search className="h-8 w-8 text-blue-500" />,
                title: "Vertical Feed",
                desc: "Discover jobs like you scroll TikTok. Swipe through hiring alerts and tips."
              }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                variants={fadeInUp}
                className="group rounded-2xl border bg-background p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
              >
                <div className="mb-4 rounded-xl bg-muted p-3 w-fit group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Vertical Feed Preview (Reels) */}
      <section className="py-20 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="md:w-1/2">
              <Badge className="mb-4">Exclusive Feature</Badge>
              <h2 className="text-4xl font-bold mb-6">Discovery, Re-imagined.</h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Tired of boring job lists? Our <strong>Job Reels</strong> system uses AI to rank 
                the hottest fresher openings and interview prep content in a vertical feed. 
                Save, Like, and Apply with a single tap.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  </div>
                  <span>Personalized ranking based on your profile</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  </div>
                  <span>Instant application redirection</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  </div>
                  <span>Micro-tips from HR experts</span>
                </li>
              </ul>
              <Link href="/feed">
                <Button size="lg" className="rounded-full px-8">
                  Open Feed <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            
            <div className="md:w-1/2 relative h-[600px] w-full flex justify-center">
              <motion.div 
                initial={{ rotate: -5, y: 20 }}
                whileInView={{ rotate: 0, y: 0 }}
                className="relative z-10 w-[300px] h-[550px] bg-zinc-900 rounded-[3rem] border-[8px] border-zinc-800 shadow-2xl overflow-hidden"
              >
                <div className="absolute top-0 w-full h-8 bg-black flex justify-center pt-1">
                  <div className="w-20 h-4 bg-zinc-800 rounded-full" />
                </div>
                <AnimatePresence mode="wait">
                  {latestJob ? (
                    <motion.div 
                      key={latestJob.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.1 }}
                      className="h-full w-full bg-gradient-to-b from-blue-600 to-purple-600 p-6 flex flex-col justify-end text-white"
                    >
                      <div className="space-y-4">
                        <Badge variant="outline" className="text-white border-white bg-white/10">
                          <Sparkles className="mr-1 h-3 w-3" /> Trending Job
                        </Badge>
                        <h4 className="text-2xl font-bold leading-tight">{latestJob.title}</h4>
                        <p className="text-sm font-medium opacity-90">{latestJob.company} • {latestJob.location}</p>
                        <div className="flex items-baseline gap-1">
                          {latestJob.salary_min ? (
                            <>
                              <span className="text-lg font-bold">₹{(latestJob.salary_min / 100000).toFixed(1)}L+</span>
                              <span className="text-xs opacity-75">/yr</span>
                            </>
                          ) : (
                            <span className="text-lg font-bold">Competitive Pay</span>
                          )}
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button 
                            size="sm" 
                            className="w-full bg-white text-black hover:bg-zinc-200 rounded-full"
                            onClick={() => window.parent.postMessage({ type: "OPEN_EXTERNAL_URL", data: { url: latestJob.apply_link } }, "*")}
                          >
                            Apply Now
                          </Button>
                          <Button size="sm" variant="outline" className="border-white text-white hover:bg-white/10 rounded-full">Save</Button>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="h-full w-full bg-zinc-800 animate-pulse flex items-center justify-center">
                      <p className="text-zinc-500 text-sm">Loading latest jobs...</p>
                    </div>
                  )}
                </AnimatePresence>
              </motion.div>
              <div className="absolute top-20 -right-4 h-64 w-64 bg-primary/30 rounded-full blur-3xl -z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-background">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
              JJ
            </div>
            <span className="text-lg font-bold tracking-tight">Job Jugaad</span>
          </div>
          <p className="text-muted-foreground text-sm max-w-md mx-auto mb-8">
            The all-in-one AI career toolkit for the next generation of workforce. 
            Built for freshers, by people who remember being freshers.
          </p>
          <div className="flex justify-center gap-8 mb-8 text-sm font-medium">
            <Link href="/about">About</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/contact">Contact</Link>
          </div>
          <div className="text-muted-foreground text-xs">
            © {new Date().getFullYear()} Job Jugaad Inc. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
