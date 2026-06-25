# 2차 피드백 배치 3C (Force Graph 정교화) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** 문제별 이해도 Force-Directed Graph의 연결선 가시성 향상, 호버 깜빡임을 부드러운 페이드로 완화(float 유지), 노드 선택 강조 추가.

**Architecture:** `ProblemDetailView`의 graphOption(ECharts graph+force) 옵션 + 선택 상태만 변경. float(layoutAnimation 기본)은 유지. 검증은 `npx tsc --noEmit` + 육안.

**Tech Stack:** Vue 3, vue-echarts (ECharts graph/force)

## Global Constraints

- SQLP-FE는 git push 하지 않음
- 인라인 `:style={}` 유지, 새 의존성 없음, BE 변경 없음
- **float(떠다니는 움직임) 유지** — `force.layoutAnimation`을 끄지 않는다
- 호버 시 `emphasis.focus: 'adjacency'`(인접 강조)는 유지하고, 비강조 노드를 **부드럽고 빠르게 페이드**시켜 깜빡임만 완화

---

### Task C1: Force Graph 선/호버/선택 개선 (ProblemDetailView)

**Files:**
- Modify: `src/views/ProblemDetailView.vue`

**Interfaces:**
- Consumes: 기존 `session` computed, `selected` ref, `graphOption` computed, `onGraphClick`.
- Produces: `selectedNodeId` ref(선택 노드 강조).

- [ ] **Step 1: selectedNodeId ref 추가**

`selected` ref 선언 바로 아래에 추가한다.
old:
```typescript
const selected = ref<ProblemAnalysis | null>(null);
```
new:
```typescript
const selected = ref<ProblemAnalysis | null>(null);
const selectedNodeId = ref<string | null>(null);
```

- [ ] **Step 2: 노드 크기를 선택 상태에 따라 키우기**

graphOption의 노드 생성 루프를 교체한다(선택된 노드만 더 크게).
old:
```typescript
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
```
new:
```typescript
  const sel = selectedNodeId.value;
  for (const p of problems) {
    const pid = `p:${p.problem_number}`;
    nodes.push({ id: pid, name: `${p.problem_number}번`, category: 0, symbolSize: sel === pid ? 48 : 34 });
    for (const c of p.concepts) {
      const cid = `c:${c}`;
      if (!conceptSeen.has(cid)) {
        conceptSeen.add(cid);
        nodes.push({ id: cid, name: c, category: 1, symbolSize: sel === cid ? 32 : 20 });
      }
      links.push({ source: pid, target: cid });
    }
  }
```

- [ ] **Step 3: series에 선 가시성 + 부드러운 상태 전환(blur 페이드) 적용**

series 정의를 교체한다. `force`(float)는 그대로 두고, 선을 진하게, `stateAnimation` + `blur`로 호버 페이드를 부드럽게 한다.
old:
```typescript
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
```
new:
```typescript
    series: [
      {
        type: "graph",
        layout: "force",
        roam: true,
        draggable: true,
        // 비강조 노드/선이 즉시 사라지지 않고 빠르게 자연스럽게 페이드 (깜빡임 완화).
        // float(force 시뮬레이션)은 그대로 유지한다.
        stateAnimation: { duration: 300, easing: "cubicOut" },
        label: { show: true, position: "right", fontSize: 11, color: "#374151" },
        force: { repulsion: 110, edgeLength: 70, gravity: 0.08 },
        categories: [
          { name: "문제", itemStyle: { color: "#C8962A" } },
          { name: "개념", itemStyle: { color: "#60A5FA" } },
        ],
        // 연결선을 더 진하고 굵게 → 잘 보이게.
        lineStyle: { color: "#9CA3AF", width: 1.5, opacity: 0.7, curveness: 0 },
        emphasis: { focus: "adjacency", lineStyle: { width: 2.5, opacity: 1 } },
        // 호버 시 비인접 노드/선을 부드럽게 흐리게 (stateAnimation으로 전환 애니메이션).
        blur: {
          itemStyle: { opacity: 0.15 },
          lineStyle: { opacity: 0.06 },
          label: { opacity: 0.15 },
        },
        data: nodes,
        links,
      },
    ],
```

- [ ] **Step 4: onGraphClick에서 선택 노드 강조 반영**

노드 클릭 시 선택을 저장하고(어떤 노드든 강조), 문제 노드면 상세도 연다. 빈 공간 클릭은 선택 해제.
old:
```typescript
// 문제 노드 클릭 시 해당 문제 상세를 연다.
function onGraphClick(params: { dataType?: string; data?: { id?: string } }) {
  if (params.dataType !== "node") return;
  const id = String(params.data?.id ?? "");
  if (!id.startsWith("p:")) return;
  const num = Number(id.slice(2));
  const p = (session.value?.problems ?? []).find((x) => x.problem_number === num);
  if (p) selected.value = p;
}
```
new:
```typescript
// 노드 클릭: 선택 강조(더 크게) + 문제 노드면 상세도 연다. 빈 공간 클릭은 선택 해제.
function onGraphClick(params: { dataType?: string; data?: { id?: string } }) {
  if (params.dataType !== "node") {
    selectedNodeId.value = null;
    return;
  }
  const id = String(params.data?.id ?? "");
  selectedNodeId.value = id;
  if (!id.startsWith("p:")) return;
  const num = Number(id.slice(2));
  const p = (session.value?.problems ?? []).find((x) => x.problem_number === num);
  if (p) selected.value = p;
}
```

- [ ] **Step 5: 타입 체크 + 커밋**

```bash
cd "C:/Users/SSAFY/Desktop/SQLP/SQLP-FE"
npx tsc --noEmit 2>&1 | head -20
git add src/views/ProblemDetailView.vue
git commit -m "feat: Force Graph 연결선 강조, 호버 부드러운 페이드(깜빡임 완화, float 유지), 노드 선택 강조"
```
Expected: 신규 에러 없음.

브라우저 확인(문제별 이해도, 행 미선택 상태 우측 그래프):
- 노드 간 연결선이 또렷하게 보임
- 노드가 계속 떠다님(float 유지)
- 마우스 호버 시 해당 노드+인접만 또렷, 나머지는 **부드럽게 흐려짐**(즉각 깜빡 없이 자연스러운 페이드)
- 개념 노드 클릭 시 그 개념 노드가 커지고, 연결된 문제/개념은 그대로 표시
- 문제 노드 클릭 시 상세 패널도 열림 / 빈 공간 클릭 시 선택 해제

---

## Self-Review

**1. Spec coverage:** 연결선 가시성(Step 3 lineStyle), 깜빡임 완화 = float 유지 + stateAnimation/blur 부드러운 페이드(Step 3), 노드 선택 강조(Step 1·2·4) — 모두 커버.

**2. Placeholder scan:** 모든 스텝 실제 old/new 코드.

**3. Type consistency:** `selectedNodeId`(ref<string|null>)는 Step 1에서 선언, Step 2(graphOption)·Step 4(onGraphClick)에서 사용 — 선언이 사용보다 앞. `stateAnimation`/`blur`/`opacity`는 ECharts graph series 유효 옵션. graphOption은 computed이므로 `selectedNodeId` 변경 시 재계산되어 선택 노드가 커진다(노드 id 안정 → ECharts가 위치 유지). float 미변경.

**참고(반복 개선 여지):** 선택 시 graphOption 재계산으로 위치가 약간 흔들릴 수 있다. 거슬리면 후속으로 ECharts select 상태 기반으로 전환 가능(이번 범위 아님).
