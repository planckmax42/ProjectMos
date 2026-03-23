package org.example.backend.ai.service.impl;

import org.example.backend.ai.model.dto.KnowledgeDocumentVO;
import org.example.backend.ai.model.entity.KnowledgeDocument;
import org.example.backend.ai.model.es.KnowledgeChunk;
import org.example.backend.ai.repository.KnowledgeDocumentRepository;
import org.example.backend.ai.retrieval.ChunkingStrategy;
import org.example.backend.ai.retrieval.DocumentProcessor;
import org.example.backend.ai.retrieval.EmbeddingService;
import org.example.backend.ai.retrieval.KnowledgeIndexService;
import org.example.backend.ai.service.KnowledgeBaseService;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class KnowledgeBaseServiceImpl implements KnowledgeBaseService {

    private final KnowledgeDocumentRepository repository;
    private final DocumentProcessor documentProcessor;
    private final ChunkingStrategy chunkingStrategy;
    private final EmbeddingService embeddingService;
    private final KnowledgeIndexService indexService;

    public KnowledgeBaseServiceImpl(
            KnowledgeDocumentRepository repository,
            DocumentProcessor documentProcessor,
            ChunkingStrategy chunkingStrategy,
            EmbeddingService embeddingService,
            KnowledgeIndexService indexService) {
        this.repository = repository;
        this.documentProcessor = documentProcessor;
        this.chunkingStrategy = chunkingStrategy;
        this.embeddingService = embeddingService;
        this.indexService = indexService;
    }

    @Override
    public KnowledgeDocumentVO upload(MultipartFile file, String title, String category) {
        KnowledgeDocument doc = new KnowledgeDocument();
        doc.setTitle(title == null || title.isBlank() ? file.getOriginalFilename() : title);
        doc.setFileName(file.getOriginalFilename());
        doc.setFileType(fileType(file.getOriginalFilename()));
        doc.setCategory(category);
        doc.setStatus("PROCESSING");
        doc = repository.save(doc);

        try {
            String text = documentProcessor.extractText(file);
            List<String> chunks = chunkingStrategy.chunk(text);
            List<float[]> vectors = embeddingService.embedBatch(chunks);

            List<KnowledgeChunk> docs = new ArrayList<>();
            for (int i = 0; i < chunks.size(); i++) {
                KnowledgeChunk chunk = new KnowledgeChunk();
                chunk.setChunkId(UUID.randomUUID().toString());
                chunk.setDocId(String.valueOf(doc.getId()));
                chunk.setTitle(doc.getTitle());
                chunk.setCategory(doc.getCategory());
                chunk.setSourceFile(doc.getFileName());
                chunk.setChunkIndex(i);
                chunk.setTotalChunks(chunks.size());
                chunk.setContent(chunks.get(i));
                chunk.setEmbedding(i < vectors.size() ? vectors.get(i) : new float[0]);
                docs.add(chunk);
            }

            indexService.indexChunks(docs);
            doc.setChunkCount(chunks.size());
            doc.setStatus("INDEXED");
        } catch (IOException e) {
            doc.setStatus("FAILED");
            repository.save(doc);
            throw new IllegalStateException("Failed to process uploaded file", e);
        }

        return toVO(repository.save(doc));
    }

    @Override
    public List<KnowledgeDocumentVO> listDocuments() {
        return repository.findAll().stream().map(this::toVO).toList();
    }

    @Override
    public void deleteDocument(Long id) {
        KnowledgeDocument doc = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Knowledge document not found: " + id));
        indexService.deleteByDocId(String.valueOf(doc.getId()));
        repository.deleteById(id);
    }

    @Override
    public KnowledgeDocumentVO reindex(Long id) {
        KnowledgeDocument doc = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Knowledge document not found: " + id));
        doc.setStatus("INDEXED");
        return toVO(repository.save(doc));
    }

    private KnowledgeDocumentVO toVO(KnowledgeDocument doc) {
        return new KnowledgeDocumentVO(
                doc.getId(),
                doc.getTitle(),
                doc.getFileName(),
                doc.getFileType(),
                doc.getCategory(),
                doc.getChunkCount(),
                doc.getStatus(),
                doc.getCreatedAt(),
                doc.getUpdatedAt());
    }

    private String fileType(String fileName) {
        if (fileName == null || !fileName.contains(".")) {
            return "unknown";
        }
        return fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();
    }
}
