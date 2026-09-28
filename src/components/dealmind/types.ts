/** DealMind shared types (mirror backend shapes). */

export type CustomerStatus =
  | "lead"
  | "qualified"
  | "negotiation"
  | "customer"
  | "churned";

export interface Customer {
  id: string;
  name: string;
  email?: string | null;
  company?: string | null;
  title?: string | null;
  phone?: string | null;
  industry?: string | null;
  city?: string | null;
  status: CustomerStatus;
  dealValue: number;
  notes?: string | null;
  avatarHue: number;
  createdAt: string;
  updatedAt: string;
  _count?: { conversations: number; memories: number; followUps: number };
}

export interface Conversation {
  id: string;
  customerId: string;
  title: string;
  channel: string;
  sentiment?: string | null;
  summary?: string | null;
  createdAt: string;
  _count?: { messages: number };
  customer?: { name: string; company?: string | null; avatarHue: number };
}

export interface Message {
  id: string;
  conversationId: string;
  role: string;
  content: string;
  createdAt: string;
}

export interface MemoryItem {
  id: string;
  customerId: string;
  bankId: string;
  content: string;
  context?: string | null;
  source: string;
  type?: string | null;
  mentionedAt: string;
  metadataJson?: string | null;
  createdAt: string;
  customer?: { name: string; company?: string | null };
}

export interface FollowUp {
  id: string;
  customerId: string;
  conversationId?: string | null;
  channel: string;
  message: string;
  status: string;
  dueAt?: string | null;
  createdAt: string;
  customer?: { name: string; company?: string | null };
}

export interface MeetingBrief {
  id: string;
  customerId: string;
  query: string;
  mode: string;
  briefing: string;
  memoryUsedJson?: string | null;
  latencyMs: number;
  createdAt: string;
}

export type MemoryMode =
  | "hindsight-remote"
  | "hindsight-local"
  | "not-configured";

export interface RecallResultItem {
  id: string;
  text: string;
  context?: string | null;
  type?: string | null;
  mentionedAt?: string | null;
  metadata?: Record<string, string> | null;
  score?: number | null;
  source: "hindsight";
}

export interface MeetingPrepResult {
  customer: { name: string; company?: string | null };
  query: string;
  mode: MemoryMode;
  withoutMemory: {
    id: string;
    briefing: string;
    provider: string;
    latencyMs: number;
    memoriesUsed: RecallResultItem[];
  };
  withMemory: {
    id: string;
    briefing: string;
    provider: string;
    latencyMs: number;
    memoriesUsed: RecallResultItem[];
  };
}

export interface AgentStatus {
  memory: {
    mode: MemoryMode;
    baseUrl?: string;
    apiVersion?: string;
    connected: boolean;
    localDaemonConfigured: boolean;
    uvxAvailable: boolean;
    llmProvider: string;
    message: string;
  };
  llm: { provider: string };
}

export interface Analytics {
  counts: {
    customers: number;
    conversations: number;
    memories: number;
    followups: number;
    briefs: number;
    logs: number;
  };
  byStatus: { status: string; _count: number }[];
  byMode: { mode: string; _count: number }[];
  byAction: { action: string; _count: number }[];
  followupsByStatus: { status: string; _count: number }[];
  pipelineByStage: { status: string; _sum: { dealValue: number }; _count: number }[];
  totalPipelineValue: number;
  memoryTrend: { date: string; count: number }[];
  hindsight?: { mode: string; connected: boolean; apiVersion?: string };
}
