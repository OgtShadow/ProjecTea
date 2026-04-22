package app.auth;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.Date;

@Service
public class JwtService {

    @Value("${app.auth.jwt-secret}")
    private String jwtSecret;

    @Value("${app.auth.jwt-expiration-seconds:86400}")
    private long jwtExpirationSeconds;

    private SecretKey signingKey;

    @PostConstruct
    public void init() {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] keyBytes = digest.digest(jwtSecret.getBytes(StandardCharsets.UTF_8));
            signingKey = Keys.hmacShaKeyFor(keyBytes);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("Could not initialize JWT signing key", ex);
        }
    }

    public String generateToken(String username) {
        Instant now = Instant.now();
        Instant expiresAt = now.plusSeconds(jwtExpirationSeconds);

        return Jwts.builder()
                .subject(username)
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiresAt))
                .signWith(signingKey)
                .compact();
    }

    public String extractUsername(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();

        return claims.getSubject();
    }
}
