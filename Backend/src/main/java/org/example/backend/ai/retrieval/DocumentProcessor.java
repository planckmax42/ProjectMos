package org.example.backend.ai.retrieval;

import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

public interface DocumentProcessor {
    String extractText(MultipartFile file) throws IOException;
}
