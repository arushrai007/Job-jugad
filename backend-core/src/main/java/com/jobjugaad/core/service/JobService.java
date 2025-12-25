package com.jobjugaad.core.service;

import com.jobjugaad.core.model.Job;
import com.jobjugaad.core.repository.JobRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class JobService {
    @Autowired
    private JobRepository jobRepository;

    public List<Job> getAllActiveJobs() {
        return jobRepository.findByIsActiveTrue();
    }

    public List<Job> searchJobs(String title) {
        return jobRepository.findByTitleContainingIgnoreCase(title);
    }

    public Job saveJob(Job job) {
        return jobRepository.save(job);
    }
}
