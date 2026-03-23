package org.example.backend.ai.retrieval;

import org.example.backend.ai.model.es.KnowledgeChunk;

import java.util.List;

public interface HybridSearchService {
    List<KnowledgeChunk> search(String queryText, float[] queryVector, int topK);
}
