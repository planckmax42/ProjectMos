package com.bems.ai.service;

import com.bems.ai.model.dto.ConversationVO;
import com.bems.ai.model.entity.ConversationMessage;

import java.util.List;

public interface ConversationService {
    String ensureConversationId(String conversationId);
    void saveMessage(String conversationId, String role, String content);
    List<ConversationMessage> getHistory(String conversationId);
    List<ConversationMessage> getRecentHistory(String conversationId, int turns);
    List<ConversationVO> listConversations();
    void deleteConversation(String conversationId);
}
