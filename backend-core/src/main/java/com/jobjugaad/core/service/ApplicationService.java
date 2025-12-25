package com.jobjugaad.core.service;

import com.jobjugaad.core.model.Application;
import com.jobjugaad.core.repository.ApplicationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;

@Service
public class ApplicationService {
    @Autowired
    private ApplicationRepository applicationRepository;

    public Application applyForJob(String jobId, String userEmail) {
        Application application = new Application();
        application.setJobId(jobId);
        application.setUserEmail(userEmail);
        application.setStatus("APPLIED");
        application.setAppliedAt(new Date());
        return applicationRepository.save(application);
    }

    public List<Application> getUserApplications(String userEmail) {
        return applicationRepository.findByUserEmail(userEmail);
    }
}
