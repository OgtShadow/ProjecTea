package app.controller;

import app.model.Notes;
import app.service.NotesService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notes")
public class NotesController {

    @Autowired
    private NotesService notesService;

    @PostMapping
    public ResponseEntity<Notes> createNote(@RequestBody Notes note) {
        return ResponseEntity.ok(notesService.createNote(note));
    }

    @GetMapping
    public ResponseEntity<List<Notes>> getAllNotes() {
        return ResponseEntity.ok(notesService.getAllNotes());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Notes> getNoteById(@PathVariable String id) {
        return notesService.getNoteById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNote(@PathVariable String id) {
        notesService.deleteNote(id);
        return ResponseEntity.noContent().build();
    }
}