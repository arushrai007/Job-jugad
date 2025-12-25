package com.jobjugaad.core.repository;

import com.jobjugaad.core.model.Job;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface JobRepository extends MongoRepository<Job, String> {
    List<Job> findByIsActiveTrue();
    List<Job> findByTitleContainingIgnoreCase(String title);
}
