package app.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Document(collection = "projects")
public class Projects {

    /**
     * Project's unique id (W MongoDB domyślnie używamy typu String dla ObjectId)
     */
    @Id
    private String idProject;

    /**
     * Project's name
     */
    private String projectName;

    /**
     * Short description about project
     */
    private String description;

    /**
     * Id as foreign key of leader from Users table (Baza Oracle)
     * Ponieważ MongoDB i Oracle to osobne bazy, przechowujemy tylko ID lidera!
     */
    private Long projectLeaderId;

    /**
     * Timestamp of project creation
     */
    private LocalDateTime createdAt;

    /**
     * Last update of changes in project
     */
    private LocalDateTime lastUpdate;

    /**
     * Date of project's deadline
     */
    private LocalDate deadline;

    /**
     * Project's status like active, in_progress, completed, planned, archived
     */
    private String status;

    /**
     * Visibility of a project: public - everyone can see it, private - only allowed users can see it
     */
    private String visibility;

    // Pusty konstruktor wymagany przez Spring Data
    public Projects() {
        this.createdAt = LocalDateTime.now();
    }

    // Dodatkowy konstruktor dla wygody
    public Projects(String projectName, String description, Long projectLeaderId) {
        this.projectName = projectName;
        this.description = description;
        this.projectLeaderId = projectLeaderId;
        this.createdAt = LocalDateTime.now();
    }

    // Metoda pomocnicza zamiast @PreUpdate z JPA
    public void updateTimestamp() {
        this.lastUpdate = LocalDateTime.now();
    }

    // Getters and Setters:
    public String getIdProject() { return idProject; }
    public void setIdProject(String idProject) { this.idProject = idProject; }

    public String getProjectName() { return projectName; }
    public void setProjectName(String projectName) { this.projectName = projectName; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Long getProjectLeaderId() { return projectLeaderId; }
    public void setProjectLeaderId(Long projectLeaderId) { this.projectLeaderId = projectLeaderId; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getLastUpdate() { return lastUpdate; }
    public void setLastUpdate(LocalDateTime lastUpdate) { this.lastUpdate = lastUpdate; }

    public LocalDate getDeadline() { return deadline; }
    public void setDeadline(LocalDate deadline) { this.deadline = deadline; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getVisibility() { return visibility; }
    public void setVisibility(String visibility) { this.visibility = visibility; }
}