<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import type { CSSProperties } from "vue";
import VChart from "vue-echarts";
import { use } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { BarChart } from "echarts/charts";
import { GridComponent, TooltipComponent, LegendComponent } from "echarts/components";
import { AlertTriangle } from "lucide-vue-next";
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
  <div :style="{ width: '100%' }">
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
    </template>
  </div>
</template>
