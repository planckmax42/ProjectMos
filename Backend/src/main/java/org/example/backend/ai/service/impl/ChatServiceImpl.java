package org.example.backend.ai.service.impl;

import org.example.backend.ai.config.AiProperties;
import org.example.backend.ai.config.RagProperties;
import org.example.backend.ai.llm.LlmClient;
import org.example.backend.ai.mcp.McpToolCaller;
import org.example.backend.ai.model.dto.ChatRequest;
import org.example.backend.ai.model.dto.ChatResponse;
import org.example.backend.ai.model.dto.ChatStreamEvent;
import org.example.backend.ai.model.entity.ConversationMessage;
import org.example.backend.ai.model.es.KnowledgeChunk;
import org.example.backend.ai.prompt.RagPromptBuilder;
import org.example.backend.ai.retrieval.EmbeddingService;
import org.example.backend.ai.retrieval.HybridSearchService;
import org.example.backend.ai.service.ChatService;
import org.example.backend.ai.service.ConversationService;
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
    private final AiProperties aiProperties;

    public ChatServiceImpl(
            ConversationService conversationService,
            EmbeddingService embeddingService,
            HybridSearchService hybridSearchService,
            RagPromptBuilder promptBuilder,
            LlmClient llmClient,
            McpToolCaller mcpToolCaller,
            RagProperties ragProperties,
            AiProperties aiProperties) {
        this.conversationService = conversationService;
        this.embeddingService = embeddingService;
        this.hybridSearchService = hybridSearchService;
        this.promptBuilder = promptBuilder;
        this.llmClient = llmClient;
        this.mcpToolCaller = mcpToolCaller;
        this.ragProperties = ragProperties;
        this.aiProperties = aiProperties;
    }

    @Override
    public Flux<ChatStreamEvent> streamChat(ChatRequest request) {
        String conversationId = conversationService.ensureConversationId(request.getConversationId());
        conversationService.saveMessage(conversationId, "user", request.getQuestion());

        List<ConversationMessage> history = conversationService.getRecentHistory(conversationId, ragProperties.getMaxConversationTurns());
        boolean useKnowledgeBase = request.isUseKnowledgeBase() && aiProperties.isEnableKnowledgeBase();
        List<KnowledgeChunk> chunks = resolveChunks(request.getQuestion(), useKnowledgeBase);
        List<String> sources = chunks.stream().map(c -> c.getTitle() + "#" + c.getChunkIndex()).toList();

        if (aiProperties.isMock()) {
            String answer = buildMockAnswer(request.getQuestion(), useKnowledgeBase, sources);
            conversationService.saveMessage(conversationId, "assistant", answer);
            Flux<ChatStreamEvent> sourceEvent = Flux.just(ChatStreamEvent.sources(sources));
            Flux<ChatStreamEvent> tokenEvents = Flux.fromIterable(splitByLength(answer, 24)).map(ChatStreamEvent::token);
            return Flux.concat(sourceEvent, tokenEvents, Flux.just(ChatStreamEvent.done()));
        }

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
        boolean useKnowledgeBase = request.isUseKnowledgeBase() && aiProperties.isEnableKnowledgeBase();
        List<KnowledgeChunk> chunks = resolveChunks(request.getQuestion(), useKnowledgeBase);
        List<String> sources = chunks.stream().map(c -> c.getTitle() + "#" + c.getChunkIndex()).toList();

        if (aiProperties.isMock()) {
            String answer = buildMockAnswer(request.getQuestion(), useKnowledgeBase, sources);
            conversationService.saveMessage(conversationId, "assistant", answer);
            return new ChatResponse(conversationId, answer, sources);
        }

        String answer;
        try {
            answer = llmClient.sendMessage(promptBuilder.build(request.getQuestion(), chunks, history));
        } catch (Exception ex) {
            answer = "AI 调用失败，请检查 API Key/网络配置。错误信息: " + ex.getMessage();
        }
        conversationService.saveMessage(conversationId, "assistant", answer);
        return new ChatResponse(conversationId, answer, sources);
    }

    private List<KnowledgeChunk> resolveChunks(String question, boolean useKnowledgeBase) {
        List<KnowledgeChunk> chunks = new ArrayList<>();
        if (useKnowledgeBase) {
            try {
                float[] vector = embeddingService.embed(question);
                chunks.addAll(hybridSearchService.search(question, vector, ragProperties.getTopK()));
            } catch (Exception ignored) {
                // Knowledge base is optional in MVP mode; fallback to pure LLM response.
            }
        }

        KnowledgeChunk toolChunk = tryCallMcpTool(question);
        if (toolChunk != null) {
            chunks.add(0, toolChunk);
        }
        return chunks;
    }

    private KnowledgeChunk tryCallMcpTool(String question) {
        try {
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
        } catch (Exception ignored) {
            return null;
        }
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

    private String buildMockAnswer(String question, boolean useKnowledgeBase, List<String> sources) {
        if (useKnowledgeBase && !sources.isEmpty()) {
            return "MVP 模拟回答：已收到你的问题「" + question + "」。当前处于 mock 模式，知识库检索已启用，命中来源 " + sources.size() + " 条。";
        }
        return "MVP 模拟回答：已收到你的问题「" + question + "」。当前处于 mock 模式，知识库检索未启用。";
    }

    private List<String> splitByLength(String content, int size) {
        if (content == null || content.isBlank()) {
            return List.of();
        }
        List<String> parts = new ArrayList<>();
        for (int i = 0; i < content.length(); i += size) {
            int end = Math.min(content.length(), i + size);
            parts.add(content.substring(i, end));
        }
        return parts;
    }
}
