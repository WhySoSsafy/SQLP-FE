<script setup lang="ts">
import { ref, computed, watch } from "vue";
import type { CSSProperties } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ArrowLeft } from "lucide-vue-next";
import { fetchConceptDetail } from "@/api";
import { normalizeConceptJson, hasConceptContent } from "@/domain/concept";
import ConceptSummaryContent from "@/components/ConceptSummaryContent.vue";
import type { ConceptDetail } from "@/domain/types";

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
    // 백엔드가 PDF→AI→JSON으로 만든 개념 데이터를 내려준다. (프론트는 표시만, 필드명 차이는 방어적 정규화)
    concept.value = normalizeConceptJson(await fetchConceptDetail(id));
  } catch {
    error.value = "개념 요약 데이터를 불러오지 못했습니다.";
    concept.value = null;
  } finally {
    loading.value = false;
  }
}

// 진입 시 + 관련 개념으로 이동해 id가 바뀔 때마다 다시 조회한다.
watch(conceptId, (id) => loadConcept(id), { immediate: true });

const isEmpty = computed(
  () => !loading.value && !error.value && !(concept.value && hasConceptContent(concept.value)),
);

const cardStyle: CSSProperties = {
  backgroundColor: "#FFFFFF",
  borderRadius: "12px",
  padding: "1.375rem 1.5rem",
  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  marginBottom: "1.25rem",
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
    <ConceptSummaryContent v-else-if="concept" :concept="concept" />
  </div>
</template>
