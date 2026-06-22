import { useState } from "react";
import { Search, ChevronRight, Filter } from "lucide-react";
import type { LearningSession } from "../domain/types";
import { summarizeSessions } from "../domain/analytics";

interface Props {
  sessions: LearningSession[];
  onSelectSession: (sessionId: string) => void;
}

export default function SessionList({ sessions, onSelectSession }: Props) {
  const [search, setSearch] = useState("");
  const [underFilter, setUnderFilter] = useState<"all" | "high" | "mid" | "low">("all");
  const summaries = summarizeSessions(sessions);

  const filtered = summaries.filter((s) => {
    const matchSearch = s.book.toLowerCase().includes(search.toLowerCase());
    const matchUnder =
      underFilter === "all"
        ? true
        : underFilter === "high"
        ? s.averageUnderstanding >= 75
        : underFilter === "mid"
        ? s.averageUnderstanding >= 60 && s.averageUnderstanding < 75
        : s.averageUnderstanding < 60;
    return matchSearch && matchUnder;
  });

  const avgColor = (avg: number) =>
    avg >= 75 ? "#10B981" : avg >= 60 ? "#C8962A" : "#EF4444";

  return (
    <div style={{ maxWidth: "900px" }}>
      {/* Filters */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "12px",
          padding: "1rem 1.25rem",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          marginBottom: "1.25rem",
          display: "flex",
          gap: "1rem",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
          <Search size={16} color="#9CA3AF" style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="문제집명 검색..."
            style={{
              width: "100%",
              padding: "0.5625rem 0.75rem 0.5625rem 2.25rem",
              border: "1px solid #E5E7EB",
              borderRadius: "8px",
              fontSize: "0.875rem",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <Filter size={15} color="#6B7280" />
          {([
            { key: "all", label: "전체" },
            { key: "high", label: "잘함 (75%↑)" },
            { key: "mid", label: "애매 (60~75%)" },
            { key: "low", label: "취약 (60%↓)" },
          ] as const).map((f) => (
            <button
              key={f.key}
              onClick={() => setUnderFilter(f.key)}
              style={{
                padding: "0.4375rem 0.875rem",
                borderRadius: "8px",
                border: underFilter === f.key ? "1.5px solid #C8962A" : "1px solid #E5E7EB",
                backgroundColor: underFilter === f.key ? "#FEF8EC" : "#FFFFFF",
                color: underFilter === f.key ? "#C8962A" : "#6B7280",
                fontSize: "0.8125rem",
                fontWeight: underFilter === f.key ? 600 : 400,
                cursor: "pointer",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Session count */}
      <div style={{ fontSize: "0.875rem", color: "#6B7280", marginBottom: "0.875rem" }}>
        총 {filtered.length}개 세션
      </div>

      {/* Session Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
        {filtered.length === 0 ? (
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "12px",
              padding: "2rem",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              color: "#6B7280",
              fontSize: "0.9375rem",
              textAlign: "center",
            }}
          >
            {summaries.length === 0
              ? "저장된 학습 세션이 없습니다. JSON 등록 화면에서 분석 결과를 먼저 등록하세요."
              : "검색 또는 필터 조건에 맞는 학습 세션이 없습니다."}
          </div>
        ) : filtered.map((s) => (
          <div
            key={s.id}
            onClick={() => onSelectSession(s.id)}
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "12px",
              padding: "1.25rem 1.5rem",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "1.25rem",
              transition: "box-shadow 0.15s",
            }}
          >
            {/* Date badge */}
            <div
              style={{
                textAlign: "center",
                backgroundColor: "#FEF8EC",
                borderRadius: "10px",
                padding: "0.5rem 0.875rem",
                flexShrink: 0,
              }}
            >
              <div style={{ fontSize: "0.75rem", color: "#92690B" }}>{s.date.slice(0, 7)}</div>
              <div style={{ fontSize: "1.375rem", fontWeight: 700, color: "#C8962A", lineHeight: 1 }}>
                {s.date.slice(8)}
              </div>
            </div>

            {/* Info */}
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, color: "#111827", marginBottom: "0.375rem" }}>{s.book}</div>
              <div style={{ display: "flex", gap: "1.25rem", fontSize: "0.8125rem", color: "#6B7280" }}>
                <span>📄 {s.problemCount}문제</span>
                <span>👥 참여자: {s.speakers.join(", ")}</span>
                <span
                  style={{
                    color: s.reviewRequiredCount > 5 ? "#EF4444" : "#C8962A",
                    fontWeight: 500,
                  }}
                >
                  🔁 복습 필요 {s.reviewRequiredCount}문제
                </span>
              </div>
            </div>

            {/* Avg Understanding */}
            <div style={{ textAlign: "center", flexShrink: 0 }}>
              <div style={{ fontSize: "0.6875rem", color: "#9CA3AF", marginBottom: "0.25rem" }}>평균 이해도</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: avgColor(s.averageUnderstanding) }}>{s.averageUnderstanding}%</div>
              <div
                style={{
                  marginTop: "0.25rem",
                  height: "4px",
                  width: "80px",
                  backgroundColor: "#F3F4F6",
                  borderRadius: "999px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${s.averageUnderstanding}%`,
                    height: "100%",
                    backgroundColor: avgColor(s.averageUnderstanding),
                    borderRadius: "999px",
                  }}
                />
              </div>
            </div>

            <ChevronRight size={18} color="#D1D5DB" />
          </div>
        ))}
      </div>
    </div>
  );
}
