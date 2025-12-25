package com.jobjugaad.core.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.Date;
import java.util.List;

@Data
@Document(collection = "jobs")
public class Job {
    @Id
    private String id;
    private String title;
    private String company;
    private String location;
    private String description;
    private List<String> requiredSkills;
    private String experienceRange; // e.g., "0-1 Years", "Fresher"
    private Double salaryMin;
    private Double salaryMax;
    private String applyLink;
    private Date postedDate;
    private String source; // e.g., "LinkedIn", "Indeed", "Scraped"
    private boolean isActive = true;
}
