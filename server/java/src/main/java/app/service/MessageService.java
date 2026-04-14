package app.service;

import app.model.Message;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class MessageService {

    private final AtomicLong idCounter = new AtomicLong(1);
    private final List<Message> messages = Collections.synchronizedList(new ArrayList<>());

    public List<Message> findAll() {
        return new ArrayList<>(messages);
    }

    public Message add(Message message) {
        long id = idCounter.getAndIncrement();
        Message saved = new Message(id, message.getFrom(), message.getText());
        messages.add(saved);
        return saved;
    }
}
