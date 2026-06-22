<script setup lang="ts">
import { CSSProperties } from 'vue'

type Understanding = '잘함' | '애매' | '모름'

interface CompRow {
  id: number
  concept: string
  subject: string
  se: Understanding
  su: Understanding
}

const ROWS: CompRow[] = [
  { id: 1, concept: 'OUTER JOIN, NULL', subject: 'SQL 기본 및 활용', se: '애매', su: '모름' },
  { id: 2, concept: 'GROUP BY, HAVING', subject: 'SQL 기본 및 활용', se: '잘함', su: '애매' },
  { id: 3, concept: '실행계획, 인덱스', subject: 'SQL 고급 활용 및 튜닝', se: '모름', su: '잘함' },
  { id: 4, concept: '정규화, 식별관계', subject: '데이터 모델링의 이해', se: '잘함', su: '잘함' },
  { id: 5, concept: '윈도우 함수', subject: 'SQL 고급 활용 및 튜닝', se: '애매', su: '애매' },
  { id: 6, concept: '서브쿼리, 인라인뷰', subject: 'SQL 기본 및 활용', se: '잘함', su: '모름' },
  { id: 7, concept: '반정규화', subject: '데이터 모델링의 이해', se: '모름', su: '애매' },
  { id: 8, concept: '조인 최적화', subject: 'SQL 고급 활용 및 튜닝', se: '잘함', su: '잘함' },
]

const SCORE: Record<Understanding, number> = { 잘함: 3, 애매: 2, 모름: 1 }

function getRecommend(se: Understanding, su: Understanding): { text: string; color: string; bg: string } {
  const ss = SCORE[se], ss2 = SCORE[su]
  if (ss > ss2) return { text: '세은 설명 추천', color: '#92690B', bg: '#FEF3C7' }
  if (ss2 > ss) return { text: '수철 설명 추천', color: '#1D4ED8', bg: '#EFF6FF' }
  if (se === '잘함' && su === '잘함') return { text: '함께 완성', color: '#065F46', bg: '#ECFDF5' }
  return { text: '함께 복습 필요', color: '#991B1B', bg: '#FEF2F2' }
}

function getBadgeStyle(val: Understanding): CSSProperties {
  const config = {
    잘함: { bg: '#ECFDF5', color: '#065F46' },
    애매: { bg: '#FEF3C7', color: '#92690B' },
    모름: { bg: '#FEF2F2', color: '#991B1B' },
  }
  const c = config[val]
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

const totalProblems = ROWS.length
const seAvg = Math.round(ROWS.reduce((s, r) => s + SCORE[r.se], 0) / ROWS.length * 33.3)
const suAvg = Math.round(ROWS.reduce((s, r) => s + SCORE[r.su], 0) / ROWS.length * 33.3)
const teamAvg = Math.round((seAvg + suAvg) / 2)
const explainCount = ROWS.filter((r) => {
  const rec = getRecommend(r.se, r.su)
  return rec.text.includes('설명 추천')
}).length

const weakest = [...ROWS].sort((a, b) => (SCORE[a.se] + SCORE[a.su]) - (SCORE[b.se] + SCORE[b.su]))[0]

const summaryCards = [
  { label: '전체 문제 수', value: `${totalProblems}문제`, color: '#C8962A', accent: '#FEF8EC' },
  { label: '팀 평균 이해도', value: `${teamAvg}%`, color: '#10B981', accent: '#ECFDF5' },
  { label: '가장 취약한 개념', value: weakest.concept.split(',')[0], color: '#EF4444', accent: '#FEF2F2' },
  { label: '설명 추천 문제', value: `${explainCount}문제`, color: '#3B82F6', accent: '#EFF6FF' },
]

const persons = [
  { name: '세은', color: '#C8962A', avg: seAvg, good: ROWS.filter(r => r.se === '잘함').length, vague: ROWS.filter(r => r.se === '애매').length, no: ROWS.filter(r => r.se === '모름').length, initial: '세' },
  { name: '수철', color: '#3B82F6', avg: suAvg, good: ROWS.filter(r => r.su === '잘함').length, vague: ROWS.filter(r => r.su === '애매').length, no: ROWS.filter(r => r.su === '모름').length, initial: '수' },
]

const tableHeaders = ['문제번호', '핵심 개념', '과목', '세은 이해도', '수철 이해도', '추천 설명 담당자']
</script>

<template>
  <div :style="{ maxWidth: '1000px' }">
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
        <h3 :style="{ color: '#111827' }">문제별 이해도 비교 — SQLP 실전문제 (2026-06-12)</h3>
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
              v-for="row in ROWS"
              :key="row.id"
              :style="{ borderTop: '1px solid #F3F4F6' }"
            >
              <td :style="{ padding: '0.875rem 1rem', fontWeight: 700, color: '#374151' }">{{ row.id }}번</td>
              <td :style="{ padding: '0.875rem 1rem', color: '#374151' }">{{ row.concept }}</td>
              <td :style="{ padding: '0.875rem 1rem', color: '#9CA3AF', fontSize: '0.8125rem', whiteSpace: 'nowrap' }">{{ row.subject }}</td>
              <td :style="{ padding: '0.875rem 1rem' }">
                <span :style="getBadgeStyle(row.se)">{{ row.se }}</span>
              </td>
              <td :style="{ padding: '0.875rem 1rem' }">
                <span :style="getBadgeStyle(row.su)">{{ row.su }}</span>
              </td>
              <td :style="{ padding: '0.875rem 1rem' }">
                <span
                  :style="{
                    backgroundColor: getRecommend(row.se, row.su).bg,
                    color: getRecommend(row.se, row.su).color,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    padding: '0.25rem 0.75rem',
                    borderRadius: '999px',
                    whiteSpace: 'nowrap',
                  }"
                >
                  {{ getRecommend(row.se, row.su).text }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
