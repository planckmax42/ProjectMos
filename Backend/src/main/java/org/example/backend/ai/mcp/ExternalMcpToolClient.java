package org.example.backend.ai.mcp;

import java.util.Map;

public interface ExternalMcpToolClient {
    boolean isToolAvailable(String toolName);
    McpToolCaller.ToolResult callTool(String toolName, Map<String, Object> parameters);
}
