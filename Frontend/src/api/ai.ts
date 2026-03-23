import axios from 'axios';

export interface AiChatRequest {
  conversationId?: string;
  question: string;
  useKnowledgeBase?: boolean;
}

export interface AiChatResponse {
  conversationId: string;
  answer: string;
  sources: string[];
}

const aiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const aiApi = {
  chatSync(payload: AiChatRequest): Promise<AiChatResponse> {
    return aiClient.post<AiChatResponse>('/api/ai/chat/sync', payload).then((res) => res.data);
  },
};
