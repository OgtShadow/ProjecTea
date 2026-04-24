package app.controller;

import app.auth.JwtService;
import app.auth.SessionCookieService;
import app.dto.AuthUserResponse;
import app.dto.LoginRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Auth", description = "Session management using JWT stored in HttpOnly cookie.")
public class AuthController {

    private final JwtService jwtService;
    private final SessionCookieService sessionCookieService;

    public AuthController(JwtService jwtService, SessionCookieService sessionCookieService) {
        this.jwtService = jwtService;
        this.sessionCookieService = sessionCookieService;
    }

    @PostMapping("/login")
    @Operation(summary = "Create session", description = "Creates a user session and sets JWT cookie.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Session created"),
            @ApiResponse(responseCode = "400", description = "Validation error")
    })
    public AuthUserResponse login(@Valid @RequestBody LoginRequest request, HttpServletResponse response) {
        String token = jwtService.generateToken(request.getUsername().trim());
        sessionCookieService.writeSessionCookie(response, token);
        return new AuthUserResponse(request.getUsername().trim());
    }

    @GetMapping("/me")
    @Operation(summary = "Current user", description = "Returns current authenticated user extracted from session cookie.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Authenticated user returned"),
            @ApiResponse(responseCode = "401", description = "Not authenticated")
    })
    public AuthUserResponse me(Principal principal) {
        return new AuthUserResponse(principal.getName());
    }

    @PostMapping("/logout")
    @Operation(summary = "Clear session", description = "Clears JWT session cookie.")
    public ResponseEntity<Void> logout(HttpServletResponse response) {
        sessionCookieService.clearSessionCookie(response);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }
}
