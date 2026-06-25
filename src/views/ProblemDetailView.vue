<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { X } from "lucide-vue-next";
import type { CSSProperties } from "vue";
import VChart from "vue-echarts";
import { use } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { GraphChart } from "echarts/charts";
import { TooltipComponent, LegendComponent } from "echarts/components";
import type { LearningSession, ProblemAnalysis, Understanding, Comment } from "@/domain/types";
import { understandingLabel, understandingTone } from "@/domain/understanding";
import { getSelectedOrNewestSession } from "@/domain/storage";
import { useSessionsStore } from "@/stores/sessions";
import { fetchSessionDetail, fetchCombinedSession, fetchComments, createComment, deleteComment } from "@/api";
import { MOCK_SESSIONS } from "@/mocks/data";

use([CanvasRenderer, GraphChart, TooltipComponent, LegendComponent]);

const sessionsStore = useSessionsStore();

const sessionSummary = computed(() =>
  getSelectedOrNewestSession(
    sessionsStore.sessions,
    sessionsStore.selectedSessionId,
  )
);

const sessionDetail = ref<LearningSession | null>(null);
const loading = ref(false);

// 전체/오늘 토글
const viewMode = ref<"today" | "all">("today");
const isAllMode = computed(() => viewMode.value === "all");
const combinedSessionDetail = ref<LearningSession | null>(null);

const session = computed(() => {
  if (isAllMode.value) return combinedSessionDetail.value;
  return sessionDetail.value ?? sessionSummary.value;
});

async function loadDetail(id: string) {
  loading.value = true;
  try {
    sessionDetail.value = await fetchSessionDetail(id);
  } catch {
    sessionDetail.value = null;
  } finally {
    loading.value = false;
  }
}

async function loadCombinedDetail() {
  loading.value = true;
  try {
    combinedSessionDetail.value = await fetchCombinedSession();
  } catch {
    combinedSessionDetail.value = null;
  } finally {
    loading.value = false;
  }
}

const selected = ref<ProblemAnalysis | null>(null);
const selectedNodeId = ref<string | null>(null);

// Comments state per participant id
const commentsByPid = ref<Record<number, Comment[]>>({});
const draftByPid = ref<Record<number, string>>({});
const submittingByPid = ref<Record<number, boolean>>({});

// 문제 전환 시 진행 중이던 이전 fetch가 새 문제의 댓글에 끼어들지 않도록 토큰으로 가드한다.
let commentLoadToken = 0;

async function loadCommentsForSelected(p: ProblemAnalysis) {
  const token = ++commentLoadToken;
  commentsByPid.value = {}; // 이전에 열었던 문제의 댓글이 남지 않도록 초기화
  for (const participant of p.participants) {
    const pid = participant.id;
    if (pid == null) continue;
    try {
      const comments = await fetchComments(pid);
      if (token !== commentLoadToken) return; // 다른 문제로 전환됨 → 결과 폐기
      commentsByPid.value = { ...commentsByPid.value, [pid]: comments };
    } catch (err) {
      if (token !== commentLoadToken) return;
      console.error(`댓글 로드 실패 (participant ${pid}):`, err);
    }
  }
}

watch(selected, (p) => {
  if (p) {
    loadCommentsForSelected(p);
  } else {
    // 모달을 닫으면 댓글 상태를 비운다(다음에 열 때 깨끗하게 로드).
    commentLoadToken++;
    commentsByPid.value = {};
  }
});

async function submitComment(pid: number) {
  const draft = draftByPid.value[pid]?.trim();
  if (!draft) return;
  submittingByPid.value = { ...submittingByPid.value, [pid]: true };
  try {
    const newComment = await createComment(pid, draft);
    commentsByPid.value = {
      ...commentsByPid.value,
      [pid]: [...(commentsByPid.value[pid] ?? []), newComment],
    };
    draftByPid.value = { ...draftByPid.value, [pid]: "" };
  } catch (err) {
    console.error(`댓글 작성 실패 (participant ${pid}):`, err);
  } finally {
    submittingByPid.value = { ...submittingByPid.value, [pid]: false };
  }
}

async function removeComment(pid: number, commentId: number) {
  try {
    await deleteComment(commentId);
    commentsByPid.value = {
      ...commentsByPid.value,
      [pid]: (commentsByPid.value[pid] ?? []).filter((c) => c.id !== commentId),
    };
  } catch (err) {
    console.error(`댓글 삭제 실패 (comment ${commentId}):`, err);
  }
}

// ESC key closes the modal
function handleKeyDown(e: KeyboardEvent) {
  if (e.key === "Escape") {
    selected.value = null;
  }
}
onMounted(() => window.addEventListener("keydown", handleKeyDown));
onUnmounted(() => window.removeEventListener("keydown", handleKeyDown));

watch(
  () => sessionSummary.value?.id,
  (id) => {
    selected.value = null;
    sessionDetail.value = null;
    if (id) loadDetail(id);
  },
  { immediate: true }
);

watch(viewMode, (mode) => {
  selected.value = null;
  selectedNodeId.value = null;
  if (mode === "all" && !combinedSessionDetail.value) {
    loadCombinedDetail();
  }
});

function getAvatarColor(_index: number): string {
  return "#C8962A";
}

// 세션 날짜 맵 (problem.id → "MM/DD" 표시용)
const _sessionDateMap = new Map(MOCK_SESSIONS.map((s) => [s.id, s.session_date]));
function getProblemSessionLabel(problemId: string): string {
  const sid = problemId.split("-p")[0];
  const d = _sessionDateMap.get(sid) ?? "";
  return d.slice(5).replace("-", "/"); // "2026-06-20" → "06/20"
}

const activeToggleBtnStyle: CSSProperties = {
  backgroundColor: "#C8962A",
  color: "#FFFFFF",
  border: "none",
  borderRadius: "6px",
  padding: "0.375rem 0.875rem",
  fontSize: "0.8125rem",
  fontWeight: 600,
  cursor: "pointer",
};

const inactiveToggleBtnStyle: CSSProperties = {
  backgroundColor: "#F3F4F6",
  color: "#6B7280",
  border: "none",
  borderRadius: "6px",
  padding: "0.375rem 0.875rem",
  fontSize: "0.8125rem",
  fontWeight: 500,
  cursor: "pointer",
};

// 이해도 배지 색상/라벨은 공용 헬퍼로 통일한다. ("이해" 등 변형 값도 normalize되어
// 잘함=녹/애매=주/모름=적으로 항상 구분되고, badgeConfig[val] undefined 접근으로 깨지지 않는다.)
const badgeStyle = (val: Understanding): CSSProperties => ({
  backgroundColor: understandingTone(val).bg,
  color: understandingTone(val).color,
  fontSize: "0.75rem",
  fontWeight: 600,
  padding: "0.1875rem 0.625rem",
  borderRadius: "999px",
  display: "inline-block",
});

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

  const sel = selectedNodeId.value;
  for (const p of problems) {
    // 전체 모드: 세션별 고유 ID 사용 ("p:s1-p1"), 라벨은 "s1-1번" 형태
    // 오늘 모드: 기존 방식 ("p:1"), 라벨은 "1번"
    const pid = isAllMode.value ? `p:${p.id}` : `p:${p.problem_number}`;
    const pLabel = isAllMode.value
      ? `${p.id.split("-p")[0]}-${p.problem_number}번`
      : `${p.problem_number}번`;
    nodes.push({ id: pid, name: pLabel, category: 0, symbolSize: sel === pid ? 48 : 34 });
    for (const c of p.concepts) {
      const cid = `c:${c}`;
      if (!conceptSeen.has(cid)) {
        conceptSeen.add(cid);
        nodes.push({ id: cid, name: c, category: 1, symbolSize: sel === cid ? 32 : 20 });
      }
      // 선(엣지) 호버 시에는 emphasis/blur를 발동하지 않게 한다.
      // 선은 얇고 force 시뮬레이션으로 계속 움직여서, 커서가 선에 닿을 때마다
      // 강조/흐림이 켜졌다 꺼졌다 반복하며 화면이 깜빡이는 원인이 된다.
      // 강조 효과는 노드 호버에서만 동작하도록 한다.
      links.push({ source: pid, target: cid, emphasis: { disabled: true } });
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
        // 호버 시 비인접 노드/선을 부드럽게 흐리게.
        blur: {
          itemStyle: { opacity: 0.15 },
          lineStyle: { opacity: 0.06 },
          label: { opacity: 0.15 },
        },
        data: nodes,
        links,
      },
    ],
  };
});

// 노드 클릭: 선택 강조(더 크게) + 문제 노드면 상세도 연다. 빈 공간 클릭은 선택 해제.
function onGraphClick(params: any) {
  if (params.dataType !== "node") {
    selectedNodeId.value = null;
    return;
  }
  const nodeId = String(params.data?.id ?? "");
  selectedNodeId.value = nodeId;
  if (!nodeId.startsWith("p:")) return;
  const key = nodeId.slice(2); // 오늘: "1", 전체: "s1-p1"
  let p: ProblemAnalysis | undefined;
  if (isAllMode.value) {
    p = (session.value?.problems ?? []).find((x) => x.id === key);
  } else {
    p = (session.value?.problems ?? []).find((x) => x.problem_number === Number(key));
  }
  if (p) selected.value = p;
}
</script>

<template>
  <div :style="{ display: 'flex', gap: '1.5rem', width: '100%' }">
    <!-- Table -->
    <div :style="{ flex: 1, minWidth: 0 }">
      <div
        :style="{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          overflow: 'hidden',
        }"
      >
        <!-- 전체/오늘 토글 -->
        <div
          :style="{
            padding: '0.625rem 1.5rem',
            borderBottom: '1px solid #F3F4F6',
            display: 'flex',
            gap: '0.375rem',
          }"
        >
          <button :style="viewMode === 'today' ? activeToggleBtnStyle : inactiveToggleBtnStyle" @click="viewMode = 'today'">
            오늘 학습
          </button>
          <button :style="viewMode === 'all' ? activeToggleBtnStyle : inactiveToggleBtnStyle" @click="viewMode = 'all'">
            전체 학습
          </button>
        </div>

        <!-- No session state -->
        <template v-if="!session">
          <div
            :style="{
              padding: '1.125rem 1.5rem',
              color: '#6B7280',
              fontSize: '0.875rem',
            }"
          >
            저장된 학습 세션이 없습니다. JSON 등록 후 문제별 이해도를 확인할 수 있습니다.
          </div>
        </template>

        <!-- Session found -->
        <template v-else>
          <div
            :style="{
              padding: '1.125rem 1.5rem',
              borderBottom: '1px solid #F3F4F6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }"
          >
            <h3 :style="{ color: '#111827' }">
              문제별 이해도 — {{ session.book }} ({{ session.session_date }})
            </h3>
            <span :style="{ fontSize: '0.8125rem', color: '#6B7280' }">
              총 {{ session.problems?.length ?? 0 }}문제
            </span>
          </div>

          <div :style="{ overflowX: 'auto' }">
            <table
              :style="{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.875rem',
              }"
            >
              <thead>
                <tr :style="{ backgroundColor: '#FEF8EC', borderBottom: '2px solid #F0E0C0' }">
                  <th
                    v-for="h in [
                      '번호',
                      ...(isAllMode ? ['교재'] : []),
                      '과목',
                      '핵심 개념',
                      ...session.speakers.flatMap((speaker) => [
                        `${speaker} 정답`,
                        `${speaker} 이해도`,
                      ]),
                      '복습',
                    ]"
                    :key="h"
                    :style="{
                      padding: '0.75rem 1rem',
                      textAlign: 'center' as CSSProperties['textAlign'],
                      color: '#374151',
                      fontWeight: 700,
                      fontSize: '0.8125rem',
                      whiteSpace: 'nowrap',
                    }"
                  >
                    {{ h }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="p in (session.problems ?? [])"
                  :key="p.id"
                  @click="selected = p"
                  :style="{
                    borderTop: '1px solid #F3F4F6',
                    cursor: 'pointer',
                    backgroundColor: selected?.id === p.id ? '#FEF8EC' : 'transparent',
                  }"
                >
                  <td
                    :style="{
                      padding: '0.875rem 1rem',
                      color: '#374151',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                    }"
                  >
                    {{ p.problem_number }}번
                  </td>
                  <!-- 전체 모드: 교재(세션 날짜) 컬럼 -->
                  <td
                    v-if="isAllMode"
                    :style="{
                      padding: '0.875rem 1rem',
                      color: '#9CA3AF',
                      whiteSpace: 'nowrap',
                      fontSize: '0.75rem',
                      textAlign: 'center',
                    }"
                  >
                    {{ getProblemSessionLabel(p.id) }}
                  </td>
                  <td
                    :style="{
                      padding: '0.875rem 1rem',
                      color: '#6B7280',
                      whiteSpace: 'nowrap',
                      fontSize: '0.8125rem',
                    }"
                  >
                    {{ p.subject_area }}
                  </td>
                  <td :style="{ padding: '0.875rem 1rem' }">
                    <div
                      :style="{
                        display: 'flex',
                        gap: '0.25rem',
                        flexWrap: 'wrap',
                      }"
                    >
                      <span
                        v-for="c in p.concepts"
                        :key="c"
                        :style="{
                          backgroundColor: '#F3F4F6',
                          color: '#374151',
                          fontSize: '0.75rem',
                          padding: '0.125rem 0.5rem',
                          borderRadius: '6px',
                        }"
                      >
                        {{ c }}
                      </span>
                    </div>
                  </td>
                  <template
                    v-for="speaker in session.speakers"
                    :key="`${p.id}-${speaker}`"
                  >
                    <td :style="{ padding: '0.875rem 1rem', textAlign: 'center' as CSSProperties['textAlign'] }">
                      <template v-if="p.participants.find((item) => item.name === speaker)">
                        <span
                          :style="{
                            color: p.participants.find((item) => item.name === speaker)!.is_correct
                              ? '#10B981'
                              : '#EF4444',
                            fontWeight: 600,
                          }"
                        >
                          {{ p.participants.find((item) => item.name === speaker)!.is_correct ? "O" : "X" }}
                        </span>
                      </template>
                      <template v-else>
                        <span :style="{ color: '#9CA3AF' }">-</span>
                      </template>
                    </td>
                    <td :style="{ padding: '0.875rem 1rem', textAlign: 'center' as CSSProperties['textAlign'] }">
                      <template v-if="p.participants.find((item) => item.name === speaker)">
                        <span
                          :style="badgeStyle(p.participants.find((item) => item.name === speaker)!.understanding)"
                        >
                          {{ understandingLabel(p.participants.find((item) => item.name === speaker)!.understanding) }}
                        </span>
                      </template>
                      <template v-else>
                        <span :style="{ color: '#9CA3AF' }">-</span>
                      </template>
                    </td>
                  </template>
                  <td :style="{ padding: '0.875rem 1rem', whiteSpace: 'nowrap', textAlign: 'center' as CSSProperties['textAlign'] }">
                    <span
                      v-if="p.participants.some((participant) => participant.review_required)"
                      :style="{
                        fontSize: '0.75rem',
                        color: '#EF4444',
                        fontWeight: 600,
                        backgroundColor: '#FEF2F2',
                        padding: '0.125rem 0.5rem',
                        borderRadius: '999px',
                      }"
                    >
                      필요
                    </span>
                    <span v-else :style="{ fontSize: '0.75rem', color: '#9CA3AF' }">—</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
      </div>
    </div>

    <!-- Force-Directed Graph (always visible on the right) -->
    <div :style="graphPanelStyle">
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

  <!-- Modal Overlay -->
  <Teleport to="body">
    <div
      v-if="selected"
      @click="selected = null"
      :style="{
        position: 'fixed',
        inset: '0',
        background: 'rgba(0,0,0,0.45)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }"
    >
      <!-- Card (stop propagation so clicks inside don't close modal) -->
      <div
        @click.stop
        :style="{
          background: '#FFFFFF',
          borderRadius: '14px',
          width: '100%',
          maxWidth: '720px',
          maxHeight: '90vh',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }"
      >
        <!-- Modal Header -->
        <div
          :style="{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #F3F4F6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            backgroundColor: '#FFFFFF',
            zIndex: 1,
            borderRadius: '14px 14px 0 0',
          }"
        >
          <div>
            <span
              :style="{
                fontWeight: 700,
                color: '#C8962A',
                fontSize: '1.125rem',
              }"
            >
              {{ selected.problem_number }}번
            </span>
            <span
              :style="{
                fontSize: '0.875rem',
                color: '#6B7280',
                marginLeft: '0.625rem',
              }"
            >
              {{ selected.subject_area }}
            </span>
          </div>
          <button
            @click="selected = null"
            :style="{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }"
          >
            <X :size="20" color="#9CA3AF" />
          </button>
        </div>

        <!-- Modal Body -->
        <div :style="{ padding: '1.5rem', flex: 1 }">
          <!-- Section: 문제 요약
               해설 요약 note: ProblemAnalysis has no separate explanation field —
               both would bind to solution_summary. To avoid duplicate identical text,
               only the 문제 요약 section is shown once. -->
          <div :style="{ marginBottom: '1.5rem' }">
            <div :style="sectionLabelStyle">문제 요약</div>
            <div
              :style="{
                fontSize: '0.875rem',
                color: '#374151',
                lineHeight: '1.7',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                padding: '0.875rem',
              }"
            >
              {{ selected.solution_summary }}
            </div>
          </div>

          <!-- Participants -->
          <div
            v-for="(participant, index) in selected.participants"
            :key="participant.name"
            :style="{
              marginBottom: '1.5rem',
              border: '1px solid #F3F4F6',
              borderRadius: '10px',
              overflow: 'hidden',
            }"
          >
            <!-- Participant header -->
            <div
              :style="{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.875rem 1rem',
                backgroundColor: '#FAFAFA',
                borderBottom: '1px solid #F3F4F6',
              }"
            >
              <div
                :style="{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: getAvatarColor(index),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  flexShrink: 0,
                }"
              >
                {{ participant.name.charAt(0) || "?" }}
              </div>
              <span
                :style="{
                  fontWeight: 600,
                  color: '#111827',
                  fontSize: '0.9375rem',
                }"
              >
                {{ participant.name }} 분석
              </span>
              <span :style="badgeStyle(participant.understanding)">
                {{ understandingLabel(participant.understanding) }}
              </span>
            </div>

            <!-- Participant analysis detail -->
            <div :style="{ padding: '0.875rem 1rem' }">
              <!-- 맞힌 개념 -->
              <div :style="{ fontSize: '0.8125rem', marginBottom: '0.375rem' }">
                <span :style="{ color: '#6B7280' }">맞힌 개념: </span>
                <span v-if="participant.concepts_covered.length === 0" :style="{ color: '#9CA3AF' }">없음</span>
                <template v-else>
                  <span
                    v-for="item in participant.concepts_covered"
                    :key="item"
                    :style="{
                      backgroundColor: '#10B981' + '15',
                      color: '#10B981',
                      fontSize: '0.75rem',
                      padding: '0.0625rem 0.4375rem',
                      borderRadius: '4px',
                      marginRight: '0.25rem',
                    }"
                  >
                    {{ item }}
                  </span>
                </template>
              </div>

              <!-- 놓친 개념 -->
              <div :style="{ fontSize: '0.8125rem', marginBottom: '0.375rem' }">
                <span :style="{ color: '#6B7280' }">놓친 개념: </span>
                <span v-if="participant.concepts_missed.length === 0" :style="{ color: '#9CA3AF' }">없음</span>
                <template v-else>
                  <span
                    v-for="item in participant.concepts_missed"
                    :key="item"
                    :style="{
                      backgroundColor: '#EF4444' + '15',
                      color: '#EF4444',
                      fontSize: '0.75rem',
                      padding: '0.0625rem 0.4375rem',
                      borderRadius: '4px',
                      marginRight: '0.25rem',
                    }"
                  >
                    {{ item }}
                  </span>
                </template>
              </div>

              <!-- 오개념 -->
              <div :style="{ fontSize: '0.8125rem', marginBottom: '0.375rem' }">
                <span :style="{ color: '#6B7280' }">오개념: </span>
                <span v-if="participant.errors.length === 0" :style="{ color: '#9CA3AF' }">없음</span>
                <template v-else>
                  <span
                    v-for="item in participant.errors"
                    :key="item"
                    :style="{
                      backgroundColor: '#F59E0B' + '15',
                      color: '#F59E0B',
                      fontSize: '0.75rem',
                      padding: '0.0625rem 0.4375rem',
                      borderRadius: '4px',
                      marginRight: '0.25rem',
                    }"
                  >
                    {{ item }}
                  </span>
                </template>
              </div>

              <!-- 복습 필요 -->
              <div :style="{ fontSize: '0.8125rem', marginBottom: '0.875rem' }">
                <span :style="{ color: '#6B7280' }">복습 필요: </span>
                <span
                  :style="{
                    color: participant.review_required ? '#EF4444' : '#9CA3AF',
                    fontWeight: participant.review_required ? 600 : 400,
                  }"
                >
                  {{ participant.review_required ? "필요" : "아니오" }}
                </span>
              </div>

              <!-- Comments section (only for participants with id) -->
              <template v-if="participant.id != null">
                <div
                  :style="{
                    borderTop: '1px solid #F3F4F6',
                    paddingTop: '0.75rem',
                  }"
                >
                  <div :style="{ ...sectionLabelStyle, marginBottom: '0.625rem' }">댓글</div>

                  <!-- Comment list -->
                  <div
                    v-if="(commentsByPid[participant.id!] ?? []).length > 0"
                    :style="{ marginBottom: '0.75rem' }"
                  >
                    <div
                      v-for="c in commentsByPid[participant.id!]"
                      :key="c.id"
                      :style="{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.5rem',
                        padding: '0.5rem 0.625rem',
                        backgroundColor: '#F9FAFB',
                        borderRadius: '6px',
                        marginBottom: '0.375rem',
                        fontSize: '0.8125rem',
                      }"
                    >
                      <div :style="{ flex: 1, minWidth: 0 }">
                        <span :style="{ fontWeight: 600, color: '#374151' }">{{ c.author_name }}</span>
                        <span :style="{ color: '#9CA3AF', fontSize: '0.75rem', marginLeft: '0.375rem' }">{{ c.created_at }}</span>
                        <div :style="{ color: '#374151', marginTop: '0.1875rem', lineHeight: '1.5' }">{{ c.content }}</div>
                      </div>
                      <button
                        v-if="c.is_mine"
                        @click="removeComment(participant.id!, c.id)"
                        :style="{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#9CA3AF',
                          fontSize: '0.75rem',
                          padding: '0.125rem 0.25rem',
                          flexShrink: 0,
                          borderRadius: '4px',
                        }"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                  <div
                    v-else
                    :style="{
                      fontSize: '0.8125rem',
                      color: '#9CA3AF',
                      marginBottom: '0.75rem',
                    }"
                  >
                    아직 댓글이 없습니다.
                  </div>

                  <!-- Comment input -->
                  <div :style="{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }">
                    <textarea
                      :value="draftByPid[participant.id!] ?? ''"
                      @input="(e) => { draftByPid = { ...draftByPid, [participant.id!]: (e.target as HTMLTextAreaElement).value } }"
                      placeholder="댓글을 입력하세요..."
                      rows="2"
                      :style="{
                        flex: 1,
                        resize: 'none',
                        border: '1px solid #E5E7EB',
                        borderRadius: '6px',
                        padding: '0.5rem 0.625rem',
                        fontSize: '0.8125rem',
                        color: '#374151',
                        outline: 'none',
                        fontFamily: 'inherit',
                        lineHeight: '1.5',
                      }"
                    />
                    <button
                      @click="submitComment(participant.id!)"
                      :disabled="!(draftByPid[participant.id!]?.trim()) || submittingByPid[participant.id!]"
                      :style="{
                        backgroundColor: (draftByPid[participant.id!]?.trim() && !submittingByPid[participant.id!]) ? '#C8962A' : '#E5E7EB',
                        color: (draftByPid[participant.id!]?.trim() && !submittingByPid[participant.id!]) ? '#FFFFFF' : '#9CA3AF',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '0.5rem 0.875rem',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        cursor: (draftByPid[participant.id!]?.trim() && !submittingByPid[participant.id!]) ? 'pointer' : 'not-allowed',
                        whiteSpace: 'nowrap',
                        transition: 'background-color 0.15s',
                      }"
                    >
                      댓글 작성
                    </button>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
