package com.bems.ai.controller;

import com.bems.ai.model.dto.ConversationVO;
import com.bems.ai.model.entity.ConversationMessage;
import com.bems.ai.service.ConversationService;
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
