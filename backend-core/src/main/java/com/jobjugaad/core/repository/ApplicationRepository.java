package com.jobjugaad.core.repository;

import com.jobjugaad.core.model.Application;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, UUID> {
    List<Application> findByUserEmail(String userEmail);
    List<Application> findByJobId(String jobId);
}
