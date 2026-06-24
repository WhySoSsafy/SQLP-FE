import { defineStore } from "pinia";
import { ref } from "vue";
import type { LearningSession } from "@/domain/types";
import {
  clearMockSessions,
  getSelectedSessionId,
  hasMockSessions,
  loadSessions,
  seedMockSessions,
  setSelectedSessionId as persistSelectedSessionId,
} from "@/domain/storage";

export const useSessionsStore = defineStore("sessions", () => {
  const sessions = ref<LearningSession[]>([]);
  const selectedSessionId = ref<string | null>(null);
  const mockDataActive = ref(false);

  async function refresh() {
    sessions.value = await loadSessions();
    selectedSessionId.value = getSelectedSessionId();
    mockDataActive.value = hasMockSessions();
  }

  function selectSession(sessionId: string) {
    persistSelectedSessionId(sessionId);
    selectedSessionId.value = sessionId;
  }

  async function addMockData() {
    seedMockSessions();
    await refresh();
  }

  async function removeMockData() {
    clearMockSessions();
    await refresh();
  }

  return {
    sessions,
    selectedSessionId,
    mockDataActive,
    refresh,
    selectSession,
    addMockData,
    removeMockData,
  };
});
