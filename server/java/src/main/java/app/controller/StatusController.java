package app.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/status")
@Tag(name = "Status", description = "Health and readiness endpoint.")
public class StatusController {

    @GetMapping
    @Operation(summary = "Check server status", description = "Returns a simple text response confirming that the server is running.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Server is up",
                    content = @Content(schema = @Schema(type = "string", example = "Server On")))
    })
    public String status() {
        return "Server On";
    }
}
