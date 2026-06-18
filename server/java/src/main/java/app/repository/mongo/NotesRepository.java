package app.repository.mongo;

import app.model.Notes;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NotesRepository extends MongoRepository<Notes, String> {
}