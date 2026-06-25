<script setup lang="ts">
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

const sessionsStore = useSessionsStore();

const sessionSummary = computed(() =>
  getSelectedOrNewestSession(
    sessionsStore.sessions,
    sessionsStore.selectedSessionId,
  )
);

const sessionDetail = ref<LearningSession | null>(null);
const loading = ref(false);

const session = computed(() => sessionDetail.value ?? sessionSummary.value);

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

const selected = ref<ProblemAnalysis | null>(null);

watch(
  () => sessionSummary.value?.id,
  (id) => {
    selected.value = null;
    sessionDetail.value = null;
    if (id) loadDetail(id);
  },
  { immediate: true }
);

function getAvatarColor(_index: number): string {
  return "#C8962A";
}

const badgeConfig: Record<Understanding, { bg: string; color: string; text: string }> = {
  잘함: { bg: "#DCFCE7", color: "#15803D", text: "잘함" },
  애매: { bg: "#FFEDD5", color: "#C2410C", text: "애매" },
  모름: { bg: "#FEE2E2", color: "#B91C1C", text: "모름" },
};

const badgeStyle = (val: Understanding): CSSProperties => ({
  backgroundColor: badgeConfig[val].bg,
  color: badgeConfig[val].color,
  fontSize: "0.75rem",
  fontWeight: 600,
  padding: "0.1875rem 0.625rem",
  borderRadius: "999px",
  display: "inline-block",
});

const detailPanelStyle: CSSProperties = {
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
};

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
                          {{ badgeConfig[p.participants.find((item) => item.name === speaker)!.understanding].text }}
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

    <!-- Detail Panel -->
    <div v-if="selected" :style="detailPanelStyle">
      <!-- Header -->
      <div
        :style="{
          padding: '1rem 1.25rem',
          borderBottom: '1px solid #F3F4F6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }"
      >
        <div>
          <span
            :style="{
              fontWeight: 700,
              color: '#C8962A',
              fontSize: '0.9375rem',
            }"
          >
            {{ selected.problem_number }}번 문제
          </span>
          <span
            :style="{
              fontSize: '0.8125rem',
              color: '#6B7280',
              marginLeft: '0.5rem',
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
          }"
        >
          <X :size="18" color="#9CA3AF" />
        </button>
      </div>

      <div
        :style="{
          flex: 1,
          overflowY: 'auto',
          padding: '1.125rem',
        }"
      >
        <!-- Section: 문제 요약 -->
        <div :style="{ marginBottom: '1rem' }">
          <div :style="sectionLabelStyle">문제 요약</div>
          <div
            :style="{
              fontSize: '0.8125rem',
              color: '#374151',
              lineHeight: '1.6',
            }"
          >
            {{ selected.solution_summary }}
          </div>
        </div>

        <!-- Section: 해설 요약 -->
        <div :style="{ marginBottom: '1rem' }">
          <div :style="sectionLabelStyle">해설 요약</div>
          <div
            :style="{
              fontSize: '0.8125rem',
              color: '#374151',
              lineHeight: '1.6',
              backgroundColor: '#F8FAFC',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              padding: '0.75rem',
            }"
          >
            {{ selected.solution_summary }}
          </div>
        </div>

        <!-- Participants -->
        <div
          v-for="(participant, index) in selected.participants"
          :key="participant.name"
          :style="{ marginBottom: '1rem' }"
        >
          <div
            :style="{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.625rem',
            }"
          >
            <div
              :style="{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: getAvatarColor(index),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '0.75rem',
                fontWeight: 600,
              }"
            >
              {{ participant.name.charAt(0) || "?" }}
            </div>
            <span
              :style="{
                fontWeight: 600,
                color: '#111827',
                fontSize: '0.875rem',
              }"
            >
              {{ participant.name }} 분석
            </span>
            <span :style="badgeStyle(participant.understanding)">
              {{ badgeConfig[participant.understanding].text }}
            </span>
          </div>

          <div
            :style="{
              backgroundColor: '#F9FAFB',
              borderRadius: '8px',
              padding: '0.75rem',
            }"
          >
            <!-- AnalysisRow: 맞힌 개념 -->
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

            <!-- AnalysisRow: 놓친 개념 -->
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

            <!-- AnalysisRow: 오개념 -->
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
            <div :style="{ fontSize: '0.8125rem' }">
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
          </div>
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
