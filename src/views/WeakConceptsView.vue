<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import type { CSSProperties } from "vue";
import VChart from "vue-echarts";
import { use } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { BarChart } from "echarts/charts";
import { GridComponent, TooltipComponent, LegendComponent } from "echarts/components";
import { AlertTriangle, RefreshCw } from "lucide-vue-next";
import { useSessionsStore } from "@/stores/sessions";
import { buildWeakConcepts } from "@/domain/analytics";
import type { WeakConcept } from "@/domain/types";

use([CanvasRenderer, BarChart, GridComponent, TooltipComponent, LegendComponent]);

const BAR_COLORS = ["#C8962A", "#3B82F6", "#10B981", "#EF4444", "#8B5CF6", "#F97316"];

const sessionsStore = useSessionsStore();

const filter = ref<string>("all");

const concepts = ref<WeakConcept[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const top5 = computed(() => concepts.value.slice(0, 5));

onMounted(async () => {
  loading.value = true;
  error.value = null;
  try {
    concepts.value = await buildWeakConcepts();
  } catch {
    error.value = "취약 개념 데이터를 불러오지 못했습니다.";
  } finally {
    loading.value = false;
  }
});

const participantNames = computed(() =>
  Array.from(new Set(sessionsStore.sessions.flatMap((session) => session.speakers))),
);

const activeFilter = computed(() =>
  filter.value === "all" || participantNames.value.includes(filter.value) ? filter.value : "all",
);

const colorOf = (name: string): string => {
  const index = participantNames.value.indexOf(name);
  return BAR_COLORS[index % BAR_COLORS.length];
};

const chartData = computed(() =>
  concepts.value.map((concept) => {
    const participantScores = Object.fromEntries(
      participantNames.value.map((participant) => [
        participant,
        concept.scoreByParticipant[participant] ?? 0,
      ]),
    );
    return {
      name: concept.name,
      ...participantScores,
      평균: concept.averageScore,
    };
  }),
);

const weakScore = (concept: WeakConcept): number =>
  activeFilter.value === "all"
    ? concept.averageScore
    : concept.scoreByParticipant[activeFilter.value] ?? 0;

const weakItems = (concept: WeakConcept): number =>
  activeFilter.value === "all"
    ? Object.values(concept.weakCountByParticipant).reduce((sum, count) => sum + count, 0)
    : concept.weakCountByParticipant[activeFilter.value] ?? 0;

// series = one bar per participant (+ 평균 when filter is 'all'):
// when activeFilter !== "all", only the matching participant is shown (no 평균)
const chartOption = computed(() => {
  const names = chartData.value.map((d) => d.name as string);
  const filteredParticipants =
    activeFilter.value === "all"
      ? participantNames.value
      : participantNames.value.filter((p) => p === activeFilter.value);
  const seriesNames = [
    ...filteredParticipants,
    ...(activeFilter.value === "all" ? ["평균"] : []),
  ];
  return {
    grid: { top: 8, right: 16, left: 8, bottom: 24, containLabel: true },
    tooltip: { trigger: "axis", valueFormatter: (v: number) => `${v}%` },
    legend: { bottom: 0, textStyle: { fontSize: 13 } },
    xAxis: {
      type: "category",
      data: names,
      axisLabel: { fontSize: 11, color: "#6B7280" },
    },
    yAxis: {
      type: "value",
      min: 0,
      max: 100,
      axisLabel: { fontSize: 11, color: "#6B7280", formatter: "{value}%" },
      splitLine: { lineStyle: { type: "dashed", color: "#F3F4F6" } },
    },
    series: seriesNames.map((s) => ({
      name: s,
      type: "bar",
      data: chartData.value.map((d) => (d as Record<string, number | string>)[s] ?? 0),
      itemStyle: {
        color: s === "평균" ? "#E5E7EB" : colorOf(s),
        borderRadius: [4, 4, 0, 0],
      },
    })),
  };
});

</script>

<template>
  <div :style="{ maxWidth: '1200px' }">
    <!-- Loading / Error -->
    <div v-if="loading" :style="{ color: '#6B7280', fontSize: '0.875rem', marginBottom: '1rem' }">
      취약 개념 데이터를 불러오는 중...
    </div>
    <div
      v-else-if="error"
      :style="{ color: '#DC2626', fontSize: '0.875rem', marginBottom: '1rem' }"
    >
      {{ error }}
    </div>

    <!-- Filter toggle -->
    <div
      :style="{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.5rem',
        marginBottom: '1.5rem',
      }"
    >
      <span :style="{ fontSize: '0.875rem', color: '#6B7280', marginRight: '0.25rem' }">보기:</span>
      <button
        v-for="label in ['전체', ...participantNames]"
        :key="label === '전체' ? 'all' : label"
        @click="filter = label === '전체' ? 'all' : label"
        :style="{
          padding: '0.375rem 0.875rem',
          borderRadius: '8px',
          border:
            activeFilter === (label === '전체' ? 'all' : label)
              ? '1.5px solid #C8962A'
              : '1px solid #E5E7EB',
          backgroundColor:
            activeFilter === (label === '전체' ? 'all' : label) ? '#FEF3C7' : '#FFFFFF',
          color:
            activeFilter === (label === '전체' ? 'all' : label) ? '#92690B' : '#6B7280',
          fontSize: '0.8125rem',
          fontWeight: activeFilter === (label === '전체' ? 'all' : label) ? 600 : 400,
          cursor: 'pointer',
        } as CSSProperties"
      >
        {{ label }}
      </button>
    </div>

    <div
      v-if="concepts.length === 0"
      :style="{
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        padding: '1.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        color: '#6B7280',
        fontSize: '0.875rem',
      }"
    >
      저장된 학습 데이터가 없습니다. JSON 등록 후 취약 개념을 확인할 수 있습니다.
    </div>

    <template v-else>
      <!-- TOP 5 cards -->
      <div :style="{ marginBottom: '1.75rem' }">
        <h3 :style="{ color: '#111827', marginBottom: '0.875rem' }">
          <AlertTriangle
            :size="16"
            color="#C8962A"
            :style="{ display: 'inline', marginRight: '0.375rem', verticalAlign: 'middle' }"
          />
          취약 개념 TOP 5
        </h3>
        <div
          :style="{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '0.875rem',
          }"
        >
          <div
            v-for="(c, i) in top5"
            :key="c.name"
            :style="{
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              padding: '1.125rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              borderTop: '3px solid #C8962A',
              position: 'relative',
            } as CSSProperties"
          >
            <div
              :style="{
                position: 'absolute',
                top: '0.75rem',
                right: '0.875rem',
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                backgroundColor: i === 0 ? '#C8962A' : '#F3F4F6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.6875rem',
                fontWeight: 700,
                color: i === 0 ? '#FFFFFF' : '#6B7280',
              } as CSSProperties"
            >
              {{ i + 1 }}
            </div>
            <div
              :style="{
                fontWeight: 700,
                color: '#111827',
                marginBottom: '0.5rem',
                paddingRight: '1.5rem',
              }"
            >
              {{ c.name }}
            </div>
            <div
              :style="{
                fontSize: '1.75rem',
                fontWeight: 700,
                color: weakScore(c) < 40 ? '#EF4444' : '#C8962A',
              }"
            >
              {{ weakScore(c) }}%
            </div>
            <div :style="{ fontSize: '0.75rem', color: '#9CA3AF' }">이해도</div>
          </div>
        </div>
      </div>

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
    </template>
  </div>
</template>
