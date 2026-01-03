import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const jobs: any[] = [];

    // 1. Fetch from Jobicy (Filtered for India)
    const jobicyRes = await fetch('https://jobicy.com/api/v2/remote-jobs?count=20&geo=india');
    if (jobicyRes.ok) {
      const data = await jobicyRes.json();
      if (data.jobs) {
        data.jobs.forEach((job: any) => {
          jobs.push({
            title: job.jobTitle,
            company: job.companyName,
            location: job.jobGeo || 'India',
            description: job.jobExcerpt || job.jobDescription?.replace(/<[^>]*>?/gm, '').substring(0, 1000),
            salary_min: job.annualSalaryMin ? parseInt(job.annualSalaryMin) : null,
            salary_max: job.annualSalaryMax ? parseInt(job.annualSalaryMax) : null,
            apply_link: job.url,
            posted_at: job.pubDate ? new Date(job.pubDate).toISOString() : new Date().toISOString(),
          });
        });
      }
    }

    // 2. Fetch from Arbeitnow (API remains consistent with Python scraper)
    const arbeitnowRes = await fetch('https://www.arbeitnow.com/api/job-board-api');
    if (arbeitnowRes.ok) {
      const data = await arbeitnowRes.json();
      data.data.forEach((job: any) => {
        const title = job.title.toLowerCase();
        // Specific filter for fresher-friendly roles
        if (title.includes('junior') || title.includes('intern') || job.remote) {
          jobs.push({
            title: job.title,
            company: job.company_name,
            location: job.location,
            description: job.description.replace(/<[^>]*>?/gm, '').substring(0, 1000),
            apply_link: job.url,
            posted_at: job.created_at ? new Date(job.created_at * 1000).toISOString() : new Date().toISOString(),
          });
        }
      });
    }

    // 3. Upsert into Supabase
    if (jobs.length > 0) {
      const { error } = await supabase
        .from('jobs')
        .upsert(jobs, { onConflict: 'apply_link' }); // Prevents duplicate entries

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ 
      success: true, 
      count: jobs.length,
      message: `Successfully synced ${jobs.length} jobs to Supabase.`
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}