package org.example.backend.ai.retrieval.impl;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch.core.BulkRequest;
import co.elastic.clients.elasticsearch.core.DeleteByQueryRequest;
import co.elastic.clients.elasticsearch.core.bulk.BulkOperation;
import org.example.backend.ai.config.RagProperties;
import org.example.backend.ai.model.es.KnowledgeChunk;
import org.example.backend.ai.retrieval.KnowledgeIndexService;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class KnowledgeIndexServiceImpl implements KnowledgeIndexService {

    private final ElasticsearchClient esClient;
    private final RagProperties ragProperties;

    public KnowledgeIndexServiceImpl(ElasticsearchClient esClient, RagProperties ragProperties) {
        this.esClient = esClient;
        this.ragProperties = ragProperties;
    }

    @Override
    public void indexChunks(List<KnowledgeChunk> chunks) {
        if (chunks == null || chunks.isEmpty()) {
            return;
        }

        List<BulkOperation> operations = new ArrayList<>();
        for (KnowledgeChunk chunk : chunks) {
            Map<String, Object> source = new HashMap<>();
            source.put("chunk_id", chunk.getChunkId() == null ? "" : chunk.getChunkId());
            source.put("doc_id", chunk.getDocId() == null ? "" : chunk.getDocId());
            source.put("title", chunk.getTitle() == null ? "" : chunk.getTitle());
            source.put("content", chunk.getContent() == null ? "" : chunk.getContent());
            source.put("embedding", chunk.getEmbedding() == null ? List.of() : toList(chunk.getEmbedding()));
            source.put("category", chunk.getCategory() == null ? "unknown" : chunk.getCategory());
            source.put("source_file", chunk.getSourceFile() == null ? "" : chunk.getSourceFile());
            source.put("chunk_index", chunk.getChunkIndex() == null ? 0 : chunk.getChunkIndex());
            source.put("total_chunks", chunk.getTotalChunks() == null ? 0 : chunk.getTotalChunks());
            source.put("created_at", chunk.getCreatedAt() == null ? "" : chunk.getCreatedAt().toString());
            source.put("metadata", chunk.getMetadata() == null ? Map.of() : chunk.getMetadata());

            operations.add(new BulkOperation.Builder()
                    .index(i -> i.index(ragProperties.getIndexName()).id(chunk.getChunkId()).document(source))
                    .build());
        }

        try {
            esClient.bulk(new BulkRequest.Builder().index(ragProperties.getIndexName()).operations(operations).build());
        } catch (IOException e) {
            throw new IllegalStateException("Failed to bulk index chunks", e);
        }
    }

    @Override
    public void deleteByDocId(String docId) {
        try {
            DeleteByQueryRequest request = new DeleteByQueryRequest.Builder()
                    .index(ragProperties.getIndexName())
                    .query(q -> q.term(t -> t.field("doc_id").value(docId)))
                    .build();
            esClient.deleteByQuery(request);
        } catch (IOException e) {
            throw new IllegalStateException("Failed to delete indexed chunks by doc id: " + docId, e);
        }
    }

    private List<Float> toList(float[] values) {
        List<Float> list = new ArrayList<>(values.length);
        for (float v : values) {
            list.add(v);
        }
        return list;
    }
}
