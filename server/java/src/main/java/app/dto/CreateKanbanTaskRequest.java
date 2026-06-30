package app.dto;

public class CreateKanbanTaskRequest {
    private String title;
    private String description;
    private String column;

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getColumn() { return column; }
    public void setColumn(String column) { this.column = column; }
}