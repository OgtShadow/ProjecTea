package app.service;

import app.dto.CreateKanbanTaskRequest;
import app.dto.MoveKanbanTaskRequest;
import app.model.KanbanTask;
import app.repository.mongo.KanbanTaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class KanbanService {

    @Autowired
    private KanbanTaskRepository repository;

    public Map<String, Map<String, List<KanbanTask>>> getBoard() {
        List<KanbanTask> allTasks = repository.findAll();
        
        Map<String, List<KanbanTask>> columns = new HashMap<>();
        columns.put("todo", new ArrayList<>());
        columns.put("inprogress", new ArrayList<>());
        columns.put("done", new ArrayList<>());
        columns.put("trash", new ArrayList<>());

        for (KanbanTask task : allTasks) {
            columns.computeIfAbsent(task.getStatus(), k -> new ArrayList<>()).add(task);
        }

        return Map.of("columns", columns);
    }

    public KanbanTask createTask(CreateKanbanTaskRequest request) {
        KanbanTask task = new KanbanTask(request.getTitle(), request.getDescription(), request.getColumn());
        return repository.save(task);
    }

    public void moveTask(MoveKanbanTaskRequest request) {
        repository.findById(request.getTaskId()).ifPresent(task -> {
            task.setStatus(request.getToColumn());
            repository.save(task);
        });
    }

    public void deleteTask(String id) {
        repository.deleteById(id);
    }
}