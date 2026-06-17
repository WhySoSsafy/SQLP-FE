import { BookOpen, AlertCircle, TrendingUp, Flame, ArrowRight } from "lucide-react";
import type { Page } from "../App";
import type { LearningSession } from "../domain/types";
import { buildDashboardSummary, buildReviewRecommendations, summarizeSessions } from "../domain/analytics";

interface Props {
  onNavigate: (p: Page) => void;
  sessions: LearningSession[];
}

export default function Dashboard({ onNavigate, sessions }: Props) {
  const summary = buildDashboardSummary(sessions, new Date());
  const recommendations = buildReviewRecommendations(sessions);
  const recentSessions = summarizeSessions(sessions).slice(0, 4);

  const summaryCards = [
    { label: "이번 주 풀이 문제", value: `${summary.weeklyProblemCount}문제`, sub: "이번 주 기준", icon: <BookOpen size={20} color="#C8962A" />, accent: "#FEF8EC" },
    { label: "복습 필요 문제", value: `${summary.reviewRequiredCount}문제`, sub: "전체 세션 기준", icon: <AlertCircle size={20} color="#EF4444" />, accent: "#FEF2F2" },
    { label: "평균 이해도", value: `${summary.averageUnderstanding}%`, sub: "전체 세션 평균", icon: <TrendingUp size={20} color="#10B981" />, accent: "#ECFDF5" },
    { label: "연속 학습일", value: `${summary.studyStreak}일`, sub: "오늘 기준", icon: <Flame size={20} color="#C8962A" />, accent: "#FEF8EC" },
  ];
  //충돌나버려라!!
  return (
    <div style={{ width: "100%" }}>
      {/* Welcome */}
      <div style={{ marginBottom: "1.75rem" }}>
        <h1 style={{ color: "#111827", marginBottom: "0.25rem" }}>안녕하세요, 세은님 👋</h1>
        <p style={{ color: "#6B7280", fontSize: "0.875rem" }}>오늘도 SQLP 합격을 향해 한 걸음 더 나아가세요!</p>
      </div>

      {/* Summary Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        {summaryCards.map((card, i) => (
          <div
            key={i}
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "12px",
              padding: "1.25rem",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
              borderTop: "3px solid #C8962A",
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.8125rem", color: "#6B7280" }}>{card.label}</span>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  backgroundColor: card.accent,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {card.icon}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "1.625rem", fontWeight: 700, color: "#111827" }}>{card.value}</div>
              <div style={{ fontSize: "0.75rem", color: "#9CA3AF", marginTop: "0.125rem" }}>{card.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom: Review + Recent */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "1.5rem" }}>
        {/* Today's Review Recommendations */}
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "1rem",
            }}
          >
            <h3 style={{ color: "#111827" }}>오늘의 복습 추천</h3>
            <button
              onClick={() => onNavigate("weak-concepts")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
                fontSize: "0.8125rem",
                color: "#C8962A",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              전체 보기 <ArrowRight size={14} />
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
            {recommendations.length === 0 ? (
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "12px",
                  padding: "1.125rem 1.25rem",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                  color: "#6B7280",
                  fontSize: "0.875rem",
                }}
              >
                저장된 학습 데이터가 없거나 현재 추천할 취약 개념이 없습니다.
              </div>
            ) : (
              recommendations.map((card, i) => (
                <div
                  key={`${card.subject}-${card.concept}-${i}`}
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: "12px",
                    padding: "1.125rem 1.25rem",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    borderLeft: "4px solid #C8962A",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                      <span
                        style={{
                          backgroundColor: "#FEF3C7",
                          color: "#92690B",
                          fontSize: "0.6875rem",
                          fontWeight: 600,
                          padding: "0.125rem 0.5rem",
                          borderRadius: "999px",
                        }}
                      >
                        복습 추천
                      </span>
                      <span style={{ fontSize: "0.75rem", color: "#9CA3AF" }}>{card.subject}</span>
                    </div>
                    <div style={{ fontWeight: 600, color: "#111827", fontSize: "1rem", marginBottom: "0.25rem" }}>
                      {card.concept}
                    </div>
                    <div style={{ fontSize: "0.8125rem", color: "#6B7280" }}>{card.reason}</div>
                  </div>
                  <div style={{ textAlign: "center", flexShrink: 0 }}>
                    <div style={{ fontSize: "1.25rem", fontWeight: 700, color: card.score < 40 ? "#EF4444" : "#C8962A" }}>
                      {card.score}%
                    </div>
                    <div style={{ fontSize: "0.6875rem", color: "#9CA3AF" }}>이해도</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Sessions */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <h3 style={{ color: "#111827" }}>최근 학습 세션</h3>
            <button
              onClick={() => onNavigate("sessions")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
                fontSize: "0.8125rem",
                color: "#C8962A",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              전체 <ArrowRight size={14} />
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {recentSessions.length === 0 ? (
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "10px",
                  padding: "1rem 1.125rem",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                  color: "#6B7280",
                  fontSize: "0.875rem",
                }}
              >
                최근 학습 세션이 없습니다.
              </div>
            ) : (
              recentSessions.map((s) => (
                <div
                  key={s.id}
                  onClick={() => onNavigate("sessions")}
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: "10px",
                    padding: "1rem 1.125rem",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.375rem" }}>
                    <span style={{ fontSize: "0.75rem", color: "#9CA3AF" }}>{s.date}</span>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        color: s.averageUnderstanding >= 75 ? "#10B981" : s.averageUnderstanding >= 60 ? "#C8962A" : "#EF4444",
                      }}
                    >
                      {s.averageUnderstanding}%
                    </span>
                  </div>
                  <div style={{ fontWeight: 500, color: "#1F2937", fontSize: "0.875rem", marginBottom: "0.25rem" }}>
                    {s.book}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#6B7280" }}>{s.problemCount}문제</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
