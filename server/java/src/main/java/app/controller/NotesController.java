package app.controller;

import app.model.Notes;
import app.service.NotesService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notes")
@Tag(name = "Notes", description = "Operations for creating, listing, retrieving and deleting notes.")
public class NotesController {

    @Autowired
    private NotesService notesService;

    @PostMapping
        @Operation(summary = "Create note", description = "Creates a new note document.")
        @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Note created successfully",
                content = @Content(schema = @Schema(implementation = Notes.class)))
        })
    public ResponseEntity<Notes> createNote(@RequestBody Notes note) {
        return ResponseEntity.ok(notesService.createNote(note));
    }

    @GetMapping
        @Operation(summary = "Get all notes", description = "Returns all note documents.")
        @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Notes returned successfully",
                content = @Content(array = @ArraySchema(schema = @Schema(implementation = Notes.class))))
        })
    public ResponseEntity<List<Notes>> getAllNotes() {
        return ResponseEntity.ok(notesService.getAllNotes());
    }

    @GetMapping("/{id}")
        @Operation(summary = "Get note by id", description = "Returns a single note by its identifier.")
        @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Note returned successfully",
                content = @Content(schema = @Schema(implementation = Notes.class))),
            @ApiResponse(responseCode = "404", description = "Note not found")
        })
    public ResponseEntity<Notes> getNoteById(@PathVariable String id) {
        return notesService.getNoteById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
        @Operation(summary = "Delete note", description = "Deletes note by identifier.")
        @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Note deleted successfully")
        })
    public ResponseEntity<Void> deleteNote(@PathVariable String id) {
        notesService.deleteNote(id);
        return ResponseEntity.noContent().build();
    }
}