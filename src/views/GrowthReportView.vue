<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import type { CSSProperties } from "vue";
import { useRouter } from "vue-router";
import { TrendingUp, TrendingDown, Minus, ArrowUpRight, AlertTriangle, BarChart2, ArrowRight } from "lucide-vue-next";
import { fetchGrowthReport } from "@/api";
import type {
  GrowthReport,
  GrowthMetric,
  GrowthConcept,
  GrowthTrendPoint,
  GrowthRecommendation,
} from "@/domain/types";

const router = useRouter();

const report = ref<GrowthReport | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);

onMounted(async () => {
  loading.value = true;
  error.value = null;
  try {
    // 성장 리포트는 실제 API 데이터만 사용한다. (mock fallback 없음)
    report.value = await fetchGrowthReport();
  } catch {
    error.value = "성장 리포트를 불러오지 못했습니다.";
    report.value = null;
  } finally {
    loading.value = false;
  }
});

// ── 응답 스키마 미확정 → 방어적으로 정규화 (없는 섹션은 렌더하지 않음) ──
const num = (v: unknown): number | undefined => (typeof v === "number" && !Number.isNaN(v) ? v : undefined);
const str = (v: unknown): string | undefined => (typeof v === "string" && v.trim().length > 0 ? v : undefined);

interface DisplayMetric {
  label: string;
  current?: number;
  delta?: number;
  unit: string;
}

const title = computed(() => report.value?.title?.trim() || "학습 성장 리포트");

const periodLabel = computed(() => {
  const p = report.value?.period;
  if (!p) return "";
  if (p.label) return p.label;
  if (p.start && p.end) return `${p.start} ~ ${p.end}`;
  return p.start ?? p.end ?? "";
});

const metrics = computed<DisplayMetric[]>(() => {
  const raw = report.value?.metrics;
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((m): m is GrowthMetric => !!m && typeof m === "object" && typeof m.label === "string" && m.label.trim().length > 0)
    .map((m) => {
      const current = num(m.current);
      const previous = num(m.previous);
      const delta = num(m.delta) ?? (current !== undefined && previous !== undefined ? current - previous : undefined);
      return { label: m.label, current, delta, unit: str(m.unit) ?? "" };
    });
});

const normalizeConcepts = (value: unknown): GrowthConcept[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item): GrowthConcept | null => {
      if (typeof item === "string") return str(item) ? { name: item } : null;
      if (item && typeof item === "object") {
        const o = item as Record<string, unknown>;
        const name = str(o.name) ?? str(o.title) ?? str(o.concept);
        if (!name) return null;
        const id = typeof o.id === "string" || typeof o.id === "number" ? o.id : undefined;
        return { id, name, subject: str(o.subject), delta: num(o.delta), score: num(o.score) };
      }
      return null;
    })
    .filter((c): c is GrowthConcept => c !== null);
};

const improvedConcepts = computed(() => normalizeConcepts(report.value?.improvedConcepts));
const weakConcepts = computed(() => normalizeConcepts(report.value?.weakConcepts));

const trend = computed<GrowthTrendPoint[]>(() => {
  const raw = report.value?.trend;
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (p): p is GrowthTrendPoint => !!p && typeof p === "object" && typeof p.label === "string" && typeof p.value === "number",
  );
});
const trendMax = computed(() => Math.max(1, ...trend.value.map((p) => p.value)));

const recommendations = computed<GrowthRecommendation[]>(() => {
  const raw = report.value?.recommendations;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item): GrowthRecommendation | null => {
      if (typeof item === "string") return str(item) ? { title: item } : null;
      if (item && typeof item === "object") {
        const o = item as Record<string, unknown>;
        const t = str(o.title) ?? str(o.concept) ?? str(o.name);
        if (!t) return null;
        const id = typeof o.id === "string" || typeof o.id === "number" ? o.id : undefined;
        return { id, title: t, reason: str(o.reason) };
      }
      return null;
    })
    .filter((r): r is GrowthRecommendation => r !== null);
});

const hasContent = computed(
  () =>
    !!report.value &&
    !!(
      report.value.summary ||
      metrics.value.length ||
      improvedConcepts.value.length ||
      weakConcepts.value.length ||
      trend.value.length ||
      recommendations.value.length
    ),
);
const isEmpty = computed(() => !loading.value && !error.value && !hasContent.value);

// 변화량은 도메인 의미가 아니라 부호 기준으로만 색을 준다. (증가=초록, 감소=빨강, 0=회색)
const deltaColor = (d: number | undefined): string =>
  d === undefined || d === 0 ? "#6B7280" : d > 0 ? "#10B981" : "#EF4444";
const formatDelta = (d: number | undefined): string =>
  d === undefined ? "" : d > 0 ? `+${d}` : `${d}`;

function goToConcept(id: string | number | undefined) {
  if (id === undefined || id === null || String(id) === "") return;
  router.push({ name: "concept-summary", params: { id: String(id) } });
}

// ── 공통 스타일 (기존 화면 톤 유지) ──
const cardStyle: CSSProperties = {
  backgroundColor: "#FFFFFF",
  borderRadius: "12px",
  padding: "1.375rem 1.5rem",
  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  marginBottom: "1.25rem",
};
const sectionTitleStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  fontSize: "0.9375rem",
  fontWeight: 700,
  color: "#111827",
  marginBottom: "0.875rem",
};
</script>

<template>
  <div :style="{ maxWidth: '960px' }">
    <!-- Loading -->
    <div v-if="loading" :style="cardStyle">
      <div :style="{ color: '#6B7280', fontSize: '0.875rem' }">성장 리포트를 불러오는 중...</div>
    </div>

    <!-- Error -->
    <div v-else-if="error" :style="cardStyle">
      <div :style="{ color: '#DC2626', fontSize: '0.875rem' }">{{ error }}</div>
    </div>

    <!-- Empty -->
    <div v-else-if="isEmpty" :style="cardStyle">
      <div :style="{ color: '#6B7280', fontSize: '0.875rem' }">
        아직 표시할 성장 리포트 데이터가 없습니다. 학습 기록이 쌓이면 성장 추이를 확인할 수 있어요.
      </div>
    </div>

    <!-- Content -->
    <template v-else>
      <!-- Title + period + summary -->
      <div :style="cardStyle">
        <div v-if="periodLabel" :style="{ fontSize: '0.8125rem', color: '#C8962A', fontWeight: 600, marginBottom: '0.375rem' }">
          분석 기간 · {{ periodLabel }}
        </div>
        <h1 :style="{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', margin: 0 }">{{ title }}</h1>
        <p
          v-if="report?.summary"
          :style="{ fontSize: '0.9375rem', lineHeight: 1.7, color: '#374151', marginTop: '0.875rem', marginBottom: 0, whiteSpace: 'pre-wrap' }"
        >
          {{ report.summary }}
        </p>
      </div>

      <!-- 주요 성장 지표 카드 -->
      <div
        v-if="metrics.length"
        :style="{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.25rem' }"
      >
        <div
          v-for="(m, i) in metrics"
          :key="i"
          :style="{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            padding: '1.125rem 1.25rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            borderTop: '3px solid #C8962A',
          }"
        >
          <div :style="{ fontSize: '0.8125rem', color: '#6B7280', marginBottom: '0.5rem' }">{{ m.label }}</div>
          <div :style="{ fontSize: '1.5rem', fontWeight: 700, color: '#111827' }">
            <template v-if="m.current !== undefined">{{ m.current }}{{ m.unit }}</template>
            <template v-else>-</template>
          </div>
          <div
            v-if="m.delta !== undefined"
            :style="{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem', fontSize: '0.8125rem', fontWeight: 600, color: deltaColor(m.delta) }"
          >
            <TrendingUp v-if="m.delta > 0" :size="14" />
            <TrendingDown v-else-if="m.delta < 0" :size="14" />
            <Minus v-else :size="14" />
            {{ formatDelta(m.delta) }}{{ m.unit }}
          </div>
        </div>
      </div>

      <!-- 성장한 개념 -->
      <div v-if="improvedConcepts.length" :style="cardStyle">
        <div :style="sectionTitleStyle">
          <ArrowUpRight :size="16" color="#10B981" />
          많이 성장한 개념
        </div>
        <div :style="{ display: 'flex', flexDirection: 'column' as CSSProperties['flexDirection'], gap: '0.625rem' }">
          <div
            v-for="(c, i) in improvedConcepts"
            :key="i"
            :style="{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingBottom: '0.625rem', borderBottom: i < improvedConcepts.length - 1 ? '1px solid #F3F4F6' : 'none' }"
          >
            <div :style="{ flex: 1 }">
              <span :style="{ fontSize: '0.9375rem', fontWeight: 600, color: '#111827' }">{{ c.name }}</span>
              <span v-if="c.subject" :style="{ fontSize: '0.75rem', color: '#9CA3AF', marginLeft: '0.5rem' }">{{ c.subject }}</span>
            </div>
            <span v-if="c.delta !== undefined" :style="{ fontSize: '0.8125rem', fontWeight: 700, color: deltaColor(c.delta) }">
              {{ formatDelta(c.delta) }}
            </span>
            <span v-else-if="c.score !== undefined" :style="{ fontSize: '0.8125rem', fontWeight: 700, color: '#10B981' }">
              {{ c.score }}%
            </span>
          </div>
        </div>
      </div>

      <!-- 아직 취약한 개념 -->
      <div v-if="weakConcepts.length" :style="cardStyle">
        <div :style="sectionTitleStyle">
          <AlertTriangle :size="16" color="#EF4444" />
          아직 보완이 필요한 개념
        </div>
        <div :style="{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }">
          <span
            v-for="(c, i) in weakConcepts"
            :key="i"
            :style="{
              backgroundColor: '#FEF2F2',
              color: '#991B1B',
              fontSize: '0.8125rem',
              fontWeight: 500,
              padding: '0.3125rem 0.75rem',
              borderRadius: '999px',
            }"
          >
            {{ c.name }}<template v-if="c.score !== undefined"> · {{ c.score }}%</template>
          </span>
        </div>
      </div>

      <!-- 성장 추이 (간단한 바) -->
      <div v-if="trend.length" :style="cardStyle">
        <div :style="sectionTitleStyle">
          <BarChart2 :size="16" color="#C8962A" />
          성장 추이
        </div>
        <div :style="{ display: 'flex', flexDirection: 'column' as CSSProperties['flexDirection'], gap: '0.625rem' }">
          <div v-for="(p, i) in trend" :key="i" :style="{ display: 'flex', alignItems: 'center', gap: '0.75rem' }">
            <span :style="{ width: '72px', flexShrink: 0, fontSize: '0.75rem', color: '#6B7280' }">{{ p.label }}</span>
            <div :style="{ flex: 1, height: '10px', backgroundColor: '#F3F4F6', borderRadius: '999px', overflow: 'hidden' }">
              <div
                :style="{
                  width: `${Math.max(0, Math.min(100, (p.value / trendMax) * 100))}%`,
                  height: '100%',
                  backgroundColor: '#C8962A',
                  borderRadius: '999px',
                }"
              />
            </div>
            <span :style="{ width: '44px', flexShrink: 0, textAlign: 'right' as CSSProperties['textAlign'], fontSize: '0.8125rem', fontWeight: 600, color: '#111827' }">
              {{ p.value }}
            </span>
          </div>
        </div>
      </div>

      <!-- 다음 학습 추천 -->
      <div v-if="recommendations.length" :style="cardStyle">
        <div :style="sectionTitleStyle">
          <ArrowRight :size="16" color="#C8962A" />
          다음 학습 추천
        </div>
        <div :style="{ display: 'flex', flexDirection: 'column' as CSSProperties['flexDirection'], gap: '0.625rem' }">
          <button
            v-for="(r, i) in recommendations"
            :key="i"
            :disabled="r.id === undefined || r.id === null"
            :style="{
              textAlign: 'left' as CSSProperties['textAlign'],
              backgroundColor: '#F9FAFB',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              padding: '0.75rem 0.875rem',
              cursor: r.id !== undefined && r.id !== null ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
            }"
            @click="goToConcept(r.id)"
          >
            <div :style="{ flex: 1 }">
              <div :style="{ fontSize: '0.875rem', fontWeight: 600, color: '#111827' }">{{ r.title }}</div>
              <div v-if="r.reason" :style="{ fontSize: '0.8125rem', color: '#6B7280', marginTop: '0.125rem' }">{{ r.reason }}</div>
            </div>
            <ArrowRight v-if="r.id !== undefined && r.id !== null" :size="14" color="#C8962A" />
          </button>
        </div>
      </div>
    </template>
  </div>
</template>
