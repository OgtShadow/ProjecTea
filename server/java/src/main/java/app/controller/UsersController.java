package app.controller;

import app.dto.UserSummaryResponse;
import app.model.Users;
import app.repository.jpa.UsersRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@Tag(name = "Users", description = "Users available for task assignment.")
public class UsersController {

    private final UsersRepository usersRepository;

    public UsersController(UsersRepository usersRepository) {
        this.usersRepository = usersRepository;
    }

    @GetMapping
    @Operation(summary = "List users", description = "Returns users from the database for assignment selectors.")
    public List<UserSummaryResponse> listUsers() {
        return usersRepository.findAllByOrderByUsernameAsc().stream()
                .map(this::toSummary)
                .toList();
    }

    private UserSummaryResponse toSummary(Users user) {
        String name = user.getName() == null ? "" : user.getName().trim();
        String surname = user.getSurname() == null ? "" : user.getSurname().trim();
        String displayName = (name + " " + surname).trim();

        if (displayName.isBlank()) {
            displayName = user.getUsername();
        }

        return new UserSummaryResponse(user.getIdUser(), user.getUsername(), displayName);
    }
}
