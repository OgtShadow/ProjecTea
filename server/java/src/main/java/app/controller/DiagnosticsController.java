package app.controller;

import org.springframework.boot.actuate.health.HealthEndpoint;
import org.springframework.boot.actuate.info.InfoEndpoint;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.LinkedHashMap;
import java.util.Map;

@Controller
public class DiagnosticsController {

    private final InfoEndpoint infoEndpoint;
    private final HealthEndpoint healthEndpoint;
    private final Environment env;

    public DiagnosticsController(InfoEndpoint infoEndpoint, HealthEndpoint healthEndpoint, Environment env) {
        this.infoEndpoint = infoEndpoint;
        this.healthEndpoint = healthEndpoint;
        this.env = env;
    }

    @GetMapping("/diagnostics")
    public String diagnostics(Model model) {
        model.addAttribute("info", infoEndpoint.info());
        model.addAttribute("health", healthEndpoint.health());

        Map<String, String> props = new LinkedHashMap<>();
        String[] keys = new String[]{
                "spring.application.name",
                "info.app.name",
                "info.app.description",
                "server.port",
                "spring.datasource.username",
                "app.security.allowed-origins"
        };
        for (String k : keys) {
            String v = env.getProperty(k);
            props.put(k, v == null ? "(not set)" : v);
        }

        model.addAttribute("properties", props);
        return "diagnostics";
    }
}
