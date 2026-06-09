package app.repository.mongo;

import app.model.Projects;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectsRepository extends MongoRepository<Projects, String> {
    
    // Przykładowa metoda wyszukująca projekty konkretnego lidera z Oracle
    List<Projects> findByProjectLeaderId(Long projectLeaderId);
}