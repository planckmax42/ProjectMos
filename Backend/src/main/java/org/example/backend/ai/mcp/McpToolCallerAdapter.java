package org.example.backend.ai.mcp;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.Map;

@Component
public class McpToolCallerAdapter implements McpToolCaller {

    private final ObjectProvider<ExternalMcpToolClient> externalClientProvider;

    public McpToolCallerAdapter(ObjectProvider<ExternalMcpToolClient> externalClientProvider) {
        this.externalClientProvider = externalClientProvider;
    }

    @Override
    public boolean isToolAvailable(String toolName) {
        ExternalMcpToolClient external = externalClientProvider.getIfAvailable();
        return external != null && external.isToolAvailable(toolName);
    }

    @Override
    public ToolResult callTool(String toolName, Map<String, Object> parameters) {
        ExternalMcpToolClient external = externalClientProvider.getIfAvailable();
        if (external == null) {
            return new ToolResult(false, "MCP adapter not integrated yet", Collections.emptyMap());
        }
        return external.callTool(toolName, parameters);
    }
}
