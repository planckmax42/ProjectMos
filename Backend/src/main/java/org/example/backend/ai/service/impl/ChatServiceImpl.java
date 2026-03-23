package com.bems.ai.service.impl;

import com.bems.ai.config.RagProperties;
import com.bems.ai.llm.LlmClient;
import com.bems.ai.mcp.McpToolCaller;
import com.bems.ai.model.dto.ChatRequest;
import com.bems.ai.model.dto.ChatResponse;
import com.bems.ai.model.dto.ChatStreamEvent;
import com.bems.ai.model.entity.ConversationMessage;
import com.bems.ai.model.es.KnowledgeChunk;
import com.bems.ai.prompt.RagPromptBuilder;
import com.bems.ai.retrieval.EmbeddingService;
import com.bems.ai.retrieval.HybridSearchService;
import com.bems.ai.service.ChatService;
import com.bems.ai.service.ConversationService;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class ChatServiceImpl implements ChatService {

    private final ConversationService conversationService;
    private final EmbeddingService embeddingService;
    private final HybridSearchService hybridSearchService;
    private final RagPromptBuilder promptBuilder;
    private final LlmClient llmClient;
    private final McpToolCaller mcpToolCaller;
    private final RagProperties ragProperties;

    public ChatServiceImpl(
            ConversationService conversationService,
            EmbeddingService embeddingService,
            HybridSearchService hybridSearchService,
            RagPromptBuilder promptBuilder,
            LlmClient llmClient,
            McpToolCaller mcpToolCaller,
            RagProperties ragProperties) {
        this.conversationService = conversationService;
        this.embeddingService = embeddingService;
        this.hybridSearchService = hybridSearchService;
        this.promptBuilder = promptBuilder;
        this.llmClient = llmClient;
        this.mcpToolCaller = mcpToolCaller;
        this.ragProperties = ragProperties;
    }

    @Override
    public Flux<ChatStreamEvent> streamChat(ChatRequest request) {
        String conversationId = conversationService.ensureConversationId(request.getConversationId());
        conversationService.saveMessage(conversationId, "user", request.getQuestion());

        List<ConversationMessage> history = conversationService.getRecentHistory(conversationId, ragProperties.getMaxConversationTurns());
        List<KnowledgeChunk> chunks = resolveChunks(request);
        List<String> sources = chunks.stream().map(c -> c.getTitle() + "#" + c.getChunkIndex()).toList();

        StringBuilder output = new StringBuilder();
        Flux<ChatStreamEvent> sourceEvent = Flux.just(ChatStreamEvent.sources(sources));
        Flux<ChatStreamEvent> tokenEvents = llmClient.streamMessage(promptBuilder.build(request.getQuestion(), chunks, history))
                .map(token -> {
                    output.append(token);
                    return ChatStreamEvent.token(token);
                });
        Flux<ChatStreamEvent> done = Flux.just(ChatStreamEvent.done())
                .doOnComplete(() -> conversationService.saveMessage(conversationId, "assistant", output.toString()));

        return Flux.concat(sourceEvent, tokenEvents, done)
                .onErrorResume(e -> Flux.just(ChatStreamEvent.error(e.getMessage())));
    }

    @Override
    public ChatResponse chat(ChatRequest request) {
        String conversationId = conversationService.ensureConversationId(request.getConversationId());
        conversationService.saveMessage(conversationId, "user", request.getQuestion());

        List<ConversationMessage> history = conversationService.getRecentHistory(conversationId, ragProperties.getMaxConversationTurns());
        List<KnowledgeChunk> chunks = resolveChunks(request);

        String answer = llmClient.sendMessage(promptBuilder.build(request.getQuestion(), chunks, history));
        conversationService.saveMessage(conversationId, "assistant", answer);

        List<String> sources = chunks.stream().map(c -> c.getTitle() + "#" + c.getChunkIndex()).toList();
        return new ChatResponse(conversationId, answer, sources);
    }

    private List<KnowledgeChunk> resolveChunks(ChatRequest request) {
        List<KnowledgeChunk> chunks = new ArrayList<>();
        if (request.isUseKnowledgeBase()) {
            float[] vector = embeddingService.embed(request.getQuestion());
            chunks.addAll(hybridSearchService.search(request.getQuestion(), vector, ragProperties.getTopK()));
        }

        KnowledgeChunk toolChunk = tryCallMcpTool(request.getQuestion());
        if (toolChunk != null) {
            chunks.add(0, toolChunk);
        }
        return chunks;
    }

    private KnowledgeChunk tryCallMcpTool(String question) {
        String toolName = detectTool(question);
        if (toolName == null || !mcpToolCaller.isToolAvailable(toolName)) {
            return null;
        }
        Map<String, Object> params = new HashMap<>();
        params.put("question", question);
        McpToolCaller.ToolResult result = mcpToolCaller.callTool(toolName, params);
        if (!result.success()) {
            return null;
        }
        KnowledgeChunk chunk = new KnowledgeChunk();
        chunk.setChunkId("mcp-" + UUID.randomUUID());
        chunk.setDocId("mcp-tool-result");
        chunk.setTitle("MCP Tool Result: " + toolName);
        chunk.setCategory("realtime-data");
        chunk.setChunkIndex(0);
        chunk.setTotalChunks(1);
        chunk.setContent(result.message() + "\n" + String.valueOf(result.data()));
        return chunk;
    }

    private String detectTool(String question) {
        if (question == null || question.isBlank()) {
            return null;
        }
        String q = question.toLowerCase();
        if (q.contains("设备") && q.contains("状态")) {
            return "device_status_query";
        }
        if ((q.contains("统计") || q.contains("汇总") || q.contains("cop")) && q.contains("能耗")) {
            return "statistics_summary";
        }
        if (q.contains("能耗") || q.contains("电耗") || q.contains("水耗")) {
            return "energy_query";
        }
        return null;
    }
}
