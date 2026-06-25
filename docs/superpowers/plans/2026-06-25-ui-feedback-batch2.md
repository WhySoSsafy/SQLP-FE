# UI 피드백 배치 2 (그래프) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 학습 세션 페이지 우측에 이해도 추이 차트를, 문제별 이해도 페이지 우측 빈 공간에 Force-Directed Graph(문제↔개념 관계도)를 추가한다.

**Architecture:** 이미 설치된 `vue-echarts` + `echarts/core` 트리셰이킹 import를 사용한다(새 의존성 없음). `WeakConceptsView`가 같은 패턴으로 `BarChart`를 쓰고 있어 이를 참조한다.

**Tech Stack:** Vue 3 Composition API, vue-echarts, echarts (CanvasRenderer + LineChart/BarChart/GraphChart), 인라인 `:style={}`

## Global Constraints

- SQLP-FE는 git push 하지 않음 (로컬 전용)
- 인라인 `:style={}` 패턴 유지, Tailwind 미사용
- 새 npm 의존성 추가 없음 (echarts/vue-echarts는 이미 설치됨)
- BE 변경 없음
- ECharts 등록은 각 뷰에서 `use([...])`로 트리셰이킹 모듈만 등록 (WeakConceptsView와 동일 패턴)

---

### Task 1: 학습 세션 우측 이해도 추이 차트

**Files:**
- Modify: `src/views/SessionListView.vue`

**Interfaces:**
- Consumes: `summaries` ref(`SessionSummary[]`), `filtered` computed (이미 존재)
- Produces: 없음

`SessionSummary` 필드: `id, date, book, problemCount, speakers, averageUnderstanding, reviewRequiredCount`.

- [ ] **Step 1: ECharts import 추가**

`src/views/SessionListView.vue`의 import 블록 상단을 교체한다.
old:
```typescript
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { Search, ChevronRight } from "lucide-vue-next";
import type { CSSProperties } from "vue";
import { useSessionsStore } from "@/stores/sessions";
import { summarizeSessions } from "@/domain/analytics";
import type { SessionSummary } from "@/domain/types";
```
new:
```typescript
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { Search, ChevronRight } from "lucide-vue-next";
import type { CSSProperties } from "vue";
import VChart from "vue-echarts";
import { use } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { LineChart, BarChart } from "echarts/charts";
import { GridComponent, TooltipComponent, LegendComponent } from "echarts/components";
import { useSessionsStore } from "@/stores/sessions";
import { summarizeSessions } from "@/domain/analytics";
import type { SessionSummary } from "@/domain/types";

use([CanvasRenderer, LineChart, BarChart, GridComponent, TooltipComponent, LegendComponent]);
```

- [ ] **Step 2: 차트 패널 스타일 + 추이 데이터 + 옵션 추가**

`const outerStyle: CSSProperties = { width: "100%" };` 바로 아래에 추가한다.
old:
```typescript
const outerStyle: CSSProperties = { width: "100%" };
```
new:
```typescript
const outerStyle: CSSProperties = { width: "100%" };

const chartPanelStyle: CSSProperties = {
  backgroundColor: "#FFFFFF",
  borderRadius: "12px",
  padding: "1.5rem",
  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  position: "sticky",
  top: "1.75rem",
};

// 추이 차트는 날짜 오름차순으로 그린다. (검색 필터를 그대로 반영)
const trendSeriesData = computed(() =>
  [...filtered.value].sort((a, b) => a.date.localeCompare(b.date)),
);

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

- [ ] **Step 3: 템플릿을 2열로 감싸기 (열기)**

에러 div 블록과 Search 사이에 그리드+왼쪽 컬럼 열기를 삽입한다.
old:
```html
      {{ error }}
    </div>

    <!-- Search -->
```
new:
```html
      {{ error }}
    </div>

    <!-- 2열: 세션 목록(좌) + 이해도 추이(우) -->
    <div :style="{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1.5rem', alignItems: 'start' }">
      <!-- 왼쪽: 세션 목록 -->
      <div :style="{ minWidth: 0 }">
        <!-- Search -->
```

- [ ] **Step 4: 템플릿 왼쪽 컬럼 닫기 + 우측 차트 패널 추가**

목록 끝에서 왼쪽 컬럼을 닫고 오른쪽 차트 패널을 추가한 뒤 그리드를 닫는다.
old:
```html
        <ChevronRight :size="18" color="#D1D5DB" />
      </div>
    </div>
  </div>
</template>
```
new:
```html
        <ChevronRight :size="18" color="#D1D5DB" />
      </div>
    </div>
      </div>

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

- [ ] **Step 5: 타입 체크**

Run: `cd "C:/Users/SSAFY/Desktop/SQLP/SQLP-FE" && npx tsc --noEmit 2>&1 | head -30`
Expected: 신규 에러 없음 (기존 `.vue` 모듈 선언 에러는 무시). ECharts 옵션 객체는 `computed`로 타입 추론되며 별도 캐스팅 불필요.

- [ ] **Step 6: 브라우저 확인**

학습 세션 탭에서:
- 좌측에 기존 세션 목록, 우측에 sticky 추이 차트 표시
- 차트: 라인(평균 이해도, x=날짜 오름차순) + 바(복습 필요 수)
- 검색어 입력 시 차트도 필터 반영
- 세션 0건일 때 "표시할 세션이 없습니다." 표시

- [ ] **Step 7: 커밋**

```bash
cd "C:/Users/SSAFY/Desktop/SQLP/SQLP-FE"
git add src/views/SessionListView.vue
git commit -m "feat: 학습 세션 페이지 우측에 세션별 이해도 추이 차트 추가"
```

---

### Task 2: 문제별 이해도 Force-Directed Graph

**Files:**
- Modify: `src/views/ProblemDetailView.vue`

**Interfaces:**
- Consumes: `session` computed(`LearningSession | undefined`, `.problems` 포함), `selected` ref(`ProblemAnalysis | null`)
- Produces: 없음

`ProblemAnalysis` 필드: `id, problem_number, subject_area, concepts(string[]), solution_summary, participants[]`.

- [ ] **Step 1: ECharts import 추가**

`src/views/ProblemDetailView.vue` import 블록을 교체한다.
old:
```typescript
import { ref, computed, watch, onMounted } from "vue";
import { X } from "lucide-vue-next";
import type { CSSProperties } from "vue";
import type { LearningSession, ProblemAnalysis, Understanding } from "@/domain/types";
import { getSelectedOrNewestSession } from "@/domain/storage";
import { useSessionsStore } from "@/stores/sessions";
import { fetchSessionDetail } from "@/api";
```
new:
```typescript
import { ref, computed, watch, onMounted } from "vue";
import { X } from "lucide-vue-next";
import type { CSSProperties } from "vue";
import VChart from "vue-echarts";
import { use } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { GraphChart } from "echarts/charts";
import { TooltipComponent, LegendComponent } from "echarts/components";
import type { LearningSession, ProblemAnalysis, Understanding } from "@/domain/types";
import { getSelectedOrNewestSession } from "@/domain/storage";
import { useSessionsStore } from "@/stores/sessions";
import { fetchSessionDetail } from "@/api";

use([CanvasRenderer, GraphChart, TooltipComponent, LegendComponent]);
```

- [ ] **Step 2: 그래프 패널 스타일 + 옵션 + 클릭 핸들러 추가**

`sectionLabelStyle` const 정의 바로 아래(`</script>` 직전)에 추가한다.
old:
```typescript
const sectionLabelStyle: CSSProperties = {
  fontSize: "0.75rem",
  fontWeight: 600,
  color: "#9CA3AF",
  textTransform: "uppercase",
  marginBottom: "0.375rem",
};
</script>
```
new:
```typescript
const sectionLabelStyle: CSSProperties = {
  fontSize: "0.75rem",
  fontWeight: 600,
  color: "#9CA3AF",
  textTransform: "uppercase",
  marginBottom: "0.375rem",
};

const graphPanelStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
  backgroundColor: "#FFFFFF",
  borderRadius: "12px",
  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  padding: "1.25rem",
  position: "sticky",
  top: "1.75rem",
  maxHeight: "calc(100vh - 120px)",
};

// 문제 노드 ↔ 개념 노드를 연결한 Force-Directed Graph.
// 노드끼리 반발(repulsion), 연결된 노드는 인력(edgeLength)으로 자연스러운 군집을 만든다.
const graphOption = computed(() => {
  const problems = session.value?.problems ?? [];
  const nodes: Record<string, unknown>[] = [];
  const links: Record<string, unknown>[] = [];
  const conceptSeen = new Set<string>();

  for (const p of problems) {
    const pid = `p:${p.problem_number}`;
    nodes.push({ id: pid, name: `${p.problem_number}번`, category: 0, symbolSize: 34 });
    for (const c of p.concepts) {
      const cid = `c:${c}`;
      if (!conceptSeen.has(cid)) {
        conceptSeen.add(cid);
        nodes.push({ id: cid, name: c, category: 1, symbolSize: 20 });
      }
      links.push({ source: pid, target: cid });
    }
  }

  return {
    tooltip: {
      formatter: (params: { dataType?: string; data?: { name?: string } }) =>
        params.dataType === "node" ? String(params.data?.name ?? "") : "",
    },
    legend: [{ data: ["문제", "개념"], top: 0, textStyle: { fontSize: 12 } }],
    series: [
      {
        type: "graph",
        layout: "force",
        roam: true,
        draggable: true,
        label: { show: true, position: "right", fontSize: 11, color: "#374151" },
        force: { repulsion: 110, edgeLength: 70, gravity: 0.08 },
        categories: [
          { name: "문제", itemStyle: { color: "#C8962A" } },
          { name: "개념", itemStyle: { color: "#60A5FA" } },
        ],
        lineStyle: { color: "#D1D5DB", width: 1, curveness: 0 },
        emphasis: { focus: "adjacency", lineStyle: { width: 2 } },
        data: nodes,
        links,
      },
    ],
  };
});

// 문제 노드 클릭 시 해당 문제 상세를 연다.
function onGraphClick(params: { dataType?: string; data?: { id?: string } }) {
  if (params.dataType !== "node") return;
  const id = String(params.data?.id ?? "");
  if (!id.startsWith("p:")) return;
  const num = Number(id.slice(2));
  const p = (session.value?.problems ?? []).find((x) => x.problem_number === num);
  if (p) selected.value = p;
}
</script>
```

- [ ] **Step 3: 우측에 그래프 패널 추가 (선택 전 표시)**

상세 패널(`v-if="selected"`)이 닫힌 `</div>` 뒤, 최상위 flex 컨테이너가 닫히기 전에 `v-else` 그래프 패널을 추가한다. 템플릿 끝부분:
old:
```html
        </div>
      </div>
    </div>
  </div>
</template>
```
new:
```html
        </div>
      </div>
    </div>

    <!-- Force-Directed Graph (문제 미선택 시 우측 공간) -->
    <div v-else :style="graphPanelStyle">
      <h3 :style="{ color: '#111827', fontSize: '0.9375rem', marginBottom: '0.25rem' }">문제 · 개념 관계도</h3>
      <div :style="{ fontSize: '0.75rem', color: '#9CA3AF', marginBottom: '0.5rem' }">
        노드를 끌어 움직일 수 있어요. 문제 노드를 클릭하면 상세가 열립니다.
      </div>
      <VChart
        v-if="(session?.problems?.length ?? 0) > 0"
        :option="graphOption"
        :style="{ height: 'calc(100vh - 220px)', width: '100%' }"
        autoresize
        @click="onGraphClick"
      />
      <div v-else :style="{ color: '#6B7280', fontSize: '0.875rem' }">
        표시할 문제가 없습니다.
      </div>
    </div>
  </div>
</template>
```

주의: `old` 블록은 상세 패널 마지막 부분이다. `</template>`로 끝나 유일하게 매칭된다. `v-else`가 `v-if="selected"` 패널과 형제로 올바르게 짝지어지는지 확인한다(둘 사이에 다른 엘리먼트가 없어야 함). 만약 상세 패널과 `</div>` 사이 구조가 달라 매칭이 안 되면, 상세 패널 div의 닫는 위치를 Read로 확인 후 그 직후에 `v-else` 블록을 삽입한다.

- [ ] **Step 4: 타입 체크**

Run: `cd "C:/Users/SSAFY/Desktop/SQLP/SQLP-FE" && npx tsc --noEmit 2>&1 | head -30`
Expected: 신규 에러 없음. `graphOption`/`onGraphClick`의 params 타입은 인라인으로 좁게 지정했으므로 별도 echarts 타입 import 불필요.

- [ ] **Step 5: 브라우저 확인**

문제별 이해도 탭에서:
- 행을 선택하지 않은 상태에서 우측에 Force-Directed Graph 표시
- 문제 노드(골드)와 개념 노드(파랑)가 선으로 연결, 공유 개념 중심으로 군집 형성
- 노드 드래그 가능, 휠로 확대/이동(roam)
- 문제 노드 클릭 시 우측이 상세 패널로 전환
- 상세 패널의 X 버튼으로 닫으면 다시 그래프로 복귀
- 문제 0건일 때 "표시할 문제가 없습니다." 표시

- [ ] **Step 6: 커밋**

```bash
cd "C:/Users/SSAFY/Desktop/SQLP/SQLP-FE"
git add src/views/ProblemDetailView.vue
git commit -m "feat: 문제별 이해도 우측에 문제-개념 Force-Directed Graph 추가"
```

---

## Self-Review

**1. Spec coverage:**
- 학습 세션 우측 시각화 → Task 1 ✅
- 문제별 이해도 Force-Directed Graph (문제↔개념, 반발+인력+군집) → Task 2 ✅

**2. Placeholder scan:** 모든 스텝에 실제 코드 포함. 플레이스홀더 없음.

**3. Type consistency:**
- Task 1: `trendSeriesData`/`trendOption`은 `filtered`(기존)·`summaries`에서 파생. `chartPanelStyle`은 CSSProperties. `VChart` 등록 모듈(Line/Bar/Grid/Tooltip/Legend) 일치.
- Task 2: `graphOption`/`onGraphClick`은 `session`(기존 computed)·`selected`(기존 ref) 참조. `GraphChart` 등록. `session?.problems` 옵셔널 체이닝으로 detail 미로드 시 안전.
- 두 뷰 모두 `WeakConceptsView`의 `use([...])` + `<VChart autoresize>` 패턴과 동일.
