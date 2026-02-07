const API_BASE = "/api";

interface ApiResponse<T> {
  data: T | null;
  error: { code: string; message: string } | null;
}

async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<ApiResponse<T>> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const text = await res.text();
    return {
      data: null,
      error: {
        code: `HTTP_${res.status}`,
        message: text || res.statusText,
      },
    };
  }

  return res.json();
}

export interface SessionData {
  id: string;
  buyer_name: string | null;
  summary: string | null;
  status: "parsing" | "parsed" | "chat_active" | "complete";
  overall_confidence: number | null;
  created_at: string;
  updated_at: string;
}

export interface PreferenceData {
  id: string;
  category: string;
  value: string;
  confidence: "low" | "medium" | "high";
  source: "transcript" | "chat" | "both";
  is_confirmed: boolean;
}

export interface ChatMessageData {
  id: string;
  role: "user" | "assistant";
  content: string;
  strategy_used: string | null;
  turn_number: number;
  created_at: string;
}

export const api = {
  sessions: {
    list: () => request<SessionData[]>("/sessions"),

    get: (id: string) => request<SessionData>(`/sessions/${id}`),

    create: (buyer_name?: string) =>
      request<SessionData>("/sessions", {
        method: "POST",
        body: JSON.stringify({ buyer_name: buyer_name || null }),
      }),

    uploadTranscript: (sessionId: string, raw_text: string) =>
      request<{ transcript_id: string; session_id: string; status: string }>(
        `/sessions/${sessionId}/transcript`,
        {
          method: "POST",
          body: JSON.stringify({ raw_text }),
        },
      ),

    getPreferences: (sessionId: string) =>
      request<PreferenceData[]>(`/sessions/${sessionId}/preferences`),
  },

  chat: {
    getMessages: (sessionId: string) =>
      request<ChatMessageData[]>(`/chat/${sessionId}/messages`),

    sendMessage: async (
      sessionId: string,
      content: string,
    ): Promise<Response> => {
      return fetch(`${API_BASE}/chat/${sessionId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
    },
  },
};
