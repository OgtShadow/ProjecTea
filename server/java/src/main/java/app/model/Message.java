package app.model;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "Message", description = "Represents a chat message exchanged through the API and websocket stream.")
public class Message {

    @Schema(description = "Unique identifier of the message.", example = "1", accessMode = Schema.AccessMode.READ_ONLY)
    private Long id;

    @Schema(description = "Name or identifier of the sender.", example = "Kacperek")
    private String from;

    @Schema(description = "Message content.", example = "Hello from Swagger documentation!")
    private String text;

    @Schema(description = "UTC timestamp when the message was created.", example = "2026-04-22T18:30:00Z", accessMode = Schema.AccessMode.READ_ONLY)
    private String timestamp;

    public Message() {
    }

    public Message(Long id, String from, String text) {
        this.id = id;
        this.from = from;
        this.text = text;
        timestamp = java.time.Instant.now().toString();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

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

    public String getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp;
    }

}
