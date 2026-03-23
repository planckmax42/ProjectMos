package org.example.backend.ai.service;

import org.example.backend.ai.model.dto.ChatRequest;
import org.example.backend.ai.model.dto.ChatResponse;
import org.example.backend.ai.model.dto.ChatStreamEvent;
import reactor.core.publisher.Flux;

public interface ChatService {
    Flux<ChatStreamEvent> streamChat(ChatRequest request);
    ChatResponse chat(ChatRequest request);
}
