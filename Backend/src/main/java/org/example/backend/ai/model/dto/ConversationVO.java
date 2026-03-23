package org.example.backend.ai.model.dto;

import java.time.LocalDateTime;

public record ConversationVO(String conversationId, LocalDateTime lastMessageAt, long messageCount) {
}
