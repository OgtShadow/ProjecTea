package app.model;

import io.swagger.v3.oas.annotations.media.Schema;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "messages") // Wskazuje, że to dokument MongoDB
@Schema(name = "Message", description = "Represents a chat message exchanged through the API and websocket stream.")
public class Message {

    @Id // Oznaczenie klucza głównego dla Mongo
    @Schema(description = "Unique identifier of the message.", example = "60d5ec49f1165e34b1234567", accessMode = Schema.AccessMode.READ_ONLY)
    private String id;

    @Schema(description = "Name or identifier of the sender.", example = "Kacperek")
    private String from;

    @Schema(description = "Message content.", example = "Hello from Swagger documentation!")
    private String text;

    @Schema(description = "UTC timestamp when the message was created.", example = "2026-04-22T18:30:00Z", accessMode = Schema.AccessMode.READ_ONLY)
    private String timestamp;

    public Message() {
    }

    public Message(String from, String text) {
        this.from = from;
        this.text = text;
        this.timestamp = java.time.Instant.now().toString();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getFrom() { return from; }
    public void setFrom(String from) { this.from = from; }
    public String getText() { return text; }
    public void setText(String text) { this.text = text; }
    public String getTimestamp() { return timestamp; }
    public void setTimestamp(String timestamp) { this.timestamp = timestamp; }
}