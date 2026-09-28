"use client";

import { create } from "zustand";

export type ViewId =
  | "dashboard"
  | "customers"
  | "conversations"
  | "memory"
  | "meeting-prep"
  | "followups"
  | "analytics"
  | "settings";

interface DealMindState {
  view: ViewId;
  selectedCustomerId: string | null;
  selectedConversationId: string | null;
  sidebarOpen: boolean;
  setView: (v: ViewId) => void;
  setSelectedCustomer: (id: string | null) => void;
  setSelectedConversation: (id: string | null) => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useDealMind = create<DealMindState>((set) => ({
  view: "dashboard",
  selectedCustomerId: null,
  selectedConversationId: null,
  sidebarOpen: false,
  setView: (view) => set({ view, sidebarOpen: false }),
  setSelectedCustomer: (selectedCustomerId) => set({ selectedCustomerId }),
  setSelectedConversation: (selectedConversationId) =>
    set({ selectedConversationId }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
}));
