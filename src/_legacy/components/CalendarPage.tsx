import { useState } from "react";
import { ChevronLeft, ChevronRight, Flame, BookOpen } from "lucide-react";

const STUDY_DAYS: Record<string, { problems: number; avg: number; concepts: string[]; needReview: number; speakers: string[] }> = {
  "2026-06-03": { problems: 8, avg: 70, concepts: ["정규화"], needReview: 2, speakers: ["세은"] },
  "2026-06-05": { problems: 12, avg: 55, concepts: ["서브쿼리", "인라인뷰"], needReview: 6, speakers: ["세은", "수철"] },
  "2026-06-07": { problems: 10, avg: 65, concepts: ["인덱스"], needReview: 4, speakers: ["세은"] },
  "2026-06-08": { problems: 12, avg: 80, concepts: ["정규화", "식별관계"], needReview: 2, speakers: ["세은"] },
  "2026-06-09": { problems: 15, avg: 68, concepts: ["GROUP BY", "집계함수"], needReview: 5, speakers: ["세은", "수철"] },
  "2026-06-10": { problems: 18, avg: 72, concepts: ["OUTER JOIN", "NULL"], needReview: 5, speakers: ["세은", "수철"] },
  "2026-06-11": { problems: 15, avg: 68, concepts: ["SQLP 2과목"], needReview: 7, speakers: ["세은", "수철"] },
  "2026-06-12": { problems: 20, avg: 76, concepts: ["실행계획", "인덱스", "윈도우 함수"], needReview: 6, speakers: ["세은", "수철"] },
};

const DAYS_KO = ["일", "월", "화", "수", "목", "금", "토"];

export default function CalendarPage() {
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(6); // June
  const [selectedDate, setSelectedDate] = useState<string>("2026-06-12");

  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();

  const pad = (n: number) => String(n).padStart(2, "0");
  const dateStr = (d: number) => `${year}-${pad(month)}-${pad(d)}`;

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  };

  const selectedData = selectedDate ? STUDY_DAYS[selectedDate] : null;
  const totalProblems = Object.values(STUDY_DAYS).reduce((s, d) => s + d.problems, 0);

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div style={{ maxWidth: "1100px" }}>
      {/* Stats top */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "1.75rem" }}>
        {[
          { label: "현재 연속 학습일", value: "4일", icon: <Flame size={20} color="#C8962A" />, accent: "#FEF8EC" },
          { label: "이번 달 총 풀이 문제", value: `${totalProblems}문제`, icon: <BookOpen size={20} color="#3B82F6" />, accent: "#EFF6FF" },
          { label: "이번 달 복습 필요", value: "18문제", icon: <span style={{ fontSize: "1.125rem" }}>🔁</span>, accent: "#FEF2F2" },
        ].map((s, i) => (
          <div
            key={i}
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "12px",
              padding: "1.125rem 1.375rem",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              display: "flex",
              alignItems: "center",
              gap: "1rem",
            }}
          >
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "10px",
                backgroundColor: s.accent,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: "0.8125rem", color: "#6B7280", marginBottom: "0.125rem" }}>{s.label}</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#111827" }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Calendar + Sidebar */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "1.5rem" }}>
        {/* Calendar */}
        <div style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", padding: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          {/* Month nav */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
            <button onClick={prevMonth} style={{ background: "none", border: "1px solid #E5E7EB", borderRadius: "8px", width: "32px", height: "32px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ChevronLeft size={16} color="#6B7280" />
            </button>
            <h3 style={{ color: "#111827" }}>{year}년 {month}월</h3>
            <button onClick={nextMonth} style={{ background: "none", border: "1px solid #E5E7EB", borderRadius: "8px", width: "32px", height: "32px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ChevronRight size={16} color="#6B7280" />
            </button>
          </div>

          {/* Day headers */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: "0.5rem" }}>
            {DAYS_KO.map((d, i) => (
              <div key={d} style={{ textAlign: "center", fontSize: "0.8125rem", fontWeight: 500, color: i === 0 ? "#EF4444" : i === 6 ? "#3B82F6" : "#6B7280", padding: "0.375rem 0" }}>
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "0.25rem" }}>
            {cells.map((day, idx) => {
              if (!day) return <div key={`empty-${idx}`} />;
              const ds = dateStr(day);
              const data = STUDY_DAYS[ds];
              const isSelected = ds === selectedDate;
              const isToday = ds === "2026-06-12";
              const dayOfWeek = (firstDay + day - 1) % 7;

              return (
                <div
                  key={day}
                  onClick={() => setSelectedDate(ds)}
                  style={{
                    borderRadius: "8px",
                    padding: "0.5rem 0.25rem",
                    textAlign: "center",
                    cursor: "pointer",
                    backgroundColor: isSelected ? "#FEF3C7" : isToday && !isSelected ? "#FFFBEB" : "transparent",
                    border: isSelected ? "1.5px solid #C8962A" : isToday ? "1px solid #FDE68A" : "1px solid transparent",
                    minHeight: "60px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "flex-start",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: isToday ? 700 : 400,
                      color: dayOfWeek === 0 ? "#EF4444" : dayOfWeek === 6 ? "#3B82F6" : isSelected ? "#92690B" : "#374151",
                    }}
                  >
                    {day}
                  </span>
                  {data && (
                    <div style={{ marginTop: "0.25rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.125rem" }}>
                      <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#C8962A" }} />
                      <span style={{ fontSize: "0.625rem", color: "#92690B", fontWeight: 500 }}>{data.problems}문</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ display: "flex", gap: "1rem", marginTop: "1rem", justifyContent: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.75rem", color: "#6B7280" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#C8962A" }} />
              학습한 날
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.75rem", color: "#6B7280" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "2px", border: "1.5px solid #C8962A" }} />
              오늘
            </div>
          </div>
        </div>

        {/* Date Detail */}
        <div style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", padding: "1.375rem", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          {selectedData ? (
            <>
              <div style={{ fontWeight: 700, color: "#C8962A", fontSize: "1rem", marginBottom: "0.375rem" }}>{selectedDate}</div>
              <div style={{ fontSize: "0.8125rem", color: "#6B7280", marginBottom: "1.25rem" }}>학습 요약</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                {[
                  { label: "푼 문제 수", value: `${selectedData.problems}문제` },
                  { label: "평균 이해도", value: `${selectedData.avg}%` },
                  { label: "복습 필요", value: `${selectedData.needReview}문제` },
                  { label: "참여자", value: selectedData.speakers.join(", ") },
                ].map((row) => (
                  <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "0.75rem", borderBottom: "1px solid #F3F4F6" }}>
                    <span style={{ fontSize: "0.875rem", color: "#6B7280" }}>{row.label}</span>
                    <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#111827" }}>{row.value}</span>
                  </div>
                ))}
                <div>
                  <div style={{ fontSize: "0.875rem", color: "#6B7280", marginBottom: "0.5rem" }}>주요 개념</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
                    {selectedData.concepts.map((c) => (
                      <span key={c} style={{ backgroundColor: "#FEF3C7", color: "#92690B", fontSize: "0.75rem", fontWeight: 500, padding: "0.1875rem 0.625rem", borderRadius: "999px" }}>{c}</span>
                    ))}
                  </div>
                </div>

                {/* Progress bar */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8125rem", color: "#6B7280", marginBottom: "0.375rem" }}>
                    <span>이해도</span>
                    <span style={{ fontWeight: 600, color: selectedData.avg >= 75 ? "#10B981" : selectedData.avg >= 60 ? "#C8962A" : "#EF4444" }}>{selectedData.avg}%</span>
                  </div>
                  <div style={{ height: "8px", borderRadius: "999px", backgroundColor: "#F3F4F6", overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${selectedData.avg}%`,
                        height: "100%",
                        borderRadius: "999px",
                        backgroundColor: selectedData.avg >= 75 ? "#10B981" : selectedData.avg >= 60 ? "#C8962A" : "#EF4444",
                      }}
                    />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "200px", color: "#9CA3AF", textAlign: "center" }}>
              <Calendar style={{ marginBottom: "0.75rem" }} size={32} color="#D1D5DB" />
              <div style={{ fontSize: "0.875rem" }}>날짜를 선택하면<br />학습 요약을 확인할 수 있어요</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Calendar({ size, color, style }: { size: number; color: string; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
