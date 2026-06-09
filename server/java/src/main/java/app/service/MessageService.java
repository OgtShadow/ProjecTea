package app.service;

import app.model.Message;
import app.dto.MessageStatsDTO;
import app.repository.mongo.MessageRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MessageService {
    private static final Logger logger = LoggerFactory.getLogger(MessageService.class);
    private final MessageRepository messageRepository;

    public MessageService(MessageRepository messageRepository) {
        this.messageRepository = messageRepository;
    }

    public List<Message> findAll() {
        return messageRepository.findAll();
    }

    public Message add(Message message) {
        if (message.getTimestamp() == null) {
            message.setTimestamp(java.time.Instant.now().toString());
        }
        Message saved = messageRepository.save(message);
        logger.info("Message saved from: {} - Total messages: {}", message.getFrom(), messageRepository.count());
        return saved;
    }

    public List<MessageStatsDTO> getStatistics() {
        List<MessageStatsDTO> stats = messageRepository.getMessageStatistics();
        logger.info("Retrieved statistics: {} entries", stats.size());
        stats.forEach(s -> logger.debug("Stats - from: {}, count: {}", s.getFrom(), s.getCount()));
        return stats;
    }

    public long getMessageCount() {
        return messageRepository.count();
    }
}