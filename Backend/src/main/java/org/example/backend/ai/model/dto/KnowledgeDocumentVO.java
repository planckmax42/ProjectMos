package com.bems.ai.model.dto;

import java.time.LocalDateTime;

public record KnowledgeDocumentVO(
        Long id,
        String title,
        String fileName,
        String fileType,
        String category,
        Integer chunkCount,
        String status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {
}
