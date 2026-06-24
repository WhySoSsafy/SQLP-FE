<script setup lang="ts">
import { computed } from "vue";
import type { CSSProperties } from "vue";
import { useRouter } from "vue-router";
import { BookOpen, Lightbulb, Tag, Code2, AlertTriangle, Brain, ArrowRight } from "lucide-vue-next";
import type { ConceptDetail, ConceptExample, RelatedConcept } from "@/domain/types";

// 개념 요약 표시 전용 컴포넌트.
// 상세 조회(ConceptSummaryView)와 JSON 업로드 미리보기(ConceptImportView)가 동일하게 사용한다.
const props = defineProps<{ concept: ConceptDetail }>();

const router = useRouter();

// 전달된 concept이 부분 정규화돼 있어도 안전하게 표시되도록 한 번 더 방어적으로 읽는다.
const asStringList = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === "string" && v.trim().length > 0);
  if (typeof value === "string" && value.trim().length > 0) return [value];
  return [];
};

const title = computed(() => props.concept?.name?.trim() || "개념 요약");

const subjectPath = computed(() =>
  [props.concept?.subject, props.concept?.chapter, props.concept?.section]
    .filter((part): part is string => typeof part === "string" && part.trim().length > 0)
    .join(" · "),
);

const keywords = computed(() => asStringList(props.concept?.keywords));
const commonMistakes = computed(() => asStringList(props.concept?.commonMistakes));
const memorizationPoints = computed(() => asStringList(props.concept?.memorizationPoints));

const examples = computed<ConceptExample[]>(() => {
  const raw = props.concept?.examples;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item): ConceptExample | null => {
      if (typeof item === "string") return { code: item };
      if (item && typeof item === "object") {
        const ex = item as ConceptExample;
        return { title: ex.title, code: ex.code, description: ex.description };
      }
      return null;
    })
    .filter((ex): ex is ConceptExample => !!ex && (!!ex.code || !!ex.description || !!ex.title));
});

const relatedConcepts = computed<RelatedConcept[]>(() => {
  const raw = props.concept?.relatedConcepts;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item): RelatedConcept | null => {
      if (typeof item === "string") return { name: item };
      if (item && typeof item === "object" && typeof (item as RelatedConcept).name === "string") {
        const rc = item as RelatedConcept;
        return { id: rc.id, name: rc.name };
      }
      return null;
    })
    .filter((rc): rc is RelatedConcept => !!rc && rc.name.trim().length > 0);
});

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
  marginBottom: "0.75rem",
};
const bodyTextStyle: CSSProperties = {
  fontSize: "0.9375rem",
  lineHeight: 1.7,
  color: "#374151",
  whiteSpace: "pre-wrap",
};
</script>

<template>
  <div>
    <!-- Title + subject path -->
    <div :style="cardStyle">
      <div v-if="subjectPath" :style="{ fontSize: '0.8125rem', color: '#C8962A', fontWeight: 600, marginBottom: '0.375rem' }">
        {{ subjectPath }}
      </div>
      <h1 :style="{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', margin: 0 }">{{ title }}</h1>
    </div>

    <!-- 핵심 요약 -->
    <div v-if="concept?.summary" :style="cardStyle">
      <div :style="sectionTitleStyle">
        <BookOpen :size="16" color="#C8962A" />
        핵심 요약
      </div>
      <div :style="bodyTextStyle">{{ concept.summary }}</div>
    </div>

    <!-- 쉬운 설명 -->
    <div v-if="concept?.easyExplanation" :style="cardStyle">
      <div :style="sectionTitleStyle">
        <Lightbulb :size="16" color="#C8962A" />
        쉬운 설명
      </div>
      <div :style="bodyTextStyle">{{ concept.easyExplanation }}</div>
    </div>

    <!-- 주요 키워드 -->
    <div v-if="keywords.length" :style="cardStyle">
      <div :style="sectionTitleStyle">
        <Tag :size="16" color="#C8962A" />
        주요 키워드
      </div>
      <div :style="{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }">
        <span
          v-for="kw in keywords"
          :key="kw"
          :style="{
            backgroundColor: '#FEF3C7',
            color: '#92690B',
            fontSize: '0.8125rem',
            fontWeight: 500,
            padding: '0.25rem 0.75rem',
            borderRadius: '999px',
          }"
        >
          {{ kw }}
        </span>
      </div>
    </div>

    <!-- 관련 SQL / 예시 -->
    <div v-if="examples.length" :style="cardStyle">
      <div :style="sectionTitleStyle">
        <Code2 :size="16" color="#C8962A" />
        예시 SQL · 상황
      </div>
      <div :style="{ display: 'flex', flexDirection: 'column' as CSSProperties['flexDirection'], gap: '1rem' }">
        <div v-for="(ex, i) in examples" :key="i">
          <div v-if="ex.title" :style="{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.375rem' }">
            {{ ex.title }}
          </div>
          <pre
            v-if="ex.code"
            :style="{
              margin: 0,
              backgroundColor: '#FAFAFA',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              padding: '0.875rem',
              fontSize: '0.8125rem',
              fontFamily: 'monospace',
              color: '#374151',
              overflowX: 'auto',
              whiteSpace: 'pre',
            }"
          >{{ ex.code }}</pre>
          <div v-if="ex.description" :style="{ fontSize: '0.8125rem', color: '#6B7280', marginTop: '0.5rem', lineHeight: 1.6 }">
            {{ ex.description }}
          </div>
        </div>
      </div>
    </div>

    <!-- 자주 틀리는 포인트 -->
    <div v-if="commonMistakes.length" :style="cardStyle">
      <div :style="sectionTitleStyle">
        <AlertTriangle :size="16" color="#EF4444" />
        자주 틀리는 포인트
      </div>
      <ul :style="{ margin: 0, paddingLeft: '1.125rem', display: 'flex', flexDirection: 'column' as CSSProperties['flexDirection'], gap: '0.5rem' }">
        <li v-for="(m, i) in commonMistakes" :key="i" :style="{ fontSize: '0.875rem', color: '#374151', lineHeight: 1.6 }">
          {{ m }}
        </li>
      </ul>
    </div>

    <!-- 암기 / 정리 포인트 -->
    <div v-if="memorizationPoints.length" :style="cardStyle">
      <div :style="sectionTitleStyle">
        <Brain :size="16" color="#C8962A" />
        암기 · 정리 포인트
      </div>
      <ul :style="{ margin: 0, paddingLeft: '1.125rem', display: 'flex', flexDirection: 'column' as CSSProperties['flexDirection'], gap: '0.5rem' }">
        <li v-for="(p, i) in memorizationPoints" :key="i" :style="{ fontSize: '0.875rem', color: '#374151', lineHeight: 1.6 }">
          {{ p }}
        </li>
      </ul>
    </div>

    <!-- 관련 개념 / 다음 학습 추천 -->
    <div v-if="relatedConcepts.length" :style="cardStyle">
      <div :style="sectionTitleStyle">
        <ArrowRight :size="16" color="#C8962A" />
        관련 개념 · 다음 학습
      </div>
      <div :style="{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }">
        <button
          v-for="(rc, i) in relatedConcepts"
          :key="i"
          :disabled="rc.id === undefined || rc.id === null"
          :style="{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            padding: '0.4375rem 0.875rem',
            fontSize: '0.8125rem',
            color: rc.id !== undefined && rc.id !== null ? '#C8962A' : '#6B7280',
            fontWeight: 500,
            cursor: rc.id !== undefined && rc.id !== null ? 'pointer' : 'default',
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
          }"
          @click="goToConcept(rc.id)"
        >
          {{ rc.name }}
          <ArrowRight v-if="rc.id !== undefined && rc.id !== null" :size="13" />
        </button>
      </div>
    </div>
  </div>
</template>
