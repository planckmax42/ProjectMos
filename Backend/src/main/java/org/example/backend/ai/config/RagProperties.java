package com.bems.ai.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "bems.rag")
public class RagProperties {
    private String indexName;
    private int topK;
    private int chunkSize;
    private int chunkOverlap;
    private double scoreThreshold;
    private int maxConversationTurns;

    public String getIndexName() { return indexName; }
    public void setIndexName(String indexName) { this.indexName = indexName; }
    public int getTopK() { return topK; }
    public void setTopK(int topK) { this.topK = topK; }
    public int getChunkSize() { return chunkSize; }
    public void setChunkSize(int chunkSize) { this.chunkSize = chunkSize; }
    public int getChunkOverlap() { return chunkOverlap; }
    public void setChunkOverlap(int chunkOverlap) { this.chunkOverlap = chunkOverlap; }
    public double getScoreThreshold() { return scoreThreshold; }
    public void setScoreThreshold(double scoreThreshold) { this.scoreThreshold = scoreThreshold; }
    public int getMaxConversationTurns() { return maxConversationTurns; }
    public void setMaxConversationTurns(int maxConversationTurns) { this.maxConversationTurns = maxConversationTurns; }
}
