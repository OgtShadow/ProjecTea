package app.repository;

import app.model.Users;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UsersRepository extends JpaRepository<Users, Long> {
    // Spring z automatu wie jak wykonać zapytanie dzięki nazwie metody!
    Optional<Users> findByUsername(String username);
    Optional<Users> findByEmail(String email);
}