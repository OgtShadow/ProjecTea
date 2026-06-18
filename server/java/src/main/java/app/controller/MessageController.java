package app.controller;

import app.dto.CreateMessageRequest;
import app.dto.MessageStatsDTO;
import app.model.Message;
import app.model.ValidationErrorResponse;
import app.service.MessageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/messages")
@Tag(name = "Messages", description = "Operations for retrieving and sending chat messages.")
public class MessageController {

    private final MessageService messageService;
    private final SimpMessagingTemplate messagingTemplate;

    public MessageController(MessageService messageService, SimpMessagingTemplate messagingTemplate) {
        this.messageService = messageService;
        this.messagingTemplate = messagingTemplate;
    }

    @GetMapping
    @Operation(summary = "Get all messages", description = "Returns the full list of stored chat messages.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Messages returned successfully",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = Message.class))))
    })
    public List<Message> getMessages() {
        return messageService.findAll();
    }

    @PostMapping
    @Operation(summary = "Send a message", description = "Stores a new message and broadcasts it to connected websocket clients.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Message stored successfully",
                    content = @Content(schema = @Schema(implementation = Message.class))),
            @ApiResponse(responseCode = "400", description = "Validation error",
                content = @Content(schema = @Schema(implementation = ValidationErrorResponse.class))),
            @ApiResponse(responseCode = "401", description = "Not authenticated")
    })
        public Message sendMessage(@Valid @RequestBody CreateMessageRequest message, Principal principal) {
        Message input = new Message();
        input.setFrom(principal.getName());
        input.setText(message.getText());

        Message saved = messageService.add(input);
        messagingTemplate.convertAndSend("/topic/messages", saved);
        return saved;
    }

    @GetMapping("/debug/count")
    public ResponseEntity<Long> getMessageCount() {
        long count = messageService.getMessageCount();
        logger.info("Total messages in database: {}", count);
        return ResponseEntity.ok(count);
    }
    @Operation(summary = "Get message statistics", description = "Returns statistics of messages grouped by sender.")
    public ResponseEntity<List<MessageStatsDTO>> getMessageStats() {
        logger.info("Stats endpoint called");
        List<MessageStatsDTO> stats = messageService.getStatistics();
        logger.info("Returning {} stats", stats.size());
        return ResponseEntity.ok(stats);
    }
}
