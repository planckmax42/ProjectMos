package org.example.backend.ai.retrieval;

import org.example.backend.ai.model.es.KnowledgeChunk;

import java.util.List;

public interface KnowledgeIndexService {
    void indexChunks(List<KnowledgeChunk> chunks);
    void deleteByDocId(String docId);
}
