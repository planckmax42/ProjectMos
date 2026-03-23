package org.example.backend.ai.repository;

import org.example.backend.ai.model.entity.KnowledgeDocument;
import org.springframework.data.jpa.repository.JpaRepository;

public interface KnowledgeDocumentRepository extends JpaRepository<KnowledgeDocument, Long> {
}
