package app.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "\"Projects\"")
public class Projects {

    /**
     * Project-s unique id
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_project")
    private Long idProject;

    /**
     * Project-s name
     */
    @Column(name = "project_name", length = 512, nullable = false)
    private String projectName;

    /**
     * Short description about project
     */
    @Column(name = "description", length = 1024, nullable = false)
    private String description;

    /**
     * Id as foreign key of leader from Users table
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fk_project_leader_id", referencedColumnName = "id_user", nullable = false)
    private Users projectLeader;

    /**
     * Timestamp of project creation
     */
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    /**
     * Last update of changes in project
     */
    @Column(name = "last_update")
    private LocalDateTime lastUpdate;

    /**
     * Date of project-s deadline
     */
    @Column(name = "deadline")
    private LocalDate deadline;

    /**
     * Project-s status like active, in_progress, completed, planned, archived
     */
    @Column(name = "status", length = 64)
    private String status;

    /**
     * Visibility of a project: public - everyone can see it, private - only allowed users can see it
     */
    @Column(name = "visibility", length = 64)
    private String visibility;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.lastUpdate = LocalDateTime.now();
    }

    // Getters and Setters:
    public Long getIdProject() { return idProject; }
    public void setIdProject(Long idProject) { this.idProject = idProject; }

    public String getProjectName() { return projectName; }
    public void setProjectName(String projectName) { this.projectName = projectName; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Users getProjectLeader() { return projectLeader; }
    public void setProjectLeader(Users projectLeader) { this.projectLeader = projectLeader; }

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