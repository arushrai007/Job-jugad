package com.jobjugaad.core.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.List;

@Data
@Document(collection = "users")
public class User {
    @Id
    private String id;
    private String name;
    private String email;
    private String password;
    private String role; // ROLE_USER, ROLE_ADMIN
    private String graduationYear;
    private List<String> skills;
    private String resumeUrl;
    private List<String> appliedJobs;
}
