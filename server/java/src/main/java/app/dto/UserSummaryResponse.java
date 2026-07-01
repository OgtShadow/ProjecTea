package app.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Lightweight user representation used for assignee pickers.")
public class UserSummaryResponse {

    @Schema(description = "User identifier.", example = "1")
    private final Long id;

    @Schema(description = "Unique username.", example = "OGT_SHADOW")
    private final String username;

    @Schema(description = "Display name.", example = "Jan Kowalski")
    private final String displayName;

    public UserSummaryResponse(Long id, String username, String displayName) {
        this.id = id;
        this.username = username;
        this.displayName = displayName;
    }

    public Long getId() {
        return id;
    }

    public String getUsername() {
        return username;
    }

    public String getDisplayName() {
        return displayName;
    }
}
