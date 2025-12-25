package com.jobjugaad.core.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.Date;

@Data
@Document(collection = "applications")
public class Application {
    @Id
    private String id;
    private String jobId;
    private String userEmail;
    private String status; // APPLIED, UNDER_REVIEW, REJECTED, ACCEPTED
    private Date appliedAt;
}
