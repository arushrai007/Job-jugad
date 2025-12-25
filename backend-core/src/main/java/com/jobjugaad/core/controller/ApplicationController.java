package com.jobjugaad.core.controller;

import com.jobjugaad.core.model.Application;
import com.jobjugaad.core.service.ApplicationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/applications")
@CrossOrigin(origins = "*")
public class ApplicationController {

    @Autowired
    private ApplicationService applicationService;

    @PostMapping("/apply")
    public ResponseEntity<?> apply(@RequestBody Map<String, String> request) {
        String jobId = request.get("jobId");
        String userEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        
        if (userEmail == null || userEmail.equals("anonymousUser")) {
            return ResponseEntity.status(401).body("User not authenticated");
        }
        
        Application application = applicationService.applyForJob(jobId, userEmail);
        return ResponseEntity.ok(application);
    }

    @GetMapping("/my-applications")
    public ResponseEntity<List<Application>> getMyApplications() {
        String userEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        List<Application> applications = applicationService.getUserApplications(userEmail);
        return ResponseEntity.ok(applications);
    }
}
