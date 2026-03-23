package org.example.backend.ai.llm;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.backend.ai.config.DeepSeekProperties;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class DeepSeekClient implements LlmClient {

    private final DeepSeekProperties properties;
    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    public DeepSeekClient(DeepSeekProperties properties, WebClient.Builder builder) {
        this.properties = properties;
        this.webClient = builder.baseUrl(properties.getBaseUrl()).build();
        this.objectMapper = new ObjectMapper();
    }

    @SuppressWarnings("unchecked")
    @Override
    public String sendMessage(List<LlmMessage> messages) {
        validateApiKey();
        Map<String, Object> request = baseRequest(messages);
        request.put("stream", false);
        Map<String, Object> response = webClient.post()
                .uri("/chat/completions")
                .contentType(MediaType.APPLICATION_JSON)
                .headers(h -> h.setBearerAuth(properties.getApiKey()))
                .bodyValue(request)
                .retrieve()
                .bodyToMono(Map.class)
                .block();

        if (response == null) {
            return "";
        }
        Object choicesObj = response.get("choices");
        if (!(choicesObj instanceof List<?> choices) || choices.isEmpty()) {
            return "";
        }
        Object first = choices.get(0);
        if (!(first instanceof Map<?, ?> firstChoice)) {
            return "";
        }
        Object messageObj = firstChoice.get("message");
        if (!(messageObj instanceof Map<?, ?> message)) {
            return "";
        }
        Object content = message.get("content");
        return content == null ? "" : String.valueOf(content);
    }

    @Override
    public Flux<String> streamMessage(List<LlmMessage> messages) {
        validateApiKey();
        Map<String, Object> request = baseRequest(messages);
        request.put("stream", true);
        return webClient.post()
                .uri("/chat/completions")
                .contentType(MediaType.APPLICATION_JSON)
                .headers(h -> h.setBearerAuth(properties.getApiKey()))
                .bodyValue(request)
                .retrieve()
                .bodyToFlux(String.class)
                .flatMapIterable(chunk -> List.of(chunk.split("\\r?\\n")))
                .map(String::trim)
                .filter(line -> line.startsWith("data:"))
                .map(line -> line.substring(5).trim())
                .filter(payload -> !payload.isBlank() && !payload.equals("[DONE]"))
                .map(this::extractDeltaToken)
                .filter(token -> token != null && !token.isBlank())
                .onErrorResume(e -> Flux.just("[LLM_ERROR] " + e.getMessage()));
    }

    private Map<String, Object> baseRequest(List<LlmMessage> messages) {
        Map<String, Object> request = new HashMap<>();
        request.put("model", properties.getModel());
        request.put("temperature", properties.getTemperature());
        request.put("max_tokens", properties.getMaxTokens());
        request.put("messages", messages.stream().map(m -> Map.of("role", m.role(), "content", m.content())).toList());
        return request;
    }

    private String extractDeltaToken(String payload) {
        try {
            JsonNode root = objectMapper.readTree(payload);
            JsonNode choices = root.path("choices");
            if (!choices.isArray() || choices.isEmpty()) {
                return "";
            }
            JsonNode delta = choices.get(0).path("delta");
            if (delta.isMissingNode()) {
                return "";
            }
            JsonNode content = delta.path("content");
            return content.isMissingNode() || content.isNull() ? "" : content.asText("");
        } catch (Exception ex) {
            return "";
        }
    }

    private void validateApiKey() {
        if (properties.getApiKey() == null || properties.getApiKey().isBlank()) {
            throw new IllegalStateException("DEEPSEEK_API_KEY is not configured");
        }
    }
}
