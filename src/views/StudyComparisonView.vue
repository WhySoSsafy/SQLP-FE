<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { CSSProperties } from 'vue'
import { fetchStudyComparison } from '@/api'
import type {
  StudyComparisonMember,
  StudyComparisonRow,
  Understanding,
} from '@/domain/types'

const SCORE: Record<Understanding, number> = { 잘함: 3, 애매: 2, 모름: 1 }
const scoreOf = (val: Understanding | undefined): number => (val ? SCORE[val] ?? 0 : 0)

// ── API 데이터 (하드코딩 ROWS/persons 대신 실제 응답 사용) ──
const members = ref<StudyComparisonMember[]>([])
const rows = ref<StudyComparisonRow[]>([])
const title = ref<string>('문제별 이해도 비교')
const loading = ref(false)
const error = ref<string | null>(null)

onMounted(async () => {
  loading.value = true
  error.value = null
  try {
    const res = await fetchStudyComparison()
    // 스키마 미확정 → 방어적으로 읽는다. (mock fallback 없이 실제 데이터만 사용)
    members.value = Array.isArray(res?.members) ? res.members : []
    rows.value = Array.isArray(res?.rows) ? res.rows : []
    if (res?.title) title.value = res.title
  } catch {
    error.value = '스터디원 비교 데이터를 불러오지 못했습니다.'
    members.value = []
    rows.value = []
  } finally {
    loading.value = false
  }
})

// 현재 화면은 두 스터디원 비교 UI이므로 응답의 앞 두 명을 사용한다.
const memberA = computed<StudyComparisonMember | null>(() => members.value[0] ?? null)
const memberB = computed<StudyComparisonMember | null>(() => members.value[1] ?? null)

const hasData = computed(() => !!memberA.value && !!memberB.value && rows.value.length > 0)
const isEmpty = computed(() => !loading.value && !error.value && !hasData.value)

const understandingOf = (
  row: StudyComparisonRow,
  name: string | undefined,
): Understanding | undefined => (name ? row.understandings?.[name] : undefined)

function getRecommend(
  a: Understanding | undefined,
  b: Understanding | undefined,
): { text: string; color: string; bg: string } {
  const sa = scoreOf(a)
  const sb = scoreOf(b)
  if (sa > sb) return { text: `${memberA.value?.name ?? ''} 설명 추천`, color: '#92690B', bg: '#FEF3C7' }
  if (sb > sa) return { text: `${memberB.value?.name ?? ''} 설명 추천`, color: '#1D4ED8', bg: '#EFF6FF' }
  if (a === '잘함' && b === '잘함') return { text: '함께 완성', color: '#065F46', bg: '#ECFDF5' }
  return { text: '함께 복습 필요', color: '#991B1B', bg: '#FEF2F2' }
}

function getBadgeStyle(val: Understanding | undefined): CSSProperties {
  const config: Record<Understanding, { bg: string; color: string }> = {
    잘함: { bg: '#ECFDF5', color: '#065F46' },
    애매: { bg: '#FEF3C7', color: '#92690B' },
    모름: { bg: '#FEF2F2', color: '#991B1B' },
  }
  const c = val ? config[val] ?? { bg: '#F3F4F6', color: '#9CA3AF' } : { bg: '#F3F4F6', color: '#9CA3AF' }
  return {
    backgroundColor: c.bg,
    color: c.color,
    fontSize: '0.75rem',
    fontWeight: 600,
    padding: '0.1875rem 0.625rem',
    borderRadius: '999px',
    display: 'inline-block',
    whiteSpace: 'nowrap',
  }
}

// ── 표시용 파생 데이터 (기존 계산 로직 유지, 출처만 API로 교체) ──
const displayRows = computed(() =>
  rows.value.map((r) => {
    const a = understandingOf(r, memberA.value?.name)
    const b = understandingOf(r, memberB.value?.name)
    return { id: r.id, concept: r.concept, subject: r.subject, a, b, recommend: getRecommend(a, b) }
  }),
)

const totalProblems = computed(() => rows.value.length)
const teamAvg = computed(() =>
  Math.round(((memberA.value?.averageUnderstanding ?? 0) + (memberB.value?.averageUnderstanding ?? 0)) / 2),
)
const explainCount = computed(
  () =>
    displayRows.value.filter((r) => {
      const sa = scoreOf(r.a)
      const sb = scoreOf(r.b)
      return sa > 0 && sb > 0 && sa !== sb
    }).length,
)
const weakest = computed(() => {
  if (displayRows.value.length === 0) return null
  return [...displayRows.value].sort(
    (x, y) => scoreOf(x.a) + scoreOf(x.b) - (scoreOf(y.a) + scoreOf(y.b)),
  )[0]
})

const summaryCards = computed(() => [
  { label: '전체 문제 수', value: `${totalProblems.value}문제`, color: '#C8962A', accent: '#FEF8EC' },
  { label: '팀 평균 이해도', value: `${teamAvg.value}%`, color: '#10B981', accent: '#ECFDF5' },
  { label: '가장 취약한 개념', value: weakest.value ? weakest.value.concept.split(',')[0] : '-', color: '#EF4444', accent: '#FEF2F2' },
  { label: '설명 추천 문제', value: `${explainCount.value}문제`, color: '#3B82F6', accent: '#EFF6FF' },
])

const persons = computed(() => {
  const colors = ['#C8962A', '#3B82F6']
  return [memberA.value, memberB.value]
    .map((m, i) =>
      m
        ? {
            name: m.name,
            color: colors[i],
            avg: m.averageUnderstanding ?? 0,
            good: m.goodCount ?? 0,
            vague: m.vagueCount ?? 0,
            no: m.unknownCount ?? 0,
            initial: m.name?.charAt(0) ?? '',
          }
        : null,
    )
    .filter((p): p is NonNullable<typeof p> => p !== null)
})

const tableHeaders = computed(() => [
  '문제번호',
  '핵심 개념',
  '과목',
  `${memberA.value?.name ?? '-'} 이해도`,
  `${memberB.value?.name ?? '-'} 이해도`,
  '추천 설명 담당자',
])
</script>

<template>
  <div :style="{ maxWidth: '1000px' }">
    <!-- Loading / Error / Empty -->
    <div v-if="loading" :style="{ color: '#6B7280', fontSize: '0.875rem' }">
      스터디원 비교 데이터를 불러오는 중...
    </div>
    <div v-else-if="error" :style="{ color: '#DC2626', fontSize: '0.875rem' }">
      {{ error }}
    </div>
    <div v-else-if="isEmpty" :style="{ color: '#6B7280', fontSize: '0.875rem' }">
      비교할 스터디 데이터가 없습니다.
    </div>

    <template v-else>
      <!-- Summary Cards -->
      <div :style="{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.75rem' }">
        <div
          v-for="(card, i) in summaryCards"
          :key="i"
          :style="{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            padding: '1.125rem 1.25rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            borderTop: `3px solid ${card.color}`,
          }"
        >
          <div :style="{ fontSize: '0.8125rem', color: '#6B7280', marginBottom: '0.5rem' }">{{ card.label }}</div>
          <div :style="{ fontSize: '1.375rem', fontWeight: 700, color: card.color }">{{ card.value }}</div>
        </div>
      </div>

      <!-- Individual Summary -->
      <div :style="{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.75rem' }">
        <div
          v-for="p in persons"
          :key="p.name"
          :style="{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }"
        >
          <div :style="{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }">
            <div
              :style="{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                backgroundColor: p.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 700,
                fontSize: '0.875rem',
              }"
            >
              {{ p.initial }}
            </div>
            <div>
              <div :style="{ fontWeight: 700, color: '#111827' }">{{ p.name }}</div>
              <div :style="{ fontSize: '0.8125rem', color: '#6B7280' }">이해도 {{ p.avg }}%</div>
            </div>
            <div :style="{ marginLeft: 'auto', fontSize: '1.75rem', fontWeight: 700, color: p.color }">{{ p.avg }}%</div>
          </div>
          <div :style="{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', textAlign: 'center' as CSSProperties['textAlign'] }">
            <div
              v-for="b in [
                { label: '잘함', val: p.good, bg: '#ECFDF5', color: '#065F46' },
                { label: '애매', val: p.vague, bg: '#FEF3C7', color: '#92690B' },
                { label: '모름', val: p.no, bg: '#FEF2F2', color: '#991B1B' },
              ]"
              :key="b.label"
              :style="{ backgroundColor: b.bg, borderRadius: '8px', padding: '0.5rem' }"
            >
              <div :style="{ fontSize: '1.125rem', fontWeight: 700, color: b.color }">{{ b.val }}</div>
              <div :style="{ fontSize: '0.75rem', color: b.color }">{{ b.label }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Comparison Table -->
      <div :style="{ backgroundColor: '#FFFFFF', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden' }">
        <div :style="{ padding: '1.125rem 1.5rem', borderBottom: '1px solid #F3F4F6' }">
          <h3 :style="{ color: '#111827' }">{{ title }}</h3>
        </div>
        <div :style="{ overflowX: 'auto' }">
          <table :style="{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }">
            <thead>
              <tr :style="{ backgroundColor: '#F9FAFB' }">
                <th
                  v-for="h in tableHeaders"
                  :key="h"
                  :style="{
                    padding: '0.75rem 1rem',
                    textAlign: 'left' as CSSProperties['textAlign'],
                    color: '#6B7280',
                    fontWeight: 500,
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
                v-for="row in displayRows"
                :key="row.id"
                :style="{ borderTop: '1px solid #F3F4F6' }"
              >
                <td :style="{ padding: '0.875rem 1rem', fontWeight: 700, color: '#374151' }">{{ row.id }}번</td>
                <td :style="{ padding: '0.875rem 1rem', color: '#374151' }">{{ row.concept }}</td>
                <td :style="{ padding: '0.875rem 1rem', color: '#9CA3AF', fontSize: '0.8125rem', whiteSpace: 'nowrap' }">{{ row.subject }}</td>
                <td :style="{ padding: '0.875rem 1rem' }">
                  <span :style="getBadgeStyle(row.a)">{{ row.a ?? '-' }}</span>
                </td>
                <td :style="{ padding: '0.875rem 1rem' }">
                  <span :style="getBadgeStyle(row.b)">{{ row.b ?? '-' }}</span>
                </td>
                <td :style="{ padding: '0.875rem 1rem' }">
                  <span
                    :style="{
                      backgroundColor: row.recommend.bg,
                      color: row.recommend.color,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      padding: '0.25rem 0.75rem',
                      borderRadius: '999px',
                      whiteSpace: 'nowrap',
                    }"
                  >
                    {{ row.recommend.text }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>
