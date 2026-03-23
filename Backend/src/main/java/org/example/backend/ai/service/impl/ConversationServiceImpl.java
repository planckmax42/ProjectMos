package org.example.backend.ai.service.impl;

import org.example.backend.ai.model.dto.ConversationVO;
import org.example.backend.ai.model.entity.ConversationMessage;
import org.example.backend.ai.repository.ConversationMessageRepository;
import org.example.backend.ai.service.ConversationService;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Service
public class ConversationServiceImpl implements ConversationService {

    private final ConversationMessageRepository repository;

    public ConversationServiceImpl(ConversationMessageRepository repository) {
        this.repository = repository;
    }

    @Override
    public String ensureConversationId(String conversationId) {
        return (conversationId == null || conversationId.isBlank()) ? UUID.randomUUID().toString() : conversationId;
    }

    @Override
    public void saveMessage(String conversationId, String role, String content) {
        repository.save(new ConversationMessage(conversationId, role, content));
    }

    @Override
    public List<ConversationMessage> getHistory(String conversationId) {
        return repository.findByConversationIdOrderByCreatedAtAsc(conversationId);
    }

    @Override
    public List<ConversationMessage> getRecentHistory(String conversationId, int turns) {
        List<ConversationMessage> all = repository.findLatestByConversationId(conversationId);
        int maxMessages = Math.max(1, turns * 2);
        List<ConversationMessage> result = new ArrayList<>(all.stream().limit(maxMessages).toList());
        Collections.reverse(result);
        return result;
    }

    @Override
    public List<ConversationVO> listConversations() {
        return repository.findConversationSummaries();
    }

    @Override
    public void deleteConversation(String conversationId) {
        repository.deleteByConversationId(conversationId);
    }
}
