import { useEffect, useState } from "react";
import LoginPage from "./components/LoginPage";
import Layout from "./components/Layout";
import type { LearningSession } from "./domain/types";
import {
  clearMockSessions,
  getSelectedSessionId,
  hasMockSessions,
  loadSessions,
  seedMockSessions,
  setSelectedSessionId as persistSelectedSessionId,
} from "./domain/storage";

export type Page =
  | "home"
  | "json-register"
  | "sessions"
  | "problem-detail"
  | "weak-concepts"
  | "calendar"
  | "wrong-answers"
  | "study-comparison";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState<Page>("home");
  const [sessions, setSessions] = useState<LearningSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [mockDataActive, setMockDataActive] = useState(false);

  const refreshSessions = () => {
    setSessions(loadSessions());
    setSelectedSessionId(getSelectedSessionId());
    setMockDataActive(hasMockSessions());
  };

  useEffect(() => {
    refreshSessions();
  }, []);

  const selectSession = (sessionId: string) => {
    persistSelectedSessionId(sessionId);
    setSelectedSessionId(sessionId);
    setCurrentPage("problem-detail");
  };

  const addMockData = () => {
    seedMockSessions();
    refreshSessions();
  };

  const removeMockData = () => {
    clearMockSessions();
    refreshSessions();
  };

  if (!isLoggedIn) {
    return <LoginPage onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <Layout
      currentPage={currentPage}
      onNavigate={setCurrentPage}
      sessions={sessions}
      selectedSessionId={selectedSessionId}
      onSelectSession={selectSession}
      onSessionsChanged={refreshSessions}
      mockDataActive={mockDataActive}
      onAddMockData={addMockData}
      onRemoveMockData={removeMockData}
    />
  );
}
