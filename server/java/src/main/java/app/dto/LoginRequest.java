package app.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(name = "LoginRequest", description = "Payload used to create an authenticated user session.")
public class LoginRequest {

    @NotBlank(message = "username must not be blank")
    @Size(min = 2, max = 30, message = "username must be between 2 and 30 characters")
    @Schema(description = "Display name used as authenticated identity.", example = "Kacperek", minLength = 2, maxLength = 30)
    private String username;

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }
}
