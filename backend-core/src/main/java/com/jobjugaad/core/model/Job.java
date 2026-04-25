package com.jobjugaad.core.model;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import lombok.Data;

import java.util.Date;
import java.util.List;
import java.util.UUID;

@Data
@Entity
@Table(name = "jobs")
public class Job {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private String title;
    private String company;
    private String location;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "job_required_skills", joinColumns = @JoinColumn(name = "job_id"))
    @Column(name = "required_skill")
    private List<String> requiredSkills;

    private String experienceRange; // e.g., "0-1 Years", "Fresher"
    private Double salaryMin;
    private Double salaryMax;
    private String applyLink;
    private Date postedDate;
    private String source; // e.g., "LinkedIn", "Indeed", "Scraped"

    private boolean isActive = true;
}
