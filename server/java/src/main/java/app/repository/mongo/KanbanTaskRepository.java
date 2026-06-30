package app.repository.mongo;

import app.model.KanbanTask;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface KanbanTaskRepository extends MongoRepository<KanbanTask, String> {
}