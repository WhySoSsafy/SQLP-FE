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

  function refresh() {
    sessions.value = loadSessions();
    selectedSessionId.value = getSelectedSessionId();
    mockDataActive.value = hasMockSessions();
  }

  function selectSession(sessionId: string) {
    persistSelectedSessionId(sessionId);
    selectedSessionId.value = sessionId;
  }

  function addMockData() {
    seedMockSessions();
    refresh();
  }

  function removeMockData() {
    clearMockSessions();
    refresh();
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
