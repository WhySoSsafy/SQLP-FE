import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { LearningSession, ProblemAnalysis, Understanding } from "../domain/types";
import { getSelectedOrNewestSession } from "../domain/storage";

interface Props {
  sessions: LearningSession[];
  selectedSessionId: string | null;
}

const Badge = ({ val }: { val: Understanding }) => {
  const config: Record<Understanding, { bg: string; color: string; text: string }> = {
    잘함: { bg: "#ECFDF5", color: "#065F46", text: "잘함" },
    애매: { bg: "#FEF3C7", color: "#92690B", text: "애매" },
    모름: { bg: "#FEF2F2", color: "#991B1B", text: "모름" },
  };
  const c = config[val];
  return (
    <span
      style={{
        backgroundColor: c.bg,
        color: c.color,
        fontSize: "0.75rem",
        fontWeight: 600,
        padding: "0.1875rem 0.625rem",
        borderRadius: "999px",
        display: "inline-block",
      }}
    >
      {c.text}
    </span>
  );
};

export default function ProblemDetail({ sessions, selectedSessionId }: Props) {
  const session = getSelectedOrNewestSession(sessions, selectedSessionId);
  const [selected, setSelected] = useState<ProblemAnalysis | null>(null);

  useEffect(() => {
    setSelected(null);
  }, [session?.id]);

  if (!session) {
    return (
      <div style={{ display: "flex", gap: "1.5rem", maxWidth: "1200px" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", overflow: "hidden" }}>
            <div style={{ padding: "1.125rem 1.5rem", color: "#6B7280", fontSize: "0.875rem" }}>
              저장된 학습 세션이 없습니다. JSON 등록 후 문제별 이해도를 확인할 수 있습니다.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: "1.5rem", maxWidth: "1200px" }}>
      {/* Table */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", overflow: "hidden" }}>
          <div style={{ padding: "1.125rem 1.5rem", borderBottom: "1px solid #F3F4F6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h3 style={{ color: "#111827" }}>문제별 이해도 — {session.book} ({session.session_date})</h3>
            <span style={{ fontSize: "0.8125rem", color: "#6B7280" }}>총 {session.problems.length}문제</span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
              <thead>
                <tr style={{ backgroundColor: "#F9FAFB" }}>
                  {["#", "과목", "핵심 개념", ...session.speakers.flatMap((speaker) => [`${speaker} 정답`, `${speaker} 이해도`]), "복습"].map((h) => (
                    <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", color: "#6B7280", fontWeight: 500, fontSize: "0.8125rem", whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {session.problems.map((p) => {
                  const needReview = p.participants.some((participant) => participant.review_required);

                  return (
                    <tr
                      key={p.id}
                      onClick={() => setSelected(p)}
                      style={{
                        borderTop: "1px solid #F3F4F6",
                        cursor: "pointer",
                        backgroundColor: selected?.id === p.id ? "#FEF8EC" : "transparent",
                      }}
                    >
                      <td style={{ padding: "0.875rem 1rem", color: "#374151", fontWeight: 600 }}>{p.problem_number}번</td>
                      <td style={{ padding: "0.875rem 1rem", color: "#6B7280", whiteSpace: "nowrap", fontSize: "0.8125rem" }}>{p.subject_area}</td>
                      <td style={{ padding: "0.875rem 1rem" }}>
                        <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
                          {p.concepts.map((c) => (
                            <span key={c} style={{ backgroundColor: "#F3F4F6", color: "#374151", fontSize: "0.75rem", padding: "0.125rem 0.5rem", borderRadius: "6px" }}>{c}</span>
                          ))}
                        </div>
                      </td>
                      {session.speakers.flatMap((speaker) => {
                        const participant = p.participants.find((item) => item.name === speaker);

                        return [
                          <td key={`${p.id}-${speaker}-correct`} style={{ padding: "0.875rem 1rem" }}>
                            {participant ? (
                              <span style={{ color: participant.is_correct ? "#10B981" : "#EF4444", fontWeight: 600 }}>
                                {participant.is_correct ? "O" : "X"}
                              </span>
                            ) : (
                              <span style={{ color: "#9CA3AF" }}>-</span>
                            )}
                          </td>,
                          <td key={`${p.id}-${speaker}-understanding`} style={{ padding: "0.875rem 1rem" }}>
                            {participant ? <Badge val={participant.understanding} /> : <span style={{ color: "#9CA3AF" }}>-</span>}
                          </td>,
                        ];
                      })}
                      <td style={{ padding: "0.875rem 1rem" }}>
                        {needReview ? (
                          <span style={{ fontSize: "0.75rem", color: "#EF4444", fontWeight: 600, backgroundColor: "#FEF2F2", padding: "0.125rem 0.5rem", borderRadius: "999px" }}>필요</span>
                        ) : (
                          <span style={{ fontSize: "0.75rem", color: "#9CA3AF" }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detail Panel */}
      {selected && (
        <div
          style={{
            width: "360px",
            flexShrink: 0,
            backgroundColor: "#FFFFFF",
            borderRadius: "12px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            display: "flex",
            flexDirection: "column",
            maxHeight: "calc(100vh - 120px)",
            position: "sticky",
            top: "1.75rem",
          }}
        >
          {/* Header */}
          <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid #F3F4F6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <span style={{ fontWeight: 700, color: "#C8962A", fontSize: "0.9375rem" }}>{selected.problem_number}번 문제</span>
              <span style={{ fontSize: "0.8125rem", color: "#6B7280", marginLeft: "0.5rem" }}>{selected.subject_area}</span>
            </div>
            <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", padding: "0.25rem" }}>
              <X size={18} color="#9CA3AF" />
            </button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "1.125rem" }}>
            <Section label="문제 요약" content={selected.solution_summary} />
            <Section label="해설 요약" content={selected.solution_summary} />

            {selected.participants.map((participant, index) => (
              <div key={participant.name} style={{ marginBottom: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.625rem" }}>
                  <div style={{ width: "24px", height: "24px", borderRadius: "50%", backgroundColor: getAvatarColor(index), display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "0.75rem", fontWeight: 600 }}>
                    {participant.name.charAt(0) || "?"}
                  </div>
                  <span style={{ fontWeight: 600, color: "#111827", fontSize: "0.875rem" }}>{participant.name} 분석</span>
                  <Badge val={participant.understanding} />
                </div>
                <div style={{ backgroundColor: "#F9FAFB", borderRadius: "8px", padding: "0.75rem" }}>
                  <AnalysisRow label="맞힌 개념" items={participant.concepts_covered} color="#10B981" />
                  <AnalysisRow label="놓친 개념" items={participant.concepts_missed} color="#EF4444" />
                  <AnalysisRow label="오개념" items={participant.errors} color="#F59E0B" />
                  <div style={{ fontSize: "0.8125rem" }}>
                    <span style={{ color: "#6B7280" }}>복습 필요: </span>
                    <span style={{ color: participant.review_required ? "#EF4444" : "#9CA3AF", fontWeight: participant.review_required ? 600 : 400 }}>
                      {participant.review_required ? "필요" : "아니오"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ label, content }: { label: string; content: string }) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", marginBottom: "0.375rem" }}>{label}</div>
      <div style={{ fontSize: "0.8125rem", color: "#374151", lineHeight: 1.6 }}>{content}</div>
    </div>
  );
}

function AnalysisRow({ label, items, color }: { label: string; items: string[]; color: string }) {
  return (
    <div style={{ fontSize: "0.8125rem", marginBottom: "0.375rem" }}>
      <span style={{ color: "#6B7280" }}>{label}: </span>
      {items.length === 0 ? (
        <span style={{ color: "#9CA3AF" }}>없음</span>
      ) : (
        items.map((item) => (
          <span key={item} style={{ backgroundColor: color + "15", color, fontSize: "0.75rem", padding: "0.0625rem 0.4375rem", borderRadius: "4px", marginRight: "0.25rem" }}>{item}</span>
        ))
      )}
    </div>
  );
}

function getAvatarColor(index: number): string {
  return ["#C8962A", "#3B82F6", "#10B981", "#8B5CF6", "#EF4444"][index % 5];
}
