package com.bems.ai.controller;

import com.bems.ai.model.dto.ChatRequest;
import com.bems.ai.model.dto.ChatResponse;
import com.bems.ai.model.dto.ChatStreamEvent;
import com.bems.ai.service.ChatService;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

@RestController
@RequestMapping("/api/ai")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @PostMapping(value = "/chat", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<ServerSentEvent<ChatStreamEvent>> streamChat(@Valid @RequestBody ChatRequest request) {
        return chatService.streamChat(request)
                .map(event -> ServerSentEvent.<ChatStreamEvent>builder()
                        .event(event.getType())
                        .data(event)
                        .build());
    }

    @PostMapping("/chat/sync")
    public ChatResponse chat(@Valid @RequestBody ChatRequest request) {
        return chatService.chat(request);
    }
}
