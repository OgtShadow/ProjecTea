package app.controller;

import app.model.Message;
import app.dto.MessageStatsDTO;
import app.service.MessageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.List;

@Controller
public class WebSocketController {
    private static final Logger logger = LoggerFactory.getLogger(WebSocketController.class);
    private final MessageService messageService;
    private final SimpMessagingTemplate messagingTemplate;

    public WebSocketController(MessageService messageService, SimpMessagingTemplate messagingTemplate) {
        this.messageService = messageService;
        this.messagingTemplate = messagingTemplate;
    }

    @MessageMapping("/send")
    @SendTo("/topic/messages")
    public Message broadcast(Message message, Principal principal) {
        if (principal != null) {
            message.setFrom(principal.getName());
        }

        Message savedMessage = messageService.add(message);
        logger.info("Broadcasting message from: {}", message.getFrom());

        List<MessageStatsDTO> stats = messageService.getStatistics();
        logger.info("Publishing {} stats to /topic/stats", stats.size());
        stats.forEach(s -> logger.debug("  - {}: {}", s.getFrom(), s.getCount()));

        messagingTemplate.convertAndSend("/topic/stats", stats);

        return savedMessage;
    }
}