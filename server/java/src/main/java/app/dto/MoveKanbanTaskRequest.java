package app.dto;

public class MoveKanbanTaskRequest {
    private String taskId;
    private String fromColumn;
    private String toColumn;
    private int toIndex;

    public String getTaskId() { return taskId; }
    public void setTaskId(String taskId) { this.taskId = taskId; }

    public String getFromColumn() { return fromColumn; }
    public void setFromColumn(String fromColumn) { this.fromColumn = fromColumn; }

    public String getToColumn() { return toColumn; }
    public void setToColumn(String toColumn) { this.toColumn = toColumn; }

    public int getToIndex() { return toIndex; }
    public void setToIndex(int toIndex) { this.toIndex = toIndex; }
}