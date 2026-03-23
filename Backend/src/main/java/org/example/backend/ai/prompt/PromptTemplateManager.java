package org.example.backend.ai.prompt;

import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

@Component
public class PromptTemplateManager {

    public String loadPrompt(String name) {
        ClassPathResource resource = new ClassPathResource("prompts/" + name);
        try {
            return new String(resource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new IllegalStateException("Failed to load prompt template: " + name, e);
        }
    }
}
