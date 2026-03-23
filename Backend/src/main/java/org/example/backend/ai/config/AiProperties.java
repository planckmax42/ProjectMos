package org.example.backend.ai.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "bems.ai")
public class AiProperties {
    private boolean mock = false;
    private boolean enableKnowledgeBase = false;

    public boolean isMock() {
        return mock;
    }

    public void setMock(boolean mock) {
        this.mock = mock;
    }

    public boolean isEnableKnowledgeBase() {
        return enableKnowledgeBase;
    }

    public void setEnableKnowledgeBase(boolean enableKnowledgeBase) {
        this.enableKnowledgeBase = enableKnowledgeBase;
    }
}
