package app.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.info.License;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(
        info = @Info(
                title = "ProjecTea API",
                version = "1.0.0",
                description = "API documentation for the ProjecTea backend.",
                contact = @Contact(name = "ProjecTea Team"),
                license = @License(name = "Proprietary")
        )
)
public class OpenApiConfig {
}