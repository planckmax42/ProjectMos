package com.bems.ai.mcp;

import java.util.Map;

public interface McpToolCaller {
    boolean isToolAvailable(String toolName);
    ToolResult callTool(String toolName, Map<String, Object> parameters);

    record ToolResult(boolean success, String message, Map<String, Object> data) {}
}
