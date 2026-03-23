package com.bems.ai.retrieval;

import com.bems.ai.model.es.KnowledgeChunk;

import java.util.List;

public interface HybridSearchService {
    List<KnowledgeChunk> search(String queryText, float[] queryVector, int topK);
}
