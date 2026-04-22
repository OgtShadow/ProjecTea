package app.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(name = "CreateMessageRequest", description = "Payload used to create a new chat message.")
public class CreateMessageRequest {

    @NotBlank(message = "from must not be blank")
    @Size(min = 2, max = 30, message = "from must be between 2 and 30 characters")
    @Schema(description = "Name or identifier of the sender.", example = "Kacperek", minLength = 2, maxLength = 30)
    private String from;

    @NotBlank(message = "text must not be blank")
    @Size(min = 1, max = 500, message = "text must be between 1 and 500 characters")
    @Schema(description = "Message content.", example = "Czesc!", minLength = 1, maxLength = 500)
    private String text;

    public String getFrom() {
        return from;
    }

    public void setFrom(String from) {
        this.from = from;
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }
}