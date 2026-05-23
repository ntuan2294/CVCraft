package com.cvcraft.service;

import com.cvcraft.exception.BadRequestException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

@Service
@Slf4j
public class EmailValidationService {

    private static final HttpClient HTTP = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(5))
        .build();

    @Value("${app.zerobounce.api-key:}")
    private String apiKey;

    public void validateOrThrow(String email) {
        if (apiKey == null || apiKey.isBlank()) return;

        try {
            String url = "https://api.zerobounce.net/v2/validate?api_key=" + apiKey
                + "&email=" + email + "&ip_address=";

            var request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(8))
                .GET()
                .build();

            var response = HTTP.send(request, HttpResponse.BodyHandlers.ofString());
            String body = response.body();
            log.debug("ZeroBounce response for {}: {}", email, body);

            String status = extractStatus(body);

            if ("invalid".equalsIgnoreCase(status)) {
                throw new BadRequestException("Email address does not exist: " + email);
            }
            if ("spamtrap".equalsIgnoreCase(status) || "abuse".equalsIgnoreCase(status)
                || "do_not_mail".equalsIgnoreCase(status)) {
                throw new BadRequestException("This email address cannot be used");
            }
            // "valid", "catch-all", "unknown" → allow through

        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            // Don't block registration if ZeroBounce is unreachable
            log.warn("ZeroBounce validation failed for {}: {} — allowing through", email, e.getMessage());
        }
    }

    private String extractStatus(String json) {
        // Simple parse: find "status":"value"
        int idx = json.indexOf("\"status\"");
        if (idx < 0) return "unknown";
        int colon = json.indexOf(':', idx);
        int quote1 = json.indexOf('"', colon);
        int quote2 = json.indexOf('"', quote1 + 1);
        if (quote1 < 0 || quote2 < 0) return "unknown";
        return json.substring(quote1 + 1, quote2);
    }
}
