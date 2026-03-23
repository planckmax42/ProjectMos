package org.example.backend.ai.model.dto;

import jakarta.validation.constraints.NotBlank;

public class ChatRequest {
    private String conversationId;

    @NotBlank
    private String question;

    private boolean useKnowledgeBase = true;

    public String getConversationId() { return conversationId; }
    public void setConversationId(String conversationId) { this.conversationId = conversationId; }
    public String getQuestion() { return question; }
    public void setQuestion(String question) { this.question = question; }
    public boolean isUseKnowledgeBase() { return useKnowledgeBase; }
    public void setUseKnowledgeBase(boolean useKnowledgeBase) { this.useKnowledgeBase = useKnowledgeBase; }
}
