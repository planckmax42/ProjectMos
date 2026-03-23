package com.bems.ai.retrieval;

import com.bems.ai.config.DashScopeProperties;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class DashScopeEmbeddingService implements EmbeddingService {

    private final DashScopeProperties properties;
    private final WebClient webClient;

    public DashScopeEmbeddingService(DashScopeProperties properties, WebClient.Builder builder) {
        this.properties = properties;
        this.webClient = builder.baseUrl(properties.getBaseUrl()).build();
    }

    @Override
    public float[] embed(String text) {
        List<float[]> vectors = embedBatch(List.of(text));
        return vectors.isEmpty() ? new float[properties.getDimension()] : vectors.get(0);
    }

    @SuppressWarnings("unchecked")
    @Override
    public List<float[]> embedBatch(List<String> texts) {
        if (texts == null || texts.isEmpty()) {
            return List.of();
        }

        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("model", properties.getModel());
            payload.put("input", Map.of("texts", texts));
            payload.put("parameters", Map.of("dimension", properties.getDimension(), "text_type", "document"));

            Map<String, Object> response = webClient.post()
                    .contentType(MediaType.APPLICATION_JSON)
                    .headers(h -> h.setBearerAuth(properties.getApiKey()))
                    .bodyValue(payload)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (response == null || !response.containsKey("output")) {
                return fallbackVectors(texts.size(), properties.getDimension());
            }

            Map<String, Object> output = (Map<String, Object>) response.get("output");
            List<Map<String, Object>> embeddings = (List<Map<String, Object>>) output.get("embeddings");
            if (embeddings == null) {
                return fallbackVectors(texts.size(), properties.getDimension());
            }

            List<float[]> result = new ArrayList<>();
            for (Map<String, Object> e : embeddings) {
                List<Number> vector = (List<Number>) e.get("embedding");
                float[] arr = new float[vector.size()];
                for (int i = 0; i < vector.size(); i++) {
                    arr[i] = vector.get(i).floatValue();
                }
                result.add(arr);
            }
            return result;
        } catch (Exception ex) {
            return fallbackVectors(texts.size(), properties.getDimension());
        }
    }

    private List<float[]> fallbackVectors(int count, int dim) {
        List<float[]> list = new ArrayList<>(count);
        for (int i = 0; i < count; i++) {
            list.add(new float[dim]);
        }
        return list;
    }
}
