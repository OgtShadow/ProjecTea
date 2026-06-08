package app.repository.jpa;

import app.model.Projects;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectsRepository extends JpaRepository<Projects, Long> {
    // Zwraca wszystkie projekty danego użytkownika
    List<Projects> findByProjectLeaderIdUser(Long idUser);
}