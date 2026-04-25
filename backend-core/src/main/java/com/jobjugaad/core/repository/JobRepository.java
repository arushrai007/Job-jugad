package com.jobjugaad.core.repository;

import com.jobjugaad.core.model.Job;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface JobRepository extends JpaRepository<Job, UUID> {
    List<Job> findByIsActiveTrue();
    List<Job> findByTitleContainingIgnoreCase(String title);
}
