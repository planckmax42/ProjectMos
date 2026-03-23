package com.bems.ai.retrieval;

import java.util.List;

public interface ChunkingStrategy {
    List<String> chunk(String text);
}
