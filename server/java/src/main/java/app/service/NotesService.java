package app.service;

import app.model.Notes;
import app.repository.mongo.NotesRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class NotesService {

    @Autowired
    private NotesRepository noteRepository;

    public Notes createNote(Notes note) {
        note.setCreatedAt(LocalDateTime.now());
        return noteRepository.save(note);
    }

    public List<Notes> getAllNotes() {
        return noteRepository.findAll();
    }

    public Optional<Notes> getNoteById(String id) {
        return noteRepository.findById(id);
    }

    public void deleteNote(String id) {
        noteRepository.deleteById(id);
    }
}