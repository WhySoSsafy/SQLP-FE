# 2차 피드백 배치 3B (레이아웃/시각화) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** 홈 캘린더에 참여자별 이해도 추가, 학습 세션 50/50 + 차트 2개, 취약 개념 5열 레이아웃.

**Architecture:** 기존 `vue-echarts` 활용(새 의존성 없음). 인라인 `:style={}` 패턴. 검증은 `npx tsc --noEmit`(신규 에러 없음) + 육안.

**Tech Stack:** Vue 3 Composition API, vue-echarts

## Global Constraints

- SQLP-FE는 git push 하지 않음
- 인라인 `:style={}` 유지, Tailwind/새 의존성 없음
- BE 변경 없음

---

### Task B1: 홈 캘린더 참여자별 이해도 (DashboardView)

**Files:**
- Modify: `src/views/DashboardView.vue`

**Interfaces:**
- Consumes: `useSessionsStore`(sessions: id+session_date), `fetchSessionDetail(id)`(problems+participants), 기존 `calSelectedDate` ref.
- 환산: 잘함=100 / 애매=50 / 모름=0 평균.

- [ ] **Step 1: import 추가**

`fetchCalendar` import 줄을 찾아 같은 블록에 `fetchSessionDetail`을 추가하고, 세션 스토어를 import 한다.
old:
```typescript
import { fetchCalendar } from "@/api";
```
new:
```typescript
import { fetchCalendar, fetchSessionDetail } from "@/api";
import { useSessionsStore } from "@/stores/sessions";
```

- [ ] **Step 2: 세션 스토어 + 참여자별 상태 + 로더 추가**

캘린더 state 블록의 `const calSelectedData = computed(...)` 정의 바로 위(또는 아래)에 추가한다. `calSelectedDate` ref가 이미 선언된 이후 위치여야 한다. 아래 블록을 `const calSelectedData = computed(` 정의 **바로 앞**에 삽입한다.
old:
```typescript
const calSelectedData = computed(() =>
  calSelectedDate.value ? studyDays.value[calSelectedDate.value] ?? null : null,
);
```
new:
```typescript
const sessionsStore = useSessionsStore();
const calParticipants = ref<{ name: string; pct: number }[]>([]);

// 선택한 날짜의 세션 상세를 조회해 참여자별 평균 이해도(%)를 계산한다.
async function loadDayParticipants(date: string) {
  calParticipants.value = [];
  const session = sessionsStore.sessions.find((s) => s.session_date === date);
  if (!session) return;
  try {
    const detail = await fetchSessionDetail(session.id);
    const scoreMap: Record<string, { sum: number; n: number }> = {};
    for (const p of detail.problems ?? []) {
      for (const pt of p.participants ?? []) {
        const v = pt.understanding === "잘함" ? 100 : pt.understanding === "애매" ? 50 : 0;
        if (!scoreMap[pt.name]) scoreMap[pt.name] = { sum: 0, n: 0 };
        scoreMap[pt.name].sum += v;
        scoreMap[pt.name].n += 1;
      }
    }
    calParticipants.value = Object.entries(scoreMap).map(([name, s]) => ({
      name,
      pct: s.n ? Math.round(s.sum / s.n) : 0,
    }));
  } catch {
    calParticipants.value = [];
  }
}

watch(calSelectedDate, (d) => {
  calParticipants.value = [];
  if (d) loadDayParticipants(d);
});

const calSelectedData = computed(() =>
  calSelectedDate.value ? studyDays.value[calSelectedDate.value] ?? null : null,
);
```

- [ ] **Step 3: 날짜 상세에 참여자별 막대 추가**

날짜 상세의 "이해도" 바 블록 다음, 상세 컨테이너가 닫히기 전에 참여자별 섹션을 추가한다.
old:
```html
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
```
new:
```html
            <div>
              <div :style="{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: '#6B7280', marginBottom: '0.25rem' }">
                <span>이해도</span>
                <span :style="{ fontWeight: 600, color: calAvgColor }">{{ calSelectedData.avg }}%</span>
              </div>
              <div :style="{ height: '6px', borderRadius: '999px', backgroundColor: '#F3F4F6', overflow: 'hidden' }">
                <div :style="{ width: `${calSelectedData.avg}%`, height: '100%', borderRadius: '999px', backgroundColor: calAvgColor }" />
              </div>
            </div>

            <!-- 참여자별 이해도 (세션 상세 기반) -->
            <div v-if="calParticipants.length">
              <div :style="{ fontSize: '0.8125rem', color: '#6B7280', margin: '0.25rem 0 0.375rem' }">참여자별 이해도</div>
              <div
                v-for="pp in calParticipants"
                :key="pp.name"
                :style="{ marginBottom: '0.5rem' }"
              >
                <div :style="{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#374151', marginBottom: '0.1875rem' }">
                  <span>{{ pp.name }}</span>
                  <span :style="{ fontWeight: 600, color: pp.pct >= 75 ? '#10B981' : pp.pct >= 60 ? '#C8962A' : '#EF4444' }">{{ pp.pct }}%</span>
                </div>
                <div :style="{ height: '6px', borderRadius: '999px', backgroundColor: '#F3F4F6', overflow: 'hidden' }">
                  <div :style="{ width: `${pp.pct}%`, height: '100%', borderRadius: '999px', backgroundColor: pp.pct >= 75 ? '#10B981' : pp.pct >= 60 ? '#C8962A' : '#EF4444' }" />
                </div>
              </div>
            </div>
          </div>
        </div>
```

- [ ] **Step 4: 타입 체크 + 커밋**

```bash
cd "C:/Users/SSAFY/Desktop/SQLP/SQLP-FE"
npx tsc --noEmit 2>&1 | head -20
git add src/views/DashboardView.vue
git commit -m "feat: 홈 캘린더 날짜 상세에 참여자별 이해도 막대 추가 (세션 상세 조회)"
```
Expected: 신규 에러 없음.

브라우저 확인: 학습한 날짜 클릭 → 기존 지표 아래에 세은/수철 각자 이해도 막대 표시. 세션 없는 날짜는 참여자 섹션 생략.

---

### Task B2: 학습 세션 50/50 + 차트 2개 (SessionListView)

**Files:**
- Modify: `src/views/SessionListView.vue`

**Interfaces:**
- Consumes: 기존 `trendSeriesData` computed.
- Produces: `reviewOption` computed (복습 필요 영역 차트).

- [ ] **Step 1: chartPanelStyle에서 sticky 제거 (스택용)**

두 차트를 세로 스택할 것이므로 개별 패널의 sticky를 제거한다(겹침 방지). 스택 래퍼가 sticky를 담당한다.
old:
```typescript
const chartPanelStyle: CSSProperties = {
  backgroundColor: "#FFFFFF",
  borderRadius: "12px",
  padding: "1.5rem",
  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  position: "sticky",
  top: "1.75rem",
};
```
new:
```typescript
const chartPanelStyle: CSSProperties = {
  backgroundColor: "#FFFFFF",
  borderRadius: "12px",
  padding: "1.5rem",
  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
};
```

- [ ] **Step 2: trendOption을 라인 전용으로 + reviewOption 추가**

`trendOption` computed 전체(복습 바 포함)를 라인 전용으로 교체하고, 바로 아래에 `reviewOption`을 추가한다.
old:
```typescript
const trendOption = computed(() => {
  const data = trendSeriesData.value;
  return {
    grid: { top: 32, right: 16, left: 8, bottom: 24, containLabel: true },
    tooltip: { trigger: "axis" },
    legend: { top: 0, textStyle: { fontSize: 12 } },
    xAxis: {
      type: "category",
      data: data.map((s) => s.date.slice(5)),
      axisLabel: { fontSize: 11, color: "#6B7280" },
    },
    yAxis: [
      {
        type: "value",
        min: 0,
        max: 100,
        axisLabel: { fontSize: 11, color: "#6B7280", formatter: "{value}%" },
        splitLine: { lineStyle: { type: "dashed", color: "#F3F4F6" } },
      },
      {
        type: "value",
        min: 0,
        axisLabel: { fontSize: 11, color: "#9CA3AF" },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: "평균 이해도",
        type: "line",
        smooth: true,
        data: data.map((s) => s.averageUnderstanding),
        itemStyle: { color: "#C8962A" },
        lineStyle: { color: "#C8962A", width: 2 },
        areaStyle: { color: "rgba(200,150,42,0.08)" },
      },
      {
        name: "복습 필요",
        type: "bar",
        yAxisIndex: 1,
        data: data.map((s) => s.reviewRequiredCount),
        itemStyle: { color: "#FCD9A5", borderRadius: [4, 4, 0, 0] },
        barWidth: "40%",
      },
    ],
  };
});
```
new:
```typescript
const trendOption = computed(() => {
  const data = trendSeriesData.value;
  return {
    grid: { top: 16, right: 16, left: 8, bottom: 24, containLabel: true },
    tooltip: { trigger: "axis", valueFormatter: (v: number) => `${v}%` },
    xAxis: {
      type: "category",
      data: data.map((s) => s.date.slice(5)),
      axisLabel: { fontSize: 11, color: "#6B7280" },
    },
    yAxis: {
      type: "value",
      min: 0,
      max: 100,
      axisLabel: { fontSize: 11, color: "#6B7280", formatter: "{value}%" },
      splitLine: { lineStyle: { type: "dashed", color: "#F3F4F6" } },
    },
    series: [
      {
        name: "평균 이해도",
        type: "line",
        smooth: true,
        data: data.map((s) => s.averageUnderstanding),
        itemStyle: { color: "#C8962A" },
        lineStyle: { color: "#C8962A", width: 2 },
        areaStyle: { color: "rgba(200,150,42,0.08)" },
      },
    ],
  };
});

const reviewOption = computed(() => {
  const data = trendSeriesData.value;
  return {
    grid: { top: 16, right: 16, left: 8, bottom: 24, containLabel: true },
    tooltip: { trigger: "axis" },
    xAxis: {
      type: "category",
      data: data.map((s) => s.date.slice(5)),
      axisLabel: { fontSize: 11, color: "#6B7280" },
    },
    yAxis: {
      type: "value",
      min: 0,
      axisLabel: { fontSize: 11, color: "#9CA3AF" },
      splitLine: { lineStyle: { type: "dashed", color: "#F3F4F6" } },
    },
    series: [
      {
        name: "복습 필요",
        type: "line",
        smooth: true,
        data: data.map((s) => s.reviewRequiredCount),
        itemStyle: { color: "#EF4444" },
        lineStyle: { color: "#EF4444", width: 2 },
        areaStyle: { color: "rgba(239,68,68,0.10)" },
      },
    ],
  };
});
```

- [ ] **Step 3: 그리드 50/50로 변경**

old:
```html
    <div :style="{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1.5rem', alignItems: 'start' }">
```
new:
```html
    <div :style="{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }">
```

- [ ] **Step 4: 우측을 차트 2개 스택으로 교체**

old:
```html
      <!-- 오른쪽: 세션별 이해도 추이 -->
      <div :style="chartPanelStyle">
        <h3 :style="{ color: '#111827', marginBottom: '1.25rem' }">세션별 이해도 추이</h3>
        <VChart
          v-if="trendSeriesData.length"
          :option="trendOption"
          :style="{ height: '300px', width: '100%' }"
          autoresize
        />
        <div v-else :style="{ color: '#6B7280', fontSize: '0.875rem' }">
          표시할 세션이 없습니다.
        </div>
      </div>
    </div>
  </div>
</template>
```
new:
```html
      <!-- 오른쪽: 차트 2개 (이해도 추이 + 복습 필요 추이) -->
      <div :style="{ display: 'flex', flexDirection: 'column' as CSSProperties['flexDirection'], gap: '1.5rem', position: 'sticky', top: '1.75rem' }">
        <div :style="chartPanelStyle">
          <h3 :style="{ color: '#111827', marginBottom: '1.25rem' }">세션별 이해도 추이</h3>
          <VChart
            v-if="trendSeriesData.length"
            :option="trendOption"
            :style="{ height: '260px', width: '100%' }"
            autoresize
          />
          <div v-else :style="{ color: '#6B7280', fontSize: '0.875rem' }">
            표시할 세션이 없습니다.
          </div>
        </div>
        <div :style="chartPanelStyle">
          <h3 :style="{ color: '#111827', marginBottom: '1.25rem' }">복습 필요 추이</h3>
          <VChart
            v-if="trendSeriesData.length"
            :option="reviewOption"
            :style="{ height: '260px', width: '100%' }"
            autoresize
          />
          <div v-else :style="{ color: '#6B7280', fontSize: '0.875rem' }">
            표시할 세션이 없습니다.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 5: 타입 체크 + 커밋**

```bash
cd "C:/Users/SSAFY/Desktop/SQLP/SQLP-FE"
npx tsc --noEmit 2>&1 | head -20
git add src/views/SessionListView.vue
git commit -m "feat: 학습 세션 50/50 레이아웃 + 우측 이해도 추이(라인)·복습 필요 추이(영역) 차트 2개"
```
Expected: 신규 에러 없음.

브라우저 확인: 좌 목록 절반 / 우 차트 2개(이해도 라인, 복습 필요 영역) 세로 스택.

---

### Task B3: 취약 개념 5열 레이아웃 (WeakConceptsView)

**Files:**
- Modify: `src/views/WeakConceptsView.vue`

**Interfaces:**
- Consumes: 기존 `concepts` ref(`WeakConcept[]`), `participantNames` computed, `chartOption` computed.
- Produces: `participantWeakList(name)` 함수.

- [ ] **Step 1: 참여자별 취약 개념 리스트 헬퍼 추가**

`chartOption` computed 정의 바로 위에 헬퍼를 추가한다. (`const chartOption = computed(...)` 줄 앞에 삽입)
old:
```typescript
// series = one bar per participant (+ 평균 when filter is 'all'):
// when activeFilter !== "all", only the matching participant is shown (no 평균)
const chartOption = computed(() => {
```
new:
```typescript
// 참여자별 취약 개념 리스트: 그 참여자의 이해도(scoreByParticipant) 낮은 순.
function participantWeakList(name: string) {
  return [...concepts.value]
    .map((c) => ({
      name: c.name,
      score: c.scoreByParticipant[name] ?? 0,
      weak: c.weakCountByParticipant[name] ?? 0,
      recommend: c.recommend,
    }))
    .sort((a, b) => a.score - b.score);
}

// 차트/참여자 칼럼에 쓸 상위 2명 (보통 세은·수철).
const topParticipants = computed(() => participantNames.value.slice(0, 2));

// series = one bar per participant (+ 평균 when filter is 'all'):
// when activeFilter !== "all", only the matching participant is shown (no 평균)
const chartOption = computed(() => {
```

- [ ] **Step 2: 하단 그리드를 5열로 + 참여자별 복습 추천 칼럼**

하단 `<!-- Chart + Sidebar -->` 그리드 전체를 5열 레이아웃으로 교체한다.
old:
```html
      <!-- Chart + Sidebar -->
      <div
        :style="{
          display: 'grid',
          gridTemplateColumns: '1fr 300px',
          gap: '1.5rem',
        }"
      >
        <!-- Bar Chart -->
        <div
          :style="{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            padding: '1.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }"
        >
          <h3 :style="{ color: '#111827', marginBottom: '1.25rem' }">개념별 이해도 비교</h3>
          <VChart :option="chartOption" :style="{ height: '280px', width: '100%' }" autoresize />
        </div>

        <!-- Review List -->
        <div
          :style="{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            padding: '1.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }"
        >
          <h3 :style="{ color: '#111827', marginBottom: '1.125rem' }">개념별 복습 추천</h3>
          <div
            :style="{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }"
          >
            <div
              v-for="c in concepts"
              :key="c.name"
              :style="{
                borderRadius: '8px',
                padding: '0.75rem',
                backgroundColor: c.recommend ? '#FEF8EC' : '#F9FAFB',
                border: c.recommend ? '1px solid #FDE68A' : '1px solid #F3F4F6',
              }"
            >
              <div
                :style="{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.375rem',
                }"
              >
                <span
                  :style="{ fontWeight: 600, fontSize: '0.875rem', color: '#111827' }"
                >{{ c.name }}</span>
                <span
                  v-if="c.recommend"
                  :style="{
                    backgroundColor: '#FEF3C7',
                    color: '#92690B',
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    padding: '0.125rem 0.5rem',
                    borderRadius: '999px',
                  }"
                >추천</span>
              </div>
              <div
                :style="{
                  fontSize: '0.75rem',
                  color: '#6B7280',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.125rem',
                } as CSSProperties"
              >
                <span>전체 {{ c.totalProblems }}문제 · 취약 {{ weakItems(c) }}문제</span>
                <span
                  :style="{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                  } as CSSProperties"
                >
                  <RefreshCw :size="10" /> 최근 복습: {{ c.lastReviewDate }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
```
new:
```html
      <!-- Chart(1~3열) + 참여자별 복습 추천(4·5열) -->
      <div
        :style="{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '1.5rem',
          alignItems: 'start',
        }"
      >
        <!-- Bar Chart: 1~3열 -->
        <div
          :style="{
            gridColumn: 'span 3',
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            padding: '1.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }"
        >
          <h3 :style="{ color: '#111827', marginBottom: '1.25rem' }">개념별 이해도 비교</h3>
          <VChart :option="chartOption" :style="{ height: '280px', width: '100%' }" autoresize />
        </div>

        <!-- 참여자별 복습 추천: 각 1열 -->
        <div
          v-for="person in topParticipants"
          :key="person"
          :style="{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            padding: '1.25rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }"
        >
          <h3 :style="{ color: '#111827', marginBottom: '1rem', fontSize: '0.9375rem' }">{{ person }} 복습 추천</h3>
          <div :style="{ display: 'flex', flexDirection: 'column' as CSSProperties['flexDirection'], gap: '0.625rem' }">
            <div
              v-for="c in participantWeakList(person)"
              :key="`${person}-${c.name}`"
              :style="{
                borderRadius: '8px',
                padding: '0.625rem 0.75rem',
                backgroundColor: c.recommend ? '#FEF8EC' : '#F9FAFB',
                border: c.recommend ? '1px solid #FDE68A' : '1px solid #F3F4F6',
              }"
            >
              <div :style="{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }">
                <span :style="{ fontWeight: 600, fontSize: '0.8125rem', color: '#111827' }">{{ c.name }}</span>
                <span :style="{ fontSize: '0.8125rem', fontWeight: 700, color: c.score < 40 ? '#EF4444' : c.score < 60 ? '#C8962A' : '#10B981' }">{{ c.score }}%</span>
              </div>
              <div :style="{ fontSize: '0.6875rem', color: '#9CA3AF', marginTop: '0.1875rem' }">취약 {{ c.weak }}문제</div>
            </div>
          </div>
        </div>
      </div>
```

- [ ] **Step 3: 타입 체크 + 커밋**

```bash
cd "C:/Users/SSAFY/Desktop/SQLP/SQLP-FE"
npx tsc --noEmit 2>&1 | head -20
git add src/views/WeakConceptsView.vue
git commit -m "feat: 취약 개념 5열 레이아웃 (이해도 차트 3열 + 세은·수철 복습 추천 각 1열)"
```
Expected: 신규 에러 없음. (`weakItems` 함수는 더 이상 새 마크업에서 안 쓰일 수 있으나 차트 옵션 등 다른 곳에서 쓰이면 유지. 미사용 경고가 나면 그 함수는 제거하지 말고 그대로 둔다 — 기존 코드.)

브라우저 확인: 차트가 TOP5 카드 1~3열 폭에 정렬, 4·5열에 세은/수철 복습 추천 리스트.

---

## Self-Review

**1. Spec coverage:** B1 홈 캘린더 참여자별(세션 상세 조회), B2 세션 50/50+차트2개(라인+영역), B3 취약개념 5열(차트 span3 + 참여자 2열) — 모두 커버.

**2. Placeholder scan:** 모든 스텝 실제 old/new 코드.

**3. Type consistency:**
- B1: `useSessionsStore`/`fetchSessionDetail` 신규 import. `calParticipants` ref + `loadDayParticipants` + `watch(calSelectedDate)`. understanding 비교는 표준값 "잘함/애매/모름"(domain Understanding) 사용. `watch`는 이미 DashboardView에서 import됨(배치1에서 추가).
- B2: `trendOption` 라인 전용으로 단일 yAxis, `reviewOption` 신규. `chartPanelStyle` sticky 제거→래퍼 sticky. `VChart`는 이미 등록(LineChart 포함)되어 영역 차트(line+areaStyle) 추가 등록 불필요.
- B3: `participantWeakList`/`topParticipants` 신규. `participantNames`/`concepts`/`weakItems`/`chartOption` 기존 유지. `RefreshCw` import는 기존 리뷰 리스트 제거로 미사용될 수 있음 — 미사용 시 import에서 제거(아래 주의).

**주의(B3):** 기존 "개념별 복습 추천" 리스트가 제거되며 `RefreshCw` 아이콘과 `weakItems(c)` 함수 사용처가 사라진다. 새 마크업은 `c.weak`/`c.score`(participantWeakList)를 쓴다. 교체 후:
- `grep -n "RefreshCw" src/views/WeakConceptsView.vue` 결과 import 줄에만 남으면 lucide import에서 `RefreshCw` 제거.
- `grep -n "weakItems" src/views/WeakConceptsView.vue` 결과 정의부에만 남으면 `weakItems` 함수 정의 제거.
- `weakScore`는 TOP5 카드에서 계속 쓰이므로 **유지**.
미사용 심볼이 tsc 에러(noUnusedLocals)를 유발할 수 있으니 반드시 정리한다.

추가 Step (B3 Step 2와 Step 3 사이): 위 grep 2건 수행 후 미사용으로 확인되면 해당 import/함수 제거하고 같은 커밋에 포함한다.
