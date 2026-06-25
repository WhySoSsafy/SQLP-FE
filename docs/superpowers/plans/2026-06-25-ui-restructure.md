# SQLP-FE UI 개편 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 학습 캘린더를 홈으로 통합하고, 등록 탭을 합치고, 불필요한 탭을 제거하여 사이드바를 정리한다.

**Architecture:** 기존 뷰 파일을 그대로 유지하고 라우터·사이드바·컴포지션만 바꾼다. CalendarView의 로직을 DashboardView에 인라인으로 통합하고, JsonRegistrationView·ConceptImportView를 RegisterView 안에서 조건부 렌더링한다.

**Tech Stack:** Vue 3 Composition API, Vue Router 4, NativeWind-free inline-style 패턴

## Global Constraints

- 파일 삭제 금지 — 기존 view 파일은 삭제하지 않고 라우터에서만 제거한다
- 인라인 스타일 패턴 유지 — 기존 코드베이스와 동일하게 `:style={}` 객체 사용, Tailwind 클래스 사용 안 함
- SQLP-FE 는 git push 하지 않음

---

### Task 1: 라우터 + 사이드바 정리

**Files:**
- Modify: `src/router/index.ts`
- Modify: `src/layouts/DefaultLayout.vue`

**Interfaces:**
- Produces: `register` named route (이후 RegisterView가 이 이름으로 접근됨)

- [ ] **Step 1: `src/router/index.ts` 수정**

아래 내용으로 전체 교체한다. `calendar`, `study-comparison`, `json-register`, `concept-import` 라우트를 제거하고 `register` 라우트를 추가한다.

```typescript
import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/login",
      name: "login",
      component: () => import("@/views/LoginView.vue"),
      meta: { public: true },
    },
    {
      path: "/signup",
      name: "signup",
      component: () => import("@/views/SignupView.vue"),
      meta: { public: true },
    },
    {
      path: "/",
      component: () => import("@/layouts/DefaultLayout.vue"),
      children: [
        { path: "", name: "home", component: () => import("@/views/DashboardView.vue") },
        { path: "register", name: "register", component: () => import("@/views/RegisterView.vue") },
        { path: "sessions", name: "sessions", component: () => import("@/views/SessionListView.vue") },
        { path: "problem-detail", name: "problem-detail", component: () => import("@/views/ProblemDetailView.vue") },
        { path: "weak-concepts", name: "weak-concepts", component: () => import("@/views/WeakConceptsView.vue") },
        { path: "wrong-answers", name: "wrong-answers", component: () => import("@/views/WrongAnswersView.vue") },
        { path: "concepts/:id", name: "concept-summary", component: () => import("@/views/ConceptSummaryView.vue") },
        { path: "reports/growth", name: "growth-report", component: () => import("@/views/GrowthReportView.vue") },
      ],
    },
  ],
});

router.beforeEach((to) => {
  const auth = useAuthStore();
  if (!to.meta.public && !auth.isLoggedIn) return { name: "login" };
  if (to.name === "login" && auth.isLoggedIn) return { name: "home" };
});

export default router;
```

- [ ] **Step 2: `src/layouts/DefaultLayout.vue` `<script setup>` 수정**

import 줄에서 `Calendar`, `Users`, `Lightbulb` 를 제거한다. `NAV_ITEMS`, `PAGE_LABELS` 를 아래로 교체한다.

```typescript
// import 줄 교체 (Calendar, Users, Lightbulb 제거)
import {
  Home, Upload, BookOpen, BarChart2, AlertTriangle, FileText, Database, Bell, ChevronRight, TrendingUp,
} from "lucide-vue-next";

// NAV_ITEMS 교체
const NAV_ITEMS = [
  { name: "home", label: "홈", icon: Home },
  { name: "sessions", label: "학습 세션", icon: BookOpen },
  { name: "problem-detail", label: "문제별 이해도", icon: BarChart2 },
  { name: "weak-concepts", label: "취약 개념", icon: AlertTriangle },
  { name: "wrong-answers", label: "오답노트", icon: FileText },
  { name: "growth-report", label: "성장 리포트", icon: TrendingUp },
  { name: "register", label: "등록", icon: Upload },
];

// PAGE_LABELS 교체
const PAGE_LABELS: Record<string, string> = {
  home: "홈 대시보드",
  register: "JSON / 개념 등록",
  sessions: "학습 세션",
  "problem-detail": "문제별 이해도",
  "weak-concepts": "취약 개념 대시보드",
  "wrong-answers": "오답노트",
  "concept-summary": "개념 요약",
  "growth-report": "성장 리포트",
};
```

- [ ] **Step 3: 브라우저에서 확인**

`npm run dev` 로 실행 후 사이드바에 아래 순서로 7개 탭만 보이는지 확인한다:
홈 / 학습 세션 / 문제별 이해도 / 취약 개념 / 오답노트 / 성장 리포트 / 등록

`/calendar`, `/study-comparison` 로 직접 접근하면 로그인 페이지로 리다이렉트되거나 Not Found 처리됨을 확인한다.

---

### Task 2: 학습 세션 이해도 필터 제거

**Files:**
- Modify: `src/views/SessionListView.vue`

**Interfaces:**
- Consumes: 없음 (독립 태스크)

- [ ] **Step 1: `<script setup>` 에서 필터 관련 코드 제거**

아래 항목을 삭제한다.

```typescript
// 삭제할 줄들:
import { Search, ChevronRight, Filter } from "lucide-vue-next";
// → Filter 제거 (Search, ChevronRight 유지)
import { Search, ChevronRight } from "lucide-vue-next";

// 삭제: underFilter ref
const underFilter = ref<"all" | "high" | "mid" | "low">("all");

// 삭제: filterOptions const
const filterOptions = [
  { key: "all" as const, label: "전체" },
  { key: "high" as const, label: "잘함 (75%↑)" },
  { key: "mid" as const, label: "애매 (60~75%)" },
  { key: "low" as const, label: "취약 (60%↓)" },
] as const;

// 삭제: filterBarStyle, filterGroupStyle (searchWrapStyle, inputStyle 은 유지)
const filterBarStyle: CSSProperties = { ... };
const filterGroupStyle: CSSProperties = { ... };
```

`filtered` computed 를 검색만 남기도록 교체한다:

```typescript
const filtered = computed(() =>
  summaries.value.filter((s) =>
    s.book.toLowerCase().includes(search.value.toLowerCase())
  )
);
```

- [ ] **Step 2: template 에서 필터 UI 제거**

검색 바 div 를 단독 카드로 유지하되 필터 버튼 그룹 전체를 삭제한다. 수정 후 검색 영역:

```html
<div
  :style="{
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: '1rem 1.25rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    marginBottom: '1.25rem',
    display: 'flex',
    alignItems: 'center',
  }"
>
  <div :style="{ position: 'relative', flex: '1', minWidth: '200px' }">
    <Search :size="16" color="#9CA3AF" :style="{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }" />
    <input
      v-model="search"
      placeholder="문제집명 검색..."
      :style="{
        width: '100%',
        padding: '0.5625rem 0.75rem 0.5625rem 2.25rem',
        border: '1px solid #E5E7EB',
        borderRadius: '8px',
        fontSize: '0.875rem',
        outline: 'none',
        boxSizing: 'border-box',
      }"
    />
  </div>
</div>
```

- [ ] **Step 3: 브라우저에서 확인**

학습 세션 탭에서 검색 바만 보이고 필터 버튼이 없는지 확인한다.

---

### Task 3: 통합 등록 뷰 (RegisterView.vue) 신규 생성

**Files:**
- Create: `src/views/RegisterView.vue`

**Interfaces:**
- Consumes: `JsonRegistrationView.vue`, `ConceptImportView.vue` (as sub-components)
- Produces: `register` named route에서 렌더링되는 뷰

- [ ] **Step 1: `src/views/RegisterView.vue` 파일 생성**

```vue
<script setup lang="ts">
import { ref } from "vue";
import JsonRegistrationView from "./JsonRegistrationView.vue";
import ConceptImportView from "./ConceptImportView.vue";

type RegisterType = "problem" | "concept";
const activeType = ref<RegisterType>("problem");
</script>

<template>
  <div :style="{ maxWidth: '860px' }">
    <!-- 타입 토글 -->
    <div :style="{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }">
      <button
        @click="activeType = 'problem'"
        :style="{
          padding: '0.625rem 1.25rem',
          borderRadius: '8px',
          border: activeType === 'problem' ? '1.5px solid #C8962A' : '1px solid #E5E7EB',
          backgroundColor: activeType === 'problem' ? '#FEF8EC' : '#FFFFFF',
          color: activeType === 'problem' ? '#C8962A' : '#6B7280',
          fontWeight: activeType === 'problem' ? 600 : 400,
          fontSize: '0.875rem',
          cursor: 'pointer',
        }"
      >
        📄 문제 JSON 등록
      </button>
      <button
        @click="activeType = 'concept'"
        :style="{
          padding: '0.625rem 1.25rem',
          borderRadius: '8px',
          border: activeType === 'concept' ? '1.5px solid #C8962A' : '1px solid #E5E7EB',
          backgroundColor: activeType === 'concept' ? '#FEF8EC' : '#FFFFFF',
          color: activeType === 'concept' ? '#C8962A' : '#6B7280',
          fontWeight: activeType === 'concept' ? 600 : 400,
          fontSize: '0.875rem',
          cursor: 'pointer',
        }"
      >
        💡 개념 JSON 등록
      </button>
    </div>

    <!-- 콘텐츠 -->
    <JsonRegistrationView v-if="activeType === 'problem'" />
    <ConceptImportView v-else />
  </div>
</template>
```

- [ ] **Step 2: 브라우저에서 확인**

사이드바 하단 "등록" 탭 클릭 → 두 버튼("문제 JSON 등록" / "개념 JSON 등록") 보임 확인.
버튼 전환 시 콘텐츠 전환 확인.
각각의 기능(파일 업로드, 붙여넣기, 검증, 등록)이 정상 동작하는지 확인.

---

### Task 4: 홈 대시보드 캘린더 통합

**Files:**
- Modify: `src/views/DashboardView.vue`

**Interfaces:**
- Consumes: `fetchCalendar` from `@/api`, `CalendarDayEntry`, `CalendarMonthSummary` from `@/domain/types`

- [ ] **Step 1: `<script setup>` 상단 import 교체**

```typescript
import { computed, onMounted, ref, watch } from "vue";
import type { CSSProperties } from "vue";
import { useRouter } from "vue-router";
import { BookOpen, AlertCircle, TrendingUp, Flame, ArrowRight, ChevronLeft, ChevronRight } from "lucide-vue-next";
import { buildDashboardSummary, buildReviewRecommendations, summarizeSessions } from "@/domain/analytics";
import { fetchCalendar } from "@/api";
import type { DashboardSummary, ReviewRecommendation, SessionSummary, CalendarDayEntry, CalendarMonthSummary } from "@/domain/types";
```

- [ ] **Step 2: 기존 dashboard state 아래에 캘린더 state 추가**

기존 `onMounted` 블록 다음에 아래 블록을 삽입한다:

```typescript
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
  if (calMonth.value === 1) { calYear.value -= 1; calMonth.value = 12; }
  else calMonth.value -= 1;
};
const nextMonth = () => {
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
```

- [ ] **Step 3: `<template>` 바닥 섹션 교체**

기존 `<!-- Bottom: Review + Recent -->` div 전체를 아래로 교체한다:

```html
<!-- Bottom: Calendar (왼쪽) + Review/Sessions (오른쪽) -->
<div
  :style="{
    display: 'grid',
    gridTemplateColumns: '1fr 380px',
    gap: '1.5rem',
    alignItems: 'start',
  }"
>
  <!-- 왼쪽: 학습 캘린더 -->
  <div
    :style="{
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

    <!-- 날짜 상세 (날짜 선택 시) -->
    <div
      v-if="calSelectedData"
      :style="{
        marginTop: '1rem',
        paddingTop: '1rem',
        borderTop: '1px solid #F3F4F6',
      }"
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
        <!-- 주요 개념 -->
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
        <!-- 이해도 바 -->
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

  <!-- 오른쪽: 복습 추천 + 최근 세션 -->
  <div :style="{ display: 'flex', flexDirection: 'column' as CSSProperties['flexDirection'], gap: '1.5rem' }">
    <!-- 오늘의 복습 추천 -->
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
                >
                  복습 추천
                </span>
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
                >
                  최근 세션
                </span>
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
              >
                {{ s.averageUnderstanding }}%
              </div>
              <div :style="percentLabelStyle">이해도</div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</div>
```

- [ ] **Step 4: 브라우저에서 확인**

홈 탭에서:
- 상단 요약 카드 4개 유지 확인
- 아래 2열 레이아웃: 왼쪽 캘린더(월 이동, 날짜 클릭 시 상세), 오른쪽 복습 추천 + 최근 세션 스택 확인
- 날짜 클릭 시 캘린더 아래에 해당 날짜 학습 요약 표시 확인
