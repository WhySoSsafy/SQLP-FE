import {
  Home,
  Upload,
  BookOpen,
  BarChart2,
  AlertTriangle,
  Calendar,
  FileText,
  Users,
  Database,
  Bell,
  ChevronRight,
} from "lucide-react";
import type { Page } from "../App";
import Dashboard from "./Dashboard";
import JsonRegistration from "./JsonRegistration";
import SessionList from "./SessionList";
import ProblemDetail from "./ProblemDetail";
import WeakConcepts from "./WeakConcepts";
import CalendarPage from "./CalendarPage";
import WrongAnswers from "./WrongAnswers";
import StudyComparison from "./StudyComparison";
import type { LearningSession } from "../domain/types";

const NAV_ITEMS: { id: Page; label: string; icon: React.ReactNode }[] = [
  { id: "home", label: "홈", icon: <Home size={18} /> },
  { id: "json-register", label: "JSON 등록", icon: <Upload size={18} /> },
  { id: "sessions", label: "학습 세션", icon: <BookOpen size={18} /> },
  { id: "problem-detail", label: "문제별 이해도", icon: <BarChart2 size={18} /> },
  { id: "weak-concepts", label: "취약 개념", icon: <AlertTriangle size={18} /> },
  { id: "calendar", label: "학습 캘린더", icon: <Calendar size={18} /> },
  { id: "wrong-answers", label: "오답노트", icon: <FileText size={18} /> },
  { id: "study-comparison", label: "스터디 비교", icon: <Users size={18} /> },
];

interface Props {
  currentPage: Page;
  onNavigate: (p: Page) => void;
  sessions: LearningSession[];
  selectedSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onSessionsChanged: () => void;
  mockDataActive: boolean;
  onAddMockData: () => void;
  onRemoveMockData: () => void;
}

export default function Layout({
  currentPage,
  onNavigate,
  sessions,
  selectedSessionId,
  onSelectSession,
  onSessionsChanged,
  mockDataActive,
  onAddMockData,
  onRemoveMockData,
}: Props) {
  const todayLabel = new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(new Date());

  const pageLabels: Record<Page, string> = {
    home: "홈 대시보드",
    "json-register": "AI 분석 결과 JSON 등록",
    sessions: "학습 세션",
    "problem-detail": "문제별 이해도",
    "weak-concepts": "취약 개념 대시보드",
    calendar: "학습 캘린더",
    "wrong-answers": "오답노트",
    "study-comparison": "스터디원 비교",
  };

  const renderPage = () => {
    switch (currentPage) {
      case "home": return <Dashboard onNavigate={onNavigate} sessions={sessions} />;
      case "json-register": return <JsonRegistration onSessionsChanged={onSessionsChanged} />;
      case "sessions": return <SessionList sessions={sessions} onSelectSession={onSelectSession} />;
      case "problem-detail": return <ProblemDetail sessions={sessions} selectedSessionId={selectedSessionId} />;
      case "weak-concepts": return <WeakConcepts sessions={sessions} />;
      case "calendar": return <CalendarPage />;
      case "wrong-answers": return <WrongAnswers sessions={sessions} />;
      case "study-comparison": return <StudyComparison />;
      default: return <Dashboard onNavigate={onNavigate} sessions={sessions} />;
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#F4F5F7" }}>
      {/* Sidebar */}
      <aside
        style={{
          width: "240px",
          backgroundColor: "#1E2433",
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          display: "flex",
          flexDirection: "column",
          zIndex: 100,
        }}
      >
        {/* Logo */}
        <div
          style={{
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid #2B3445",
            display: "flex",
            alignItems: "center",
            gap: "0.625rem",
          }}
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "7px",
              backgroundColor: "#C8962A",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Database size={16} color="white" />
          </div>
          <span style={{ color: "#FFFFFF", fontSize: "1rem", fontWeight: 700 }}>SQLP AI Coach</span>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "1rem 0.75rem", overflowY: "auto" }}>
          {NAV_ITEMS.map((item) => {
            const active = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.625rem 0.875rem",
                  borderRadius: "8px",
                  border: "none",
                  cursor: "pointer",
                  marginBottom: "0.25rem",
                  backgroundColor: active ? "#2B3445" : "transparent",
                  color: active ? "#C8962A" : "#94A3B8",
                  fontSize: "0.875rem",
                  fontWeight: active ? 600 : 400,
                  textAlign: "left",
                  transition: "all 0.15s",
                }}
              >
                <span style={{ flexShrink: 0 }}>{item.icon}</span>
                <span style={{ flex: 1 }}>{item.label}</span>
                {active && <ChevronRight size={14} color="#C8962A" />}
              </button>
            );
          })}
        </nav>

        {/* Mock controls */}
        <div
          style={{
            padding: "0.875rem 1rem",
            borderTop: "1px solid #2B3445",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
            <span style={{ color: "#94A3B8", fontSize: "0.75rem", fontWeight: 600 }}>Mock 데이터</span>
            <span
              style={{
                color: mockDataActive ? "#C8962A" : "#64748B",
                fontSize: "0.6875rem",
                fontWeight: 600,
              }}
            >
              {mockDataActive ? "ON" : "OFF"}
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
            <button
              onClick={onAddMockData}
              style={{
                border: "1px solid #475569",
                borderRadius: "7px",
                backgroundColor: mockDataActive ? "#2B3445" : "#C8962A",
                color: mockDataActive ? "#94A3B8" : "#FFFFFF",
                cursor: "pointer",
                fontSize: "0.75rem",
                fontWeight: 700,
                padding: "0.5rem 0.375rem",
              }}
            >
              추가
            </button>
            <button
              onClick={onRemoveMockData}
              style={{
                border: "1px solid #475569",
                borderRadius: "7px",
                backgroundColor: "transparent",
                color: "#CBD5E1",
                cursor: "pointer",
                fontSize: "0.75rem",
                fontWeight: 700,
                padding: "0.5rem 0.375rem",
              }}
            >
              삭제
            </button>
          </div>
        </div>

        {/* Bottom user */}
        <div
          style={{
            padding: "1rem 1.25rem",
            borderTop: "1px solid #2B3445",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <div
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "50%",
              backgroundColor: "#C8962A",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              color: "white",
              fontSize: "0.875rem",
              fontWeight: 600,
            }}
          >
            세
          </div>
          <div>
            <div style={{ color: "#FFFFFF", fontSize: "0.875rem", fontWeight: 500 }}>세은</div>
            <div style={{ color: "#64748B", fontSize: "0.75rem" }}>SQLP 준비 중</div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, marginLeft: "240px", display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        {/* Header */}
        <header
          style={{
            position: "sticky",
            top: 0,
            backgroundColor: "#FFFFFF",
            borderBottom: "1px solid #E5E7EB",
            padding: "0 1.75rem",
            height: "60px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            zIndex: 50,
          }}
        >
          <div>
            <div style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#111827" }}>
              {pageLabels[currentPage]}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ fontSize: "0.8125rem", color: "#6B7280" }}>{todayLabel}</div>
            <button
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "8px",
                border: "1px solid #E5E7EB",
                backgroundColor: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <Bell size={16} color="#6B7280" />
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  backgroundColor: "#C8962A",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                }}
              >
                세
              </div>
              <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "#374151" }}>세은</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main style={{ flex: 1, padding: "1.75rem", overflowY: "auto" }}>{renderPage()}</main>
      </div>
    </div>
  );
}
