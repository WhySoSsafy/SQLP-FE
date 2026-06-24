<script setup lang="ts">
import { ref, computed, watch } from "vue";
import type { CSSProperties } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ArrowLeft, BookOpen, Lightbulb, Tag, Code2, AlertTriangle, Brain, ArrowRight } from "lucide-vue-next";
import { fetchConceptDetail } from "@/api";
import type { ConceptDetail, ConceptExample, RelatedConcept } from "@/domain/types";

const route = useRoute();
const router = useRouter();

const concept = ref<ConceptDetail | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);

const conceptId = computed(() => String(route.params.id ?? ""));

async function loadConcept(id: string) {
  if (!id) return;
  loading.value = true;
  error.value = null;
  try {
    // 백엔드가 PDF→AI→JSON으로 만든 개념 데이터를 내려준다. (프론트는 표시만)
    concept.value = await fetchConceptDetail(id);
  } catch {
    error.value = "개념 요약 데이터를 불러오지 못했습니다.";
    concept.value = null;
  } finally {
    loading.value = false;
  }
}

// 진입 시 + 관련 개념으로 이동해 id가 바뀔 때마다 다시 조회한다.
watch(conceptId, (id) => loadConcept(id), { immediate: true });

// ── 응답 스키마가 확정 전이라 방어적으로 정규화한다. (없는 섹션은 렌더하지 않음) ──
const asStringList = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === "string" && v.trim().length > 0);
  if (typeof value === "string" && value.trim().length > 0) return [value];
  return [];
};

const title = computed(() => concept.value?.name?.trim() || "개념 요약");

const subjectPath = computed(() =>
  [concept.value?.subject, concept.value?.chapter, concept.value?.section]
    .filter((part): part is string => typeof part === "string" && part.trim().length > 0)
    .join(" · "),
);

const keywords = computed(() => asStringList(concept.value?.keywords));
const commonMistakes = computed(() => asStringList(concept.value?.commonMistakes));
const memorizationPoints = computed(() => asStringList(concept.value?.memorizationPoints));

const examples = computed<ConceptExample[]>(() => {
  const raw = concept.value?.examples;
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
  const raw = concept.value?.relatedConcepts;
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

// 표시할 의미 있는 데이터가 하나라도 있는지 (없으면 빈 상태).
const hasContent = computed(
  () =>
    !!concept.value &&
    !!(
      concept.value.name ||
      concept.value.summary ||
      concept.value.easyExplanation ||
      keywords.value.length ||
      examples.value.length ||
      commonMistakes.value.length ||
      memorizationPoints.value.length ||
      relatedConcepts.value.length
    ),
);
const isEmpty = computed(() => !loading.value && !error.value && !hasContent.value);

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
  <div :style="{ maxWidth: '860px' }">
    <!-- Back -->
    <button
      :style="{
        display: 'flex',
        alignItems: 'center',
        gap: '0.375rem',
        background: 'none',
        border: 'none',
        color: '#6B7280',
        fontSize: '0.8125rem',
        cursor: 'pointer',
        padding: 0,
        marginBottom: '1rem',
      }"
      @click="router.back()"
    >
      <ArrowLeft :size="15" />
      뒤로
    </button>

    <!-- Loading -->
    <div v-if="loading" :style="cardStyle">
      <div :style="{ color: '#6B7280', fontSize: '0.875rem' }">개념 요약을 불러오는 중...</div>
    </div>

    <!-- Error -->
    <div v-else-if="error" :style="cardStyle">
      <div :style="{ color: '#DC2626', fontSize: '0.875rem' }">{{ error }}</div>
    </div>

    <!-- Empty -->
    <div v-else-if="isEmpty" :style="cardStyle">
      <div :style="{ color: '#6B7280', fontSize: '0.875rem' }">
        표시할 개념 데이터가 없습니다.
      </div>
    </div>

    <!-- Content -->
    <template v-else>
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
    </template>
  </div>
</template>
