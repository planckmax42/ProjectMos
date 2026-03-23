package com.bems.ai.retrieval;

import com.bems.ai.model.es.KnowledgeChunk;

import java.util.List;

public interface KnowledgeIndexService {
    void indexChunks(List<KnowledgeChunk> chunks);
    void deleteByDocId(String docId);
}
