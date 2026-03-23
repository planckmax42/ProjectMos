package org.example.backend.ai.model.dto;

import java.util.List;

public record ChatResponse(String conversationId, String answer, List<String> sources) {
}
