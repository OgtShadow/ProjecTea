package app.service;

import app.model.Message;
import app.dto.MessageStatsDTO;
import app.repository.mongo.MessageRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MessageService {

    private final MessageRepository messageRepository;

    public MessageService(MessageRepository messageRepository) {
        this.messageRepository = messageRepository;
    }

    public List<Message> findAll() {
        return messageRepository.findAll();
    }

    public Message add(Message message) {
        // Zapisujemy nową wiadomość bezpośrednio w MongoDB
        if (message.getTimestamp() == null) {
            message.setTimestamp(java.time.Instant.now().toString());
        }
        return messageRepository.save(message);
    }

    public List<MessageStatsDTO> getStatistics() {
        // Pobieramy gotowe statystyki do wykresów
        return messageRepository.getMessageStatistics();
    }
}