package app.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "AuthUserResponse", description = "Authenticated user details for current session.")
public class AuthUserResponse {

    @Schema(description = "Authenticated username.", example = "Kacperek")
    private final String username;

    public AuthUserResponse(String username) {
        this.username = username;
    }

    public String getUsername() {
        return username;
    }
}
