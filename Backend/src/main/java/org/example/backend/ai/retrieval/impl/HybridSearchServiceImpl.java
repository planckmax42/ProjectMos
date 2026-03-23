package com.bems.ai.retrieval.impl;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch.core.SearchResponse;
import co.elastic.clients.elasticsearch.core.search.Hit;
import com.bems.ai.config.RagProperties;
import com.bems.ai.model.es.KnowledgeChunk;
import com.bems.ai.retrieval.HybridSearchService;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class HybridSearchServiceImpl implements HybridSearchService {

    private final ElasticsearchClient esClient;
    private final RagProperties ragProperties;

    public HybridSearchServiceImpl(ElasticsearchClient esClient, RagProperties ragProperties) {
        this.esClient = esClient;
        this.ragProperties = ragProperties;
    }

    @Override
    public List<KnowledgeChunk> search(String queryText, float[] queryVector, int topK) {
        int size = topK > 0 ? topK : ragProperties.getTopK();
        int candidateSize = Math.max(size * 3, 20);

        try {
            List<Hit<Map>> bm25Hits = searchBm25(queryText, candidateSize);
            List<Hit<Map>> knnHits = searchKnn(queryVector, candidateSize);
            return rrfFuse(bm25Hits, knnHits, size);
        } catch (IOException e) {
            throw new IllegalStateException("Hybrid search failed", e);
        }
    }

    private List<Hit<Map>> searchBm25(String queryText, int size) throws IOException {
        SearchResponse<Map> response = esClient.search(s -> s
                        .index(ragProperties.getIndexName())
                        .size(size)
                        .query(q -> q.match(m -> m.field("content").query(queryText))),
                Map.class);
        return response.hits().hits();
    }

    private List<Hit<Map>> searchKnn(float[] queryVector, int size) throws IOException {
        if (queryVector == null || queryVector.length == 0) {
            return List.of();
        }
        SearchResponse<Map> response = esClient.search(s -> s
                        .index(ragProperties.getIndexName())
                        .size(size)
                        .knn(k -> k
                                .field("embedding")
                                .queryVector(toList(queryVector))
                                .k(size)
                                .numCandidates(Math.max(size * 3, 50))),
                Map.class);
        return response.hits().hits();
    }

    private List<KnowledgeChunk> rrfFuse(List<Hit<Map>> bm25Hits, List<Hit<Map>> knnHits, int topK) {
        final int rrfK = 60;
        Map<String, RankedChunk> scores = new HashMap<>();

        for (int i = 0; i < bm25Hits.size(); i++) {
            Hit<Map> hit = bm25Hits.get(i);
            String id = hit.id();
            RankedChunk ranked = scores.computeIfAbsent(id, key -> new RankedChunk(toChunk(hit)));
            ranked.score += 1.0 / (rrfK + i + 1);
        }

        for (int i = 0; i < knnHits.size(); i++) {
            Hit<Map> hit = knnHits.get(i);
            String id = hit.id();
            RankedChunk ranked = scores.computeIfAbsent(id, key -> new RankedChunk(toChunk(hit)));
            ranked.score += 1.0 / (rrfK + i + 1);
        }

        return scores.values().stream()
                .sorted(Comparator.comparingDouble((RankedChunk c) -> c.score).reversed())
                .limit(topK)
                .map(c -> c.chunk)
                .toList();
    }

    private List<Float> toList(float[] vector) {
        List<Float> values = new ArrayList<>(vector.length);
        for (float v : vector) {
            values.add(v);
        }
        return values;
    }

    private KnowledgeChunk toChunk(Hit<Map> hit) {
        Map source = hit.source();
        KnowledgeChunk chunk = new KnowledgeChunk();
        chunk.setChunkId(str(source, "chunk_id", hit.id()));
        chunk.setDocId(str(source, "doc_id", null));
        chunk.setTitle(str(source, "title", "unknown"));
        chunk.setContent(str(source, "content", ""));
        chunk.setCategory(str(source, "category", "unknown"));
        chunk.setSourceFile(str(source, "source_file", ""));
        chunk.setChunkIndex(intValue(source, "chunk_index", 0));
        chunk.setTotalChunks(intValue(source, "total_chunks", 0));
        chunk.setCreatedAt(LocalDateTime.now());
        return chunk;
    }

    private String str(Map source, String key, String fallback) {
        if (source == null || source.get(key) == null) {
            return fallback;
        }
        return String.valueOf(source.get(key));
    }

    private int intValue(Map source, String key, int fallback) {
        if (source == null || source.get(key) == null) {
            return fallback;
        }
        Object value = source.get(key);
        if (value instanceof Number number) {
            return number.intValue();
        }
        try {
            return Integer.parseInt(String.valueOf(value));
        } catch (NumberFormatException ex) {
            return fallback;
        }
    }

    private static class RankedChunk {
        private final KnowledgeChunk chunk;
        private double score;

        private RankedChunk(KnowledgeChunk chunk) {
            this.chunk = chunk;
        }
    }
}
