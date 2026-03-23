package com.bems.ai.model.dto;

import java.util.List;

public class ChatStreamEvent {
    private String type;
    private String token;
    private List<String> sources;
    private String message;

    public static ChatStreamEvent token(String token) {
        ChatStreamEvent e = new ChatStreamEvent();
        e.type = "token";
        e.token = token;
        return e;
    }

    public static ChatStreamEvent sources(List<String> sources) {
        ChatStreamEvent e = new ChatStreamEvent();
        e.type = "source";
        e.sources = sources;
        return e;
    }

    public static ChatStreamEvent done() {
        ChatStreamEvent e = new ChatStreamEvent();
        e.type = "done";
        return e;
    }

    public static ChatStreamEvent error(String message) {
        ChatStreamEvent e = new ChatStreamEvent();
        e.type = "error";
        e.message = message;
        return e;
    }

    public String getType() { return type; }
    public String getToken() { return token; }
    public List<String> getSources() { return sources; }
    public String getMessage() { return message; }
}
