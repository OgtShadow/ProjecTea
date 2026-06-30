package app.controller;

import app.dto.CreateKanbanTaskRequest;
import app.dto.MoveKanbanTaskRequest;
import app.model.KanbanTask;
import app.service.KanbanService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/kanban")
public class KanbanController {

    @Autowired
    private KanbanService kanbanService;

    @GetMapping
    public ResponseEntity<Map<String, Map<String, List<KanbanTask>>>> getBoard() {
        return ResponseEntity.ok(kanbanService.getBoard());
    }

    @PostMapping("/tasks")
    public ResponseEntity<KanbanTask> createTask(@RequestBody CreateKanbanTaskRequest request) {
        KanbanTask createdTask = kanbanService.createTask(request);
        return ResponseEntity.ok(createdTask);
    }

    @PostMapping("/move")
    public ResponseEntity<Void> moveTask(@RequestBody MoveKanbanTaskRequest request) {
        kanbanService.moveTask(request);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/tasks/{id}")
    public ResponseEntity<Void> deleteTask(@PathVariable String id) {
        kanbanService.deleteTask(id);
        return ResponseEntity.ok().build();
    }
}