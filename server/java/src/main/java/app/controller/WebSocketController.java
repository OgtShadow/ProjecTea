package app.controller;

import app.model.Message;
import app.service.MessageService;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
public class WebSocketController {

    private final MessageService messageService;

    public WebSocketController(MessageService messageService) {
        this.messageService = messageService;
    }

    @MessageMapping("/send")
    @SendTo("/topic/messages")
    public Message broadcast(Message message) {
        return messageService.add(message);
    }
}
