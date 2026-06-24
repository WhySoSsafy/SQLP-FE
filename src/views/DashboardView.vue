<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import type { CSSProperties } from "vue";
import { useRouter } from "vue-router";
import { BookOpen, AlertCircle, TrendingUp, Flame, ArrowRight } from "lucide-vue-next";
import { buildDashboardSummary, buildReviewRecommendations, summarizeSessions } from "@/domain/analytics";
import type { DashboardSummary, ReviewRecommendation, SessionSummary } from "@/domain/types";

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

    <!-- Bottom: Review + Recent -->
    <div :style="{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '1.5rem' }">
      <!-- Today's Review Recommendations -->
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
                <div :style="{ fontWeight: 600, color: '#111827', fontSize: '1rem', marginBottom: '0.25rem' }">
                  {{ card.concept }}
                </div>
                <div :style="{ fontSize: '0.8125rem', color: '#6B7280' }">{{ card.reason }}</div>
              </div>
              <div :style="percentBlockStyle">
                <div :style="{ ...percentValueStyle, color: card.score < 40 ? '#EF4444' : '#C8962A' }">
                  {{ card.score }}%
                </div>
                <div :style="percentLabelStyle">이해도</div>
              </div>
            </div>
          </template>
        </div>
      </div>

      <!-- Recent Sessions -->
      <div>
        <div :style="sectionHeaderStyle">
          <h3 :style="{ color: '#111827' }">최근 학습 세션</h3>
          <button @click="router.push({ name: 'sessions' })" :style="sectionLinkStyle">
            전체 보기 <ArrowRight :size="14" />
          </button>
        </div>
        <div :style="listStackStyle">
          <div v-if="recentSessions.length === 0" :style="emptyCardStyle">
            최근 학습 세션이 없습니다.
          </div>
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
                <div :style="{ fontWeight: 600, color: '#111827', fontSize: '1rem', marginBottom: '0.25rem' }">
                  {{ s.book }}
                </div>
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
</template>
