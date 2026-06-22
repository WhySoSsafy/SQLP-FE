<script setup lang="ts">
import { ref, computed } from "vue";
import type { CSSProperties } from "vue";
import { ChevronLeft, ChevronRight, Flame, BookOpen } from "lucide-vue-next";

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

const year = ref(2026);
const month = ref(6); // June
const selectedDate = ref<string>("2026-06-12");

const firstDay = computed(() => new Date(year.value, month.value - 1, 1).getDay());
const daysInMonth = computed(() => new Date(year.value, month.value, 0).getDate());

const pad = (n: number) => String(n).padStart(2, "0");
const dateStr = (d: number) => `${year.value}-${pad(month.value)}-${pad(d)}`;

const prevMonth = () => {
  if (month.value === 1) { year.value -= 1; month.value = 12; }
  else month.value -= 1;
};
const nextMonth = () => {
  if (month.value === 12) { year.value += 1; month.value = 1; }
  else month.value += 1;
};

const selectedData = computed(() => selectedDate.value ? STUDY_DAYS[selectedDate.value] : null);
const totalProblems = Object.values(STUDY_DAYS).reduce((s, d) => s + d.problems, 0);

const cells = computed<(number | null)[]>(() => {
  const arr: (number | null)[] = [];
  for (let i = 0; i < firstDay.value; i++) arr.push(null);
  for (let d = 1; d <= daysInMonth.value; d++) arr.push(d);
  return arr;
});

const stats = computed(() => [
  { label: "현재 연속 학습일", value: "4일", accent: "#FEF8EC", iconType: "flame" as const },
  { label: "이번 달 총 풀이 문제", value: `${totalProblems}문제`, accent: "#EFF6FF", iconType: "bookopen" as const },
  { label: "이번 달 복습 필요", value: "18문제", accent: "#FEF2F2", iconType: "emoji" as const },
]);

const detailRows = computed(() => {
  const d = selectedData.value;
  if (!d) return [];
  return [
    { label: "푼 문제 수", value: `${d.problems}문제` },
    { label: "평균 이해도", value: `${d.avg}%` },
    { label: "복습 필요", value: `${d.needReview}문제` },
    { label: "참여자", value: d.speakers.join(", ") },
  ];
});

const avgColor = computed(() => {
  const avg = selectedData.value?.avg ?? 0;
  return avg >= 75 ? "#10B981" : avg >= 60 ? "#C8962A" : "#EF4444";
});

const dayStyles = (day: number, idx: number): CSSProperties => {
  const ds = dateStr(day);
  const isSelected = ds === selectedDate.value;
  const isToday = ds === "2026-06-12";
  return {
    borderRadius: "8px",
    padding: "0.5rem 0.25rem",
    textAlign: "center" as const,
    cursor: "pointer",
    backgroundColor: isSelected ? "#FEF3C7" : isToday && !isSelected ? "#FFFBEB" : "transparent",
    border: isSelected ? "1.5px solid #C8962A" : isToday ? "1px solid #FDE68A" : "1px solid transparent",
    minHeight: "60px",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "flex-start",
  };
};

const dayNumberColor = (day: number): string => {
  const ds = dateStr(day);
  const isSelected = ds === selectedDate.value;
  const dayOfWeek = (firstDay.value + day - 1) % 7;
  return dayOfWeek === 0 ? "#EF4444" : dayOfWeek === 6 ? "#3B82F6" : isSelected ? "#92690B" : "#374151";
};

const dayNumberWeight = (day: number): number => {
  const ds = dateStr(day);
  return ds === "2026-06-12" ? 700 : 400;
};
</script>

<template>
  <div :style="{ maxWidth: '1100px' }">
    <!-- Stats top -->
    <div :style="{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.75rem' }">
      <div
        v-for="(s, i) in stats"
        :key="i"
        :style="{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          padding: '1.125rem 1.375rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
        }"
      >
        <div
          :style="{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            backgroundColor: s.accent,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }"
        >
          <Flame v-if="s.iconType === 'flame'" :size="20" color="#C8962A" />
          <BookOpen v-else-if="s.iconType === 'bookopen'" :size="20" color="#3B82F6" />
          <span v-else :style="{ fontSize: '1.125rem' }">🔁</span>
        </div>
        <div>
          <div :style="{ fontSize: '0.8125rem', color: '#6B7280', marginBottom: '0.125rem' }">{{ s.label }}</div>
          <div :style="{ fontSize: '1.5rem', fontWeight: 700, color: '#111827' }">{{ s.value }}</div>
        </div>
      </div>
    </div>

    <!-- Calendar + Sidebar -->
    <div :style="{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem' }">
      <!-- Calendar -->
      <div :style="{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }">
        <!-- Month nav -->
        <div :style="{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }">
          <button @click="prevMonth" :style="{ background: 'none', border: '1px solid #E5E7EB', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }">
            <ChevronLeft :size="16" color="#6B7280" />
          </button>
          <h3 :style="{ color: '#111827' }">{{ year }}년 {{ month }}월</h3>
          <button @click="nextMonth" :style="{ background: 'none', border: '1px solid #E5E7EB', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }">
            <ChevronRight :size="16" color="#6B7280" />
          </button>
        </div>

        <!-- Day headers -->
        <div :style="{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '0.5rem' }">
          <div
            v-for="(d, i) in DAYS_KO"
            :key="d"
            :style="{
              textAlign: 'center' as CSSProperties['textAlign'],
              fontSize: '0.8125rem',
              fontWeight: 500,
              color: i === 0 ? '#EF4444' : i === 6 ? '#3B82F6' : '#6B7280',
              padding: '0.375rem 0',
            }"
          >
            {{ d }}
          </div>
        </div>

        <!-- Day cells -->
        <div :style="{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.25rem' }">
          <template v-for="(day, idx) in cells" :key="day !== null ? day : `empty-${idx}`">
            <div v-if="day === null" />
            <div
              v-else
              :style="dayStyles(day, idx)"
              @click="selectedDate = dateStr(day)"
            >
              <span
                :style="{
                  fontSize: '0.875rem',
                  fontWeight: dayNumberWeight(day),
                  color: dayNumberColor(day),
                }"
              >
                {{ day }}
              </span>
              <div
                v-if="STUDY_DAYS[dateStr(day)]"
                :style="{ marginTop: '0.25rem', display: 'flex', flexDirection: 'column' as CSSProperties['flexDirection'], alignItems: 'center', gap: '0.125rem' }"
              >
                <div :style="{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#C8962A' }" />
                <span :style="{ fontSize: '0.625rem', color: '#92690B', fontWeight: 500 }">{{ STUDY_DAYS[dateStr(day)].problems }}문</span>
              </div>
            </div>
          </template>
        </div>

        <!-- Legend -->
        <div :style="{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'center' }">
          <div :style="{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color: '#6B7280' }">
            <div :style="{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#C8962A' }" />
            학습한 날
          </div>
          <div :style="{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color: '#6B7280' }">
            <div :style="{ width: '8px', height: '8px', borderRadius: '2px', border: '1.5px solid #C8962A' }" />
            오늘
          </div>
        </div>
      </div>

      <!-- Date Detail -->
      <div :style="{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '1.375rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }">
        <template v-if="selectedData">
          <div :style="{ fontWeight: 700, color: '#C8962A', fontSize: '1rem', marginBottom: '0.375rem' }">{{ selectedDate }}</div>
          <div :style="{ fontSize: '0.8125rem', color: '#6B7280', marginBottom: '1.25rem' }">학습 요약</div>
          <div :style="{ display: 'flex', flexDirection: 'column' as CSSProperties['flexDirection'], gap: '0.875rem' }">
            <div
              v-for="row in detailRows"
              :key="row.label"
              :style="{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid #F3F4F6' }"
            >
              <span :style="{ fontSize: '0.875rem', color: '#6B7280' }">{{ row.label }}</span>
              <span :style="{ fontSize: '0.875rem', fontWeight: 600, color: '#111827' }">{{ row.value }}</span>
            </div>
            <div>
              <div :style="{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '0.5rem' }">주요 개념</div>
              <div :style="{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }">
                <span
                  v-for="c in selectedData.concepts"
                  :key="c"
                  :style="{ backgroundColor: '#FEF3C7', color: '#92690B', fontSize: '0.75rem', fontWeight: 500, padding: '0.1875rem 0.625rem', borderRadius: '999px' }"
                >{{ c }}</span>
              </div>
            </div>

            <!-- Progress bar -->
            <div>
              <div :style="{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: '#6B7280', marginBottom: '0.375rem' }">
                <span>이해도</span>
                <span :style="{ fontWeight: 600, color: avgColor }">{{ selectedData.avg }}%</span>
              </div>
              <div :style="{ height: '8px', borderRadius: '999px', backgroundColor: '#F3F4F6', overflow: 'hidden' }">
                <div
                  :style="{
                    width: `${selectedData.avg}%`,
                    height: '100%',
                    borderRadius: '999px',
                    backgroundColor: avgColor,
                  }"
                />
              </div>
            </div>
          </div>
        </template>
        <template v-else>
          <div :style="{ display: 'flex', flexDirection: 'column' as CSSProperties['flexDirection'], alignItems: 'center', justifyContent: 'center', height: '200px', color: '#9CA3AF', textAlign: 'center' as CSSProperties['textAlign'] }">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" :style="{ marginBottom: '0.75rem' }">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <div :style="{ fontSize: '0.875rem' }">날짜를 선택하면<br />학습 요약을 확인할 수 있어요</div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
