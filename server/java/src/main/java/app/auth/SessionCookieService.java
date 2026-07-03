package app.auth;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;

@Service
public class SessionCookieService {

    public static final String COOKIE_NAME = "PT_SESSION";

    @Value("${app.auth.jwt-expiration-seconds:86400}")
    private long jwtExpirationSeconds;

    // Zmienną secureCookie możemy zignorować w metodach poniżej, 
    // ponieważ chmura bezwzględnie wymaga, aby było to "true"
    @Value("${app.auth.cookie-secure:true}")
    private boolean secureCookie;

    public void writeSessionCookie(HttpServletResponse response, String token) {
        ResponseCookie cookie = ResponseCookie.from(COOKIE_NAME, token)
                .httpOnly(true)
                .secure(true)             
                .sameSite("None")         
                .path("/")
                .maxAge(jwtExpirationSeconds)
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    public void clearSessionCookie(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from(COOKIE_NAME, "")
                .httpOnly(true)
                .secure(true)             
                .sameSite("None")         
                .path("/")
                .maxAge(0)
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }
}