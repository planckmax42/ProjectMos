package com.bems.ai.llm;

import reactor.core.publisher.Flux;

import java.util.List;

public interface LlmClient {
    String sendMessage(List<LlmMessage> messages);
    Flux<String> streamMessage(List<LlmMessage> messages);
}
