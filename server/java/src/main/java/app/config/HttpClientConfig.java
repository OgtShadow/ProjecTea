package app.config;

import java.time.Duration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;

@Configuration
public class HttpClientConfig {

    @Bean
    public WebClient webClient(WebClient.Builder webClientBuilder) {
        HttpClient httpClient = HttpClient.create()
                .option(option -> option.responseTimeout(Duration.ofSeconds(30)))
                .option(option -> option.tcpConfigOption(tcpConfig -> tcpConfig.backlog(2048)))
                .wiretap(true); // For debugging, set to false in production

        ReactorClientHttpConnector connector = new ReactorClientHttpConnector(httpClient);

        return webClientBuilder
                .clientConnector(connector)
                .codecs(configure -> {
                    // Configure codecs for request/response body handling
                    configure.defaultCodecs().maxInMemorySize(64 * 1024 * 1024); // 64MB
                    configure.defaultCodecs().maxInitialMetadataSize(16 * 1024); // 16KB
                })
                .build();
    }
}
