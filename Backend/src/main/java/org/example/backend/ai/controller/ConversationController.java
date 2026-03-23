package org.example.backend.ai.controller;

import org.example.backend.ai.model.dto.ConversationVO;
import org.example.backend.ai.model.entity.ConversationMessage;
import org.example.backend.ai.service.ConversationService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ai/conversations")
public class ConversationController {

    private final ConversationService conversationService;

    public ConversationController(ConversationService conversationService) {
        this.conversationService = conversationService;
    }

    @GetMapping
    public List<ConversationVO> list() {
        return conversationService.listConversations();
    }

    @GetMapping("/{id}/history")
    public List<ConversationMessage> history(@PathVariable("id") String conversationId) {
        return conversationService.getHistory(conversationId);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable("id") String conversationId) {
        conversationService.deleteConversation(conversationId);
    }
}
