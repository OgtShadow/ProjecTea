package app.config;

import app.model.Notes;
import app.repository.mongo.NotesRepository;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class MongoDBDataConfig implements CommandLineRunner {

    private final NotesRepository notesRepository;

    public MongoDBDataConfig(NotesRepository notesRepository) {
        this.notesRepository = notesRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        if (notesRepository.count() >= 0) {
            
            Notes note1 = new Notes();
            note1.setTitle("First file test note");
            note1.setContent("Testing notes to MongoDB by java file");

            Notes note2 = new Notes();
            note2.setTitle("Second Test");
            note2.setContent("Another note connected with texting");

            notesRepository.save(note1);
            notesRepository.save(note2);

            System.out.println("Successfully added notes to MongoDB!");
        }
    }
}