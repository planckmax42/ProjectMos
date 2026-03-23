package org.example.backend.ai.controller;

import org.example.backend.ai.model.dto.KnowledgeDocumentVO;
import org.example.backend.ai.service.KnowledgeBaseService;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/ai/knowledge")
public class KnowledgeBaseController {

    private final KnowledgeBaseService knowledgeBaseService;

    public KnowledgeBaseController(KnowledgeBaseService knowledgeBaseService) {
        this.knowledgeBaseService = knowledgeBaseService;
    }

    @PostMapping("/upload")
    public KnowledgeDocumentVO upload(
            @RequestPart("file") MultipartFile file,
            @RequestParam(value = "title", required = false) String title,
            @RequestParam(value = "category", required = false) String category) {
        return knowledgeBaseService.upload(file, title, category);
    }

    @GetMapping("/documents")
    public List<KnowledgeDocumentVO> documents() {
        return knowledgeBaseService.listDocuments();
    }

    @DeleteMapping("/documents/{id}")
    public void delete(@PathVariable Long id) {
        knowledgeBaseService.deleteDocument(id);
    }

    @PostMapping("/reindex/{id}")
    public KnowledgeDocumentVO reindex(@PathVariable Long id) {
        return knowledgeBaseService.reindex(id);
    }
}
