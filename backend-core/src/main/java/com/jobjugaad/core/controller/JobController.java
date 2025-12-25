package com.jobjugaad.core.controller;

import com.jobjugaad.core.model.Job;
import com.jobjugaad.core.service.JobService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/jobs")
public class JobController {
    @Autowired
    private JobService jobService;

    @GetMapping
    public List<Job> getJobs() {
        return jobService.getAllActiveJobs();
    }

    @GetMapping("/search")
    public List<Job> search(@RequestParam String title) {
        return jobService.searchJobs(title);
    }

    @PostMapping
    public Job createJob(@RequestBody Job job) {
        return jobService.saveJob(job);
    }
}
