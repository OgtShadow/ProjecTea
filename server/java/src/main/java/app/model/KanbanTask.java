package app.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "kanban_tasks")
public class KanbanTask {
    
    @Id
    private String id;
    private String title;
    private String description;
    private String status; // np. "todo", "inprogress", "done"

    public KanbanTask() {}

    public KanbanTask(String title, String description, String status) {
        this.title = title;
        this.description = description;
        this.status = status;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}