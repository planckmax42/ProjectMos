package com.bems.ai.retrieval;

import com.bems.ai.config.RagProperties;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class SlidingWindowChunker implements ChunkingStrategy {

    private final RagProperties ragProperties;

    public SlidingWindowChunker(RagProperties ragProperties) {
        this.ragProperties = ragProperties;
    }

    @Override
    public List<String> chunk(String text) {
        if (text == null || text.isBlank()) {
            return List.of();
        }

        int size = Math.max(1, ragProperties.getChunkSize());
        int overlap = Math.max(0, Math.min(size - 1, ragProperties.getChunkOverlap()));
        int step = Math.max(1, size - overlap);

        List<String> chunks = new ArrayList<>();
        for (int start = 0; start < text.length(); start += step) {
            int end = Math.min(text.length(), start + size);
            chunks.add(text.substring(start, end));
            if (end == text.length()) {
                break;
            }
        }
        return chunks;
    }
}
