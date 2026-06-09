package app.controller;

import app.model.Message;
import app.dto.MessageStatsDTO;
import app.service.MessageService;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.List;

@Controller
public class WebSocketController {

    private final MessageService messageService;
    private final SimpMessagingTemplate messagingTemplate;

    public WebSocketController(MessageService messageService, SimpMessagingTemplate messagingTemplate) {
        this.messageService = messageService;
        this.messagingTemplate = messagingTemplate; // Pozwala wysyłać dane na dowolne kanały z kodu
    }

    @MessageMapping("/send")
    @SendTo("/topic/messages")
    public Message broadcast(Message message, Principal principal) {
        if (principal != null) {
            message.setFrom(principal.getName());
        }
        
        // 1. Zapisujemy wiadomość w MongoDB
        Message savedMessage = messageService.add(message);

        // 2. Pobieramy zaktualizowane statystyki dla wykresów z MongoDB
        List<MessageStatsDTO> stats = messageService.getStatistics();

        // 3. Wypychamy statystyki na osobny kanał WebSocketa
        // Front-end (wykres) powinien nasłuchiwać na adresie: /topic/stats
        messagingTemplate.convertAndSend("/topic/stats", stats);

        // 4. Zwracamy zapisaną wiadomość na standardowy kanał czatu (/topic/messages)
        return savedMessage;
    }
}