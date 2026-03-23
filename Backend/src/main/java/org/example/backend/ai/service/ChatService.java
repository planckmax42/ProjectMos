package com.bems.ai.service;

import com.bems.ai.model.dto.ChatRequest;
import com.bems.ai.model.dto.ChatResponse;
import com.bems.ai.model.dto.ChatStreamEvent;
import reactor.core.publisher.Flux;

public interface ChatService {
    Flux<ChatStreamEvent> streamChat(ChatRequest request);
    ChatResponse chat(ChatRequest request);
}
