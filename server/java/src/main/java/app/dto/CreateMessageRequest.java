package app.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(name = "CreateMessageRequest", description = "Payload used to create a new chat message.")
public class CreateMessageRequest {

    @NotBlank(message = "text must not be blank")
    @Size(min = 1, max = 500, message = "text must be between 1 and 500 characters")
    @Schema(description = "Message content.", example = "Czesc!", minLength = 1, maxLength = 500)
    private String text;

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }
}