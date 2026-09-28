/** DealMind — typed API client wrappers. All routes are relative (no port). */

async function jfetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  if (!res.ok) {
    const msg =
      (data && typeof data === "object" && "error" in (data as Record<string, unknown>)
        ? String((data as Record<string, string>).error)
        : typeof data === "string"
          ? data
          : `HTTP ${res.status}`) || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data as T;
}

export const api = {
  seed: (clear = false) =>
    jfetch<{
      ok: boolean;
      customers: number;
      totalConversations: number;
      totalMemories: number;
      detail: { customer: string; conversations: number; memories: number }[];
    }>(`/api/seed${clear ? "?clear=1" : ""}`, { method: "POST" }),
  customers: {
    list: () =>
      jfetch<{ customers: import("./types").Customer[] }>("/api/customers"),
    get: (id: string) =>
      jfetch<{
        customer: import("./types").Customer & {
          conversations: import("./types").Conversation[];
          memories: import("./types").MemoryItem[];
          followUps: import("./types").FollowUp[];
          meetingBriefs: import("./types").MeetingBrief[];
        };
      }>(`/api/customers/${id}`),
    create: (body: Record<string, unknown>) =>
      jfetch<{ customer: import("./types").Customer }>(`/api/customers`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    update: (id: string, body: Record<string, unknown>) =>
      jfetch<{ customer: import("./types").Customer }>(`/api/customers/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
  },
  conversations: {
    list: (customerId?: string) =>
      jfetch<{ conversations: import("./types").Conversation[] }>(
        `/api/conversations${customerId ? `?customerId=${customerId}` : ""}`,
      ),
    get: (id: string) =>
      jfetch<{
        conversation: import("./types").Conversation & {
          customer: import("./types").Customer;
          messages: import("./types").Message[];
        };
      }>(`/api/conversations/${id}`),
    create: (body: {
      customerId: string;
      title: string;
      channel?: string;
      sentiment?: string;
      summary?: string;
      messages: { role: string; content: string }[];
    }) =>
      jfetch<{ conversation: import("./types").Conversation }>(`/api/conversations`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
  },
  memory: {
    retain: (body: {
      customerId: string;
      content: string;
      context?: string;
      type?: string;
      metadata?: Record<string, string>;
      mentionedAt?: string;
    }) =>
      jfetch<{
        result: {
          success: boolean;
          bankId: string;
          itemsCount: number;
          mode: import("./types").MemoryMode;
        };
      }>(`/api/memory/retain`, { method: "POST", body: JSON.stringify(body) }),
    recall: (body: {
      customerId: string;
      query: string;
      budget?: string;
      limit?: number;
    }) =>
      jfetch<{
        results: import("./types").RecallResultItem[];
        mode: import("./types").MemoryMode;
      }>(`/api/memory/recall`, { method: "POST", body: JSON.stringify(body) }),
    qa: (body: { customerId: string; question: string; budget?: string }) =>
      jfetch<{
        answer: string;
        memories: import("./types").RecallResultItem[];
        mode: import("./types").MemoryMode;
        provider: string;
      }>(`/api/memory/qa`, { method: "POST", body: JSON.stringify(body) }),
    timeline: (customerId?: string) =>
      jfetch<{ items: import("./types").MemoryItem[] }>(
        `/api/timeline${customerId ? `?customerId=${customerId}` : ""}`,
      ),
  },
  meetingPrep: (body: { customerId: string; query: string }) =>
    jfetch<import("./types").MeetingPrepResult>(`/api/meeting-prep`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  followups: {
    list: (params?: { status?: string; customerId?: string }) =>
      jfetch<{ followups: import("./types").FollowUp[] }>(
        `/api/followups?${new URLSearchParams(params ?? {}).toString()}`,
      ),
    create: (body: {
      customerId: string;
      conversationId?: string;
      channel?: string;
      tone?: string;
    }) =>
      jfetch<{
        followUp: import("./types").FollowUp;
        mode: string;
        memoriesUsed: { id: string; text: string; type?: string | null }[];
      }>(`/api/followups`, { method: "POST", body: JSON.stringify(body) }),
    update: (id: string, status: string) =>
      jfetch<{ followUp: import("./types").FollowUp }>(`/api/followups/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
  },
  analytics: () => jfetch<import("./types").Analytics>(`/api/analytics`),
  agentStatus: () => jfetch<import("./types").AgentStatus>(`/api/agent/status`),
  settings: {
    get: () =>
      jfetch<{
        settings: Record<string, string>;
        env: Record<string, string | boolean>;
      }>(`/api/settings`),
    update: (body: Record<string, string>) =>
      jfetch<{ ok: boolean }>(`/api/settings`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
  },
};
