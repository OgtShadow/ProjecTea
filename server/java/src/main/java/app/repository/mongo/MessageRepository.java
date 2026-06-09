package app.repository.mongo;

import app.model.Message;
import app.dto.MessageStatsDTO;
import org.springframework.data.mongodb.repository.Aggregation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends MongoRepository<Message, String> {

    // Ta agregacja grupuje wiadomości po polu "from" i zlicza je (count) po stronie bazy MongoDB!
    @Aggregation(pipeline = {
        "{ $group: { _id: '$from', count: { $sum: 1 } } }",
        "{ $project: { from: '$_id', count: 1, _id: 0 } }"
    })
    List<MessageStatsDTO> getMessageStatistics();
}