package com.jobjugaad.core.repository;

import com.jobjugaad.core.model.Application;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ApplicationRepository extends MongoRepository<Application, String> {
    List<Application> findByUserEmail(String userEmail);
    List<Application> findByJobId(String jobId);
}
