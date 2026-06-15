import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { AlertTriangle, RefreshCw } from "lucide-react";
import type { LearningSession } from "../domain/types";
import { buildWeakConcepts } from "../domain/analytics";

interface Props {
  sessions: LearningSession[];
}

const BAR_COLORS = ["#C8962A", "#3B82F6", "#10B981", "#EF4444", "#8B5CF6", "#F97316"];

export default function WeakConcepts({ sessions }: Props) {
  const [filter, setFilter] = useState<string>("all");
  const concepts = buildWeakConcepts(sessions);
  const top5 = concepts.slice(0, 5);
  const participantNames = Array.from(new Set(sessions.flatMap((session) => session.speakers)));
  const activeFilter = filter === "all" || participantNames.includes(filter) ? filter : "all";

  const chartData = concepts.map((concept) => {
    const participantScores = Object.fromEntries(
      participantNames.map((participant) => [participant, concept.scoreByParticipant[participant] ?? 0]),
    );

    return {
      name: concept.name,
      ...participantScores,
      평균: concept.averageScore,
    };
  });

  const weakScore = (concept: (typeof concepts)[number]) =>
    activeFilter === "all" ? concept.averageScore : concept.scoreByParticipant[activeFilter] ?? 0;

  const weakItems = (concept: (typeof concepts)[number]) =>
    activeFilter === "all"
      ? Object.values(concept.weakCountByParticipant).reduce((sum, count) => sum + count, 0)
      : concept.weakCountByParticipant[activeFilter] ?? 0;

  return (
    <div style={{ maxWidth: "1200px" }}>
      {/* Filter toggle */}
      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1.5rem" }}>
        <span style={{ fontSize: "0.875rem", color: "#6B7280", marginRight: "0.25rem" }}>보기:</span>
        {["전체", ...participantNames].map((label) => {
          const key = label === "전체" ? "all" : label;

          return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              style={{
                padding: "0.375rem 0.875rem",
                borderRadius: "8px",
                border: activeFilter === key ? "1.5px solid #C8962A" : "1px solid #E5E7EB",
                backgroundColor: activeFilter === key ? "#FEF3C7" : "#FFFFFF",
                color: activeFilter === key ? "#92690B" : "#6B7280",
                fontSize: "0.8125rem",
                fontWeight: activeFilter === key ? 600 : 400,
                cursor: "pointer",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {concepts.length === 0 ? (
        <div style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", padding: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", color: "#6B7280", fontSize: "0.875rem" }}>
          저장된 학습 데이터가 없습니다. JSON 등록 후 취약 개념을 확인할 수 있습니다.
        </div>
      ) : (
        <>

      {/* TOP 5 cards */}
      <div style={{ marginBottom: "1.75rem" }}>
        <h3 style={{ color: "#111827", marginBottom: "0.875rem" }}>
          <AlertTriangle size={16} color="#C8962A" style={{ display: "inline", marginRight: "0.375rem", verticalAlign: "middle" }} />
          취약 개념 TOP 5
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "0.875rem" }}>
          {top5.map((c, i) => (
            <div
              key={c.name}
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "12px",
                padding: "1.125rem",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                borderTop: "3px solid #C8962A",
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "0.75rem",
                  right: "0.875rem",
                  width: "22px",
                  height: "22px",
                  borderRadius: "50%",
                  backgroundColor: i === 0 ? "#C8962A" : "#F3F4F6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.6875rem",
                  fontWeight: 700,
                  color: i === 0 ? "#FFFFFF" : "#6B7280",
                }}
              >
                {i + 1}
              </div>
              <div style={{ fontWeight: 700, color: "#111827", marginBottom: "0.5rem", paddingRight: "1.5rem" }}>{c.name}</div>
              <div style={{ fontSize: "1.75rem", fontWeight: 700, color: weakScore(c) < 40 ? "#EF4444" : "#C8962A" }}>
                {weakScore(c)}%
              </div>
              <div style={{ fontSize: "0.75rem", color: "#9CA3AF" }}>이해도</div>
            </div>
          ))}
        </div>
      </div>

      {/* Chart + Sidebar */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "1.5rem" }}>
        {/* Bar Chart */}
        <div style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", padding: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <h3 style={{ color: "#111827", marginBottom: "1.25rem" }}>개념별 이해도 비교</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 0, right: 16, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6B7280" }} />
              <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
              <Tooltip formatter={(value: number) => `${value}%`} />
              <Legend wrapperStyle={{ fontSize: "0.8125rem" }} />
              {participantNames
                .map((participant, index) => ({ participant, color: BAR_COLORS[index % BAR_COLORS.length] }))
                .filter(({ participant }) => activeFilter === "all" || activeFilter === participant)
                .map(({ participant, color }) => (
                  <Bar key={participant} dataKey={participant} fill={color} radius={[4, 4, 0, 0]} />
                ))}
              {activeFilter === "all" && <Bar dataKey="평균" fill="#E5E7EB" radius={[4, 4, 0, 0]} />}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Review List */}
        <div style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", padding: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <h3 style={{ color: "#111827", marginBottom: "1.125rem" }}>개념별 복습 추천</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {concepts.map((c) => (
              <div
                key={c.name}
                style={{
                  borderRadius: "8px",
                  padding: "0.75rem",
                  backgroundColor: c.recommend ? "#FEF8EC" : "#F9FAFB",
                  border: c.recommend ? "1px solid #FDE68A" : "1px solid #F3F4F6",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.375rem" }}>
                  <span style={{ fontWeight: 600, fontSize: "0.875rem", color: "#111827" }}>{c.name}</span>
                  {c.recommend && (
                    <span style={{ backgroundColor: "#FEF3C7", color: "#92690B", fontSize: "0.6875rem", fontWeight: 600, padding: "0.125rem 0.5rem", borderRadius: "999px" }}>
                      추천
                    </span>
                  )}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#6B7280", display: "flex", flexDirection: "column", gap: "0.125rem" }}>
                  <span>전체 {c.totalProblems}문제 · 취약 {weakItems(c)}문제</span>
                  <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                    <RefreshCw size={10} /> 최근 복습: {c.lastReviewDate}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
}
