package com.bems.ai.service;

import com.bems.ai.model.dto.KnowledgeDocumentVO;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface KnowledgeBaseService {
    KnowledgeDocumentVO upload(MultipartFile file, String title, String category);
    List<KnowledgeDocumentVO> listDocuments();
    void deleteDocument(Long id);
    KnowledgeDocumentVO reindex(Long id);
}
