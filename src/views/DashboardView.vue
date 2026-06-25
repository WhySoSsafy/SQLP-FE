<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import type { CSSProperties } from "vue";
import { useRouter } from "vue-router";
import { BookOpen, AlertCircle, TrendingUp, Flame, ArrowRight, ChevronLeft, ChevronRight } from "lucide-vue-next";
import { buildDashboardSummary, buildReviewRecommendations, summarizeSessions } from "@/domain/analytics";
import { fetchCalendar } from "@/api";
import type { DashboardSummary, ReviewRecommendation, SessionSummary, CalendarDayEntry, CalendarMonthSummary } from "@/domain/types";

const router = useRouter();

const EMPTY_SUMMARY: DashboardSummary = {
  weeklyProblemCount: 0,
  reviewRequiredCount: 0,
  averageUnderstanding: 0,
  studyStreak: 0,
};

const summary = ref<DashboardSummary>(EMPTY_SUMMARY);
const recommendations = ref<ReviewRecommendation[]>([]);
const recentSessions = ref<SessionSummary[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

onMounted(async () => {
  loading.value = true;
  error.value = null;
  try {
    const [summaryData, recommendationData, sessionSummaries] = await Promise.all([
      buildDashboardSummary(),
      buildReviewRecommendations(),
      summarizeSessions(),
    ]);
    summary.value = summaryData;
    recommendations.value = recommendationData;
    recentSessions.value = sessionSummaries.slice(0, 4);
  } catch {
    error.value = "대시보드 데이터를 불러오지 못했습니다.";
  } finally {
    loading.value = false;
  }
});

// ── 캘린더 State ──────────────────────────────────────────────
type StudyDay = { problems: number; avg: number; concepts: string[]; needReview: number; speakers: string[] };
const DAYS_KO = ["일", "월", "화", "수", "목", "금", "토"];
const pad = (n: number) => String(n).padStart(2, "0");

const now = new Date();
const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

const calYear = ref(now.getFullYear());
const calMonth = ref(now.getMonth() + 1);
const calSelectedDate = ref<string | null>(null);
const calendarDays = ref<CalendarDayEntry[]>([]);
const calMonthSummary = ref<CalendarMonthSummary | null>(null);
const calLoading = ref(false);
const calError = ref<string | null>(null);

async function loadCalendar() {
  calLoading.value = true;
  calError.value = null;
  try {
    const res = await fetchCalendar(calYear.value, calMonth.value);
    calendarDays.value = Array.isArray(res?.days) ? res.days : [];
    calMonthSummary.value = res?.summary ?? null;
  } catch {
    calError.value = "학습 캘린더를 불러오지 못했습니다.";
    calendarDays.value = [];
    calMonthSummary.value = null;
  } finally {
    calLoading.value = false;
  }
}

watch([calYear, calMonth], loadCalendar, { immediate: true });

const calDateStr = (d: number) => `${calYear.value}-${pad(calMonth.value)}-${pad(d)}`;

const studyDays = computed<Record<string, StudyDay>>(() => {
  const map: Record<string, StudyDay> = {};
  for (const entry of calendarDays.value) {
    if (!entry?.date) continue;
    map[entry.date] = {
      problems: entry.problemCount ?? 0,
      avg: entry.averageUnderstanding ?? 0,
      concepts: Array.isArray(entry.concepts) ? entry.concepts : [],
      needReview: entry.reviewRequiredCount ?? 0,
      speakers: Array.isArray(entry.speakers) ? entry.speakers : [],
    };
  }
  return map;
});

const firstDay = computed(() => new Date(calYear.value, calMonth.value - 1, 1).getDay());
const daysInMonth = computed(() => new Date(calYear.value, calMonth.value, 0).getDate());

const prevMonth = () => {
  calSelectedDate.value = null;
  if (calMonth.value === 1) { calYear.value -= 1; calMonth.value = 12; }
  else calMonth.value -= 1;
};
const nextMonth = () => {
  calSelectedDate.value = null;
  if (calMonth.value === 12) { calYear.value += 1; calMonth.value = 1; }
  else calMonth.value += 1;
};

const calSelectedData = computed(() =>
  calSelectedDate.value ? studyDays.value[calSelectedDate.value] ?? null : null,
);

const cells = computed<(number | null)[]>(() => {
  const arr: (number | null)[] = [];
  for (let i = 0; i < firstDay.value; i++) arr.push(null);
  for (let d = 1; d <= daysInMonth.value; d++) arr.push(d);
  return arr;
});

const calDetailRows = computed(() => {
  const d = calSelectedData.value;
  if (!d) return [];
  return [
    { label: "푼 문제 수", value: `${d.problems}문제` },
    { label: "평균 이해도", value: `${d.avg}%` },
    { label: "복습 필요", value: `${d.needReview}문제` },
    { label: "참여자", value: d.speakers.join(", ") },
  ];
});

const calAvgColor = computed(() => {
  const avg = calSelectedData.value?.avg ?? 0;
  return avg >= 75 ? "#10B981" : avg >= 60 ? "#C8962A" : "#EF4444";
});

const dayStyles = (day: number): CSSProperties => {
  const ds = calDateStr(day);
  const isSelected = ds === calSelectedDate.value;
  const isToday = ds === todayStr;
  return {
    borderRadius: "8px",
    padding: "0.5rem 0.25rem",
    textAlign: "center" as const,
    cursor: "pointer",
    backgroundColor: isSelected ? "#FEF3C7" : isToday && !isSelected ? "#FFFBEB" : "transparent",
    border: isSelected ? "1.5px solid #C8962A" : isToday ? "1px solid #FDE68A" : "1px solid transparent",
    minHeight: "52px",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "flex-start",
  };
};

const dayNumberColor = (day: number): string => {
  const ds = calDateStr(day);
  const isSelected = ds === calSelectedDate.value;
  const dayOfWeek = (firstDay.value + day - 1) % 7;
  return dayOfWeek === 0 ? "#EF4444" : dayOfWeek === 6 ? "#3B82F6" : isSelected ? "#92690B" : "#374151";
};

const dayNumberWeight = (day: number): number => {
  return calDateStr(day) === todayStr ? 700 : 400;
};

const sectionHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: "1rem",
};
const sectionLinkStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "0.25rem",
  fontSize: "0.8125rem",
  color: "#C8962A",
  background: "none",
  border: "none",
  cursor: "pointer",
  fontWeight: 500,
  padding: "0",
};
const listStackStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "0.875rem",
};
const listCardStyle: CSSProperties = {
  backgroundColor: "#FFFFFF",
  borderRadius: "12px",
  padding: "1.125rem 1.25rem",
  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  display: "flex",
  alignItems: "center",
  gap: "1rem",
  borderLeft: "4px solid #C8962A",
  minHeight: "104px",
};
const emptyCardStyle: CSSProperties = {
  backgroundColor: "#FFFFFF",
  borderRadius: "12px",
  padding: "1.125rem 1.25rem",
  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  display: "flex",
  alignItems: "center",
  gap: "1rem",
  borderLeft: "4px solid #C8962A",
  minHeight: "104px",
  color: "#6B7280",
  fontSize: "0.875rem",
};
const percentBlockStyle: CSSProperties = {
  textAlign: "center",
  flexShrink: 0,
  minWidth: "56px",
};
const percentValueStyle: CSSProperties = {
  fontSize: "1.25rem",
  fontWeight: 700,
  lineHeight: 1.15,
};
const percentLabelStyle: CSSProperties = {
  fontSize: "0.6875rem",
  color: "#9CA3AF",
  marginTop: "0.125rem",
};

const summaryCardDefs = computed(() => [
  { label: "이번 주 풀이 문제", value: `${summary.value.weeklyProblemCount}문제`, sub: "이번 주 기준", iconName: "BookOpen", iconColor: "#C8962A", accent: "#FEF8EC" },
  { label: "복습 필요 문제", value: `${summary.value.reviewRequiredCount}문제`, sub: "전체 세션 기준", iconName: "AlertCircle", iconColor: "#EF4444", accent: "#FEF2F2" },
  { label: "평균 이해도", value: `${summary.value.averageUnderstanding}%`, sub: "전체 세션 평균", iconName: "TrendingUp", iconColor: "#10B981", accent: "#ECFDF5" },
  { label: "연속 학습일", value: `${summary.value.studyStreak}일`, sub: "오늘 기준", iconName: "Flame", iconColor: "#C8962A", accent: "#FEF8EC" },
]);

const iconComponents: Record<string, unknown> = { BookOpen, AlertCircle, TrendingUp, Flame };
</script>

<template>
  <div :style="{ width: '100%' }">
    <!-- Welcome -->
    <div :style="{ marginBottom: '1.75rem' }">
      <h1 :style="{ color: '#111827', marginBottom: '0.25rem' }">안녕하세요, 세은님 👋</h1>
      <p :style="{ color: '#6B7280', fontSize: '0.875rem' }">오늘도 SQLP 합격을 향해 한 걸음 더 나아가세요!</p>
    </div>

    <!-- Loading / Error -->
    <div v-if="loading" :style="{ color: '#6B7280', fontSize: '0.875rem', marginBottom: '1rem' }">
      대시보드 데이터를 불러오는 중...
    </div>
    <div
      v-else-if="error"
      :style="{ color: '#DC2626', fontSize: '0.875rem', marginBottom: '1rem' }"
    >
      {{ error }}
    </div>

    <!-- Summary Cards -->
    <div
      :style="{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '1rem',
        marginBottom: '2rem',
      }"
    >
      <div
        v-for="(card, i) in summaryCardDefs"
        :key="i"
        :style="{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          padding: '1.25rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
          borderTop: '3px solid #C8962A',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }"
      >
        <div :style="{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }">
          <span :style="{ fontSize: '0.8125rem', color: '#6B7280' }">{{ card.label }}</span>
          <div
            :style="{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: card.accent,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }"
          >
            <component :is="iconComponents[card.iconName]" :size="20" :color="card.iconColor" />
          </div>
        </div>
        <div>
          <div :style="{ fontSize: '1.625rem', fontWeight: 700, color: '#111827' }">{{ card.value }}</div>
          <div :style="{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: '0.125rem' }">{{ card.sub }}</div>
        </div>
      </div>
    </div>

    <!-- Bottom: 캘린더(좌) + 복습추천/세션(우) -->
    <div
      :style="{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '1.5rem',
        alignItems: 'start',
      }"
    >
      <!-- 왼쪽: 학습 캘린더 (span 2) -->
      <div
        :style="{
          gridColumn: 'span 2',
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          padding: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }"
      >
        <!-- 헤더 -->
        <div :style="{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }">
          <h3 :style="{ color: '#111827' }">학습 캘린더</h3>
          <div :style="{ display: 'flex', alignItems: 'center', gap: '0.5rem' }">
            <button
              @click="prevMonth"
              :style="{ background: 'none', border: '1px solid #E5E7EB', borderRadius: '8px', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }"
            >
              <ChevronLeft :size="14" color="#6B7280" />
            </button>
            <span :style="{ fontSize: '0.875rem', fontWeight: 600, color: '#374151' }">{{ calYear }}년 {{ calMonth }}월</span>
            <button
              @click="nextMonth"
              :style="{ background: 'none', border: '1px solid #E5E7EB', borderRadius: '8px', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }"
            >
              <ChevronRight :size="14" color="#6B7280" />
            </button>
          </div>
        </div>

        <!-- 로딩/에러 -->
        <div v-if="calLoading" :style="{ color: '#6B7280', fontSize: '0.8125rem', marginBottom: '0.75rem' }">불러오는 중...</div>
        <div v-else-if="calError" :style="{ color: '#DC2626', fontSize: '0.8125rem', marginBottom: '0.75rem' }">{{ calError }}</div>

        <!-- 요일 헤더 -->
        <div :style="{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '0.375rem' }">
          <div
            v-for="(d, i) in DAYS_KO"
            :key="d"
            :style="{
              textAlign: 'center' as CSSProperties['textAlign'],
              fontSize: '0.75rem',
              fontWeight: 500,
              color: i === 0 ? '#EF4444' : i === 6 ? '#3B82F6' : '#6B7280',
              padding: '0.25rem 0',
            }"
          >
            {{ d }}
          </div>
        </div>

        <!-- 날짜 셀 -->
        <div :style="{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.125rem' }">
          <template v-for="(day, idx) in cells" :key="day !== null ? day : `empty-${idx}`">
            <div v-if="day === null" />
            <div v-else :style="dayStyles(day)" @click="calSelectedDate = calDateStr(day)">
              <span :style="{ fontSize: '0.8125rem', fontWeight: dayNumberWeight(day), color: dayNumberColor(day) }">
                {{ day }}
              </span>
              <div
                v-if="studyDays[calDateStr(day)]"
                :style="{ marginTop: '0.125rem', display: 'flex', flexDirection: 'column' as CSSProperties['flexDirection'], alignItems: 'center', gap: '0.0625rem' }"
              >
                <div :style="{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#C8962A' }" />
                <span :style="{ fontSize: '0.5625rem', color: '#92690B', fontWeight: 500 }">{{ studyDays[calDateStr(day)].problems }}문</span>
              </div>
            </div>
          </template>
        </div>

        <!-- 범례 -->
        <div :style="{ display: 'flex', gap: '1rem', marginTop: '0.875rem', justifyContent: 'center' }">
          <div :style="{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.6875rem', color: '#6B7280' }">
            <div :style="{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#C8962A' }" />
            학습한 날
          </div>
          <div :style="{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.6875rem', color: '#6B7280' }">
            <div :style="{ width: '7px', height: '7px', borderRadius: '2px', border: '1.5px solid #C8962A' }" />
            오늘
          </div>
        </div>

        <!-- 날짜 상세 -->
        <div
          v-if="calSelectedData"
          :style="{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #F3F4F6' }"
        >
          <div :style="{ fontWeight: 700, color: '#C8962A', fontSize: '0.9375rem', marginBottom: '0.75rem' }">{{ calSelectedDate }} 학습 요약</div>
          <div :style="{ display: 'flex', flexDirection: 'column' as CSSProperties['flexDirection'], gap: '0.625rem' }">
            <div
              v-for="row in calDetailRows"
              :key="row.label"
              :style="{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.5rem', borderBottom: '1px solid #F9FAFB' }"
            >
              <span :style="{ fontSize: '0.8125rem', color: '#6B7280' }">{{ row.label }}</span>
              <span :style="{ fontSize: '0.8125rem', fontWeight: 600, color: '#111827' }">{{ row.value }}</span>
            </div>
            <div v-if="calSelectedData.concepts.length">
              <div :style="{ fontSize: '0.8125rem', color: '#6B7280', marginBottom: '0.375rem' }">주요 개념</div>
              <div :style="{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }">
                <span
                  v-for="c in calSelectedData.concepts"
                  :key="c"
                  :style="{ backgroundColor: '#FEF3C7', color: '#92690B', fontSize: '0.6875rem', fontWeight: 500, padding: '0.125rem 0.5rem', borderRadius: '999px' }"
                >{{ c }}</span>
              </div>
            </div>
            <div>
              <div :style="{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: '#6B7280', marginBottom: '0.25rem' }">
                <span>이해도</span>
                <span :style="{ fontWeight: 600, color: calAvgColor }">{{ calSelectedData.avg }}%</span>
              </div>
              <div :style="{ height: '6px', borderRadius: '999px', backgroundColor: '#F3F4F6', overflow: 'hidden' }">
                <div :style="{ width: `${calSelectedData.avg}%`, height: '100%', borderRadius: '999px', backgroundColor: calAvgColor }" />
              </div>
            </div>
          </div>
        </div>
        <div
          v-else
          :style="{ marginTop: '0.875rem', textAlign: 'center' as CSSProperties['textAlign'], color: '#9CA3AF', fontSize: '0.8125rem', paddingTop: '0.5rem' }"
        >
          날짜를 선택하면 학습 요약을 확인할 수 있어요
        </div>
      </div>

      <!-- 3번째 칼럼: 오늘의 복습 추천 -->
      <div>
          <div :style="sectionHeaderStyle">
            <h3 :style="{ color: '#111827' }">오늘의 복습 추천</h3>
            <button @click="router.push({ name: 'weak-concepts' })" :style="sectionLinkStyle">
              전체 보기 <ArrowRight :size="14" />
            </button>
          </div>
          <div :style="listStackStyle">
            <div v-if="recommendations.length === 0" :style="emptyCardStyle">
              저장된 학습 데이터가 없거나 현재 추천할 취약 개념이 없습니다.
            </div>
            <template v-else>
              <div
                v-for="(card, i) in recommendations"
                :key="`${card.subject}-${card.concept}-${i}`"
                :style="listCardStyle"
              >
                <div :style="{ flex: 1 }">
                  <div :style="{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }">
                    <span
                      :style="{
                        backgroundColor: '#FEF3C7',
                        color: '#92690B',
                        fontSize: '0.6875rem',
                        fontWeight: 600,
                        padding: '0.125rem 0.5rem',
                        borderRadius: '999px',
                      }"
                    >복습 추천</span>
                    <span :style="{ fontSize: '0.75rem', color: '#9CA3AF' }">{{ card.subject }}</span>
                  </div>
                  <div :style="{ fontWeight: 600, color: '#111827', fontSize: '1rem', marginBottom: '0.25rem' }">{{ card.concept }}</div>
                  <div :style="{ fontSize: '0.8125rem', color: '#6B7280' }">{{ card.reason }}</div>
                </div>
                <div :style="percentBlockStyle">
                  <div :style="{ ...percentValueStyle, color: card.score < 40 ? '#EF4444' : '#C8962A' }">{{ card.score }}%</div>
                  <div :style="percentLabelStyle">이해도</div>
                </div>
              </div>
            </template>
          </div>
        </div>

        <!-- 최근 학습 세션 -->
        <div>
          <div :style="sectionHeaderStyle">
            <h3 :style="{ color: '#111827' }">최근 학습 세션</h3>
            <button @click="router.push({ name: 'sessions' })" :style="sectionLinkStyle">
              전체 보기 <ArrowRight :size="14" />
            </button>
          </div>
          <div :style="listStackStyle">
            <div v-if="recentSessions.length === 0" :style="emptyCardStyle">최근 학습 세션이 없습니다.</div>
            <template v-else>
              <div
                v-for="s in recentSessions"
                :key="s.id"
                @click="router.push({ name: 'sessions' })"
                :style="{ ...listCardStyle, cursor: 'pointer' }"
              >
                <div :style="{ flex: 1 }">
                  <div :style="{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }">
                    <span
                      :style="{
                        backgroundColor: '#FEF3C7',
                        color: '#92690B',
                        fontSize: '0.6875rem',
                        fontWeight: 600,
                        padding: '0.125rem 0.5rem',
                        borderRadius: '999px',
                      }"
                    >최근 세션</span>
                    <span :style="{ fontSize: '0.75rem', color: '#9CA3AF' }">{{ s.date }}</span>
                  </div>
                  <div :style="{ fontWeight: 600, color: '#111827', fontSize: '1rem', marginBottom: '0.25rem' }">{{ s.book }}</div>
                  <div :style="{ fontSize: '0.8125rem', color: '#6B7280' }">{{ s.problemCount }}문제</div>
                </div>
                <div :style="percentBlockStyle">
                  <div
                    :style="{
                      ...percentValueStyle,
                      color: s.averageUnderstanding >= 75 ? '#10B981' : s.averageUnderstanding >= 60 ? '#C8962A' : '#EF4444',
                    }"
                  >{{ s.averageUnderstanding }}%</div>
                  <div :style="percentLabelStyle">이해도</div>
                </div>
              </div>
            </template>
          </div>
        </div>
    </div>
  </div>
</template>
