package com.bems.ai.prompt;

import com.bems.ai.llm.LlmMessage;
import com.bems.ai.model.entity.ConversationMessage;
import com.bems.ai.model.es.KnowledgeChunk;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class RagPromptBuilder {

    private final PromptTemplateManager templateManager;

    public RagPromptBuilder(PromptTemplateManager templateManager) {
        this.templateManager = templateManager;
    }

    public List<LlmMessage> build(String question, List<KnowledgeChunk> chunks, List<ConversationMessage> history) {
        List<LlmMessage> messages = new ArrayList<>();

        String systemPrompt = templateManager.loadPrompt("rag-system.txt");
        messages.add(new LlmMessage("system", systemPrompt));

        if (chunks != null && !chunks.isEmpty()) {
            StringBuilder context = new StringBuilder(templateManager.loadPrompt("rag-context.txt"));
            context.append("\n\n");
            for (int i = 0; i < chunks.size(); i++) {
                KnowledgeChunk c = chunks.get(i);
                context.append("[参考").append(i + 1).append("] 来源: ")
                        .append(c.getTitle()).append(" | 分类: ").append(c.getCategory()).append("\n")
                        .append(c.getContent()).append("\n\n");
            }
            messages.add(new LlmMessage("system", context.toString()));
        }

        if (history != null) {
            for (ConversationMessage message : history) {
                messages.add(new LlmMessage(message.getRole(), message.getContent()));
            }
        }

        messages.add(new LlmMessage("user", question));
        return messages;
    }
}
