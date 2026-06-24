<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { Search, ChevronRight, Filter } from "lucide-vue-next";
import type { CSSProperties } from "vue";
import { useSessionsStore } from "@/stores/sessions";
import { summarizeSessions } from "@/domain/analytics";
import type { SessionSummary } from "@/domain/types";

const sessions = useSessionsStore();
const router = useRouter();

const search = ref("");
const underFilter = ref<"all" | "high" | "mid" | "low">("all");

const summaries = ref<SessionSummary[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

onMounted(async () => {
  loading.value = true;
  error.value = null;
  try {
    summaries.value = await summarizeSessions();
  } catch {
    error.value = "학습 세션 목록을 불러오지 못했습니다.";
  } finally {
    loading.value = false;
  }
});

const filtered = computed(() =>
  summaries.value.filter((s) => {
    const matchSearch = s.book.toLowerCase().includes(search.value.toLowerCase());
    const matchUnder =
      underFilter.value === "all"
        ? true
        : underFilter.value === "high"
        ? s.averageUnderstanding >= 75
        : underFilter.value === "mid"
        ? s.averageUnderstanding >= 60 && s.averageUnderstanding < 75
        : s.averageUnderstanding < 60;
    return matchSearch && matchUnder;
  })
);

function avgColor(avg: number): string {
  return avg >= 75 ? "#10B981" : avg >= 60 ? "#C8962A" : "#EF4444";
}

function handleSelectSession(id: string) {
  sessions.selectSession(id);
  router.push({ name: "problem-detail" });
}

const filterOptions = [
  { key: "all" as const, label: "전체" },
  { key: "high" as const, label: "잘함 (75%↑)" },
  { key: "mid" as const, label: "애매 (60~75%)" },
  { key: "low" as const, label: "취약 (60%↓)" },
] as const;

const outerStyle: CSSProperties = { maxWidth: "900px" };

const filterBarStyle: CSSProperties = {
  backgroundColor: "#FFFFFF",
  borderRadius: "12px",
  padding: "1rem 1.25rem",
  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  marginBottom: "1.25rem",
  display: "flex",
  gap: "1rem",
  alignItems: "center",
  flexWrap: "wrap",
};

const searchWrapStyle: CSSProperties = {
  position: "relative",
  flex: "1",
  minWidth: "200px",
};

const searchIconStyle: CSSProperties = {
  position: "absolute",
  left: "0.75rem",
  top: "50%",
  transform: "translateY(-50%)",
};

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "0.5625rem 0.75rem 0.5625rem 2.25rem",
  border: "1px solid #E5E7EB",
  borderRadius: "8px",
  fontSize: "0.875rem",
  outline: "none",
  boxSizing: "border-box",
};

const filterGroupStyle: CSSProperties = {
  display: "flex",
  gap: "0.5rem",
  alignItems: "center",
};

const countStyle: CSSProperties = {
  fontSize: "0.875rem",
  color: "#6B7280",
  marginBottom: "0.875rem",
};

const cardListStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "0.875rem",
};

const emptyCardStyle: CSSProperties = {
  backgroundColor: "#FFFFFF",
  borderRadius: "12px",
  padding: "2rem",
  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  color: "#6B7280",
  fontSize: "0.9375rem",
  textAlign: "center",
};

const sessionCardStyle: CSSProperties = {
  backgroundColor: "#FFFFFF",
  borderRadius: "12px",
  padding: "1.25rem 1.5rem",
  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "1.25rem",
  transition: "box-shadow 0.15s",
};

const dateBadgeStyle: CSSProperties = {
  textAlign: "center",
  backgroundColor: "#FEF8EC",
  borderRadius: "10px",
  padding: "0.5rem 0.875rem",
  flexShrink: 0,
};

const infoStyle: CSSProperties = { flex: "1" };

const infoRowStyle: CSSProperties = {
  display: "flex",
  gap: "1.25rem",
  fontSize: "0.8125rem",
  color: "#6B7280",
};

const avgWrapStyle: CSSProperties = {
  textAlign: "center",
  flexShrink: 0,
};

const avgLabelStyle: CSSProperties = {
  fontSize: "0.6875rem",
  color: "#9CA3AF",
  marginBottom: "0.25rem",
};

const barTrackStyle: CSSProperties = {
  marginTop: "0.25rem",
  height: "4px",
  width: "80px",
  backgroundColor: "#F3F4F6",
  borderRadius: "999px",
  overflow: "hidden",
};
</script>

<template>
  <div :style="outerStyle">
    <!-- Loading / Error -->
    <div v-if="loading" :style="{ color: '#6B7280', fontSize: '0.875rem', marginBottom: '1rem' }">
      학습 세션 목록을 불러오는 중...
    </div>
    <div
      v-else-if="error"
      :style="{ color: '#DC2626', fontSize: '0.875rem', marginBottom: '1rem' }"
    >
      {{ error }}
    </div>

    <!-- Filters -->
    <div :style="filterBarStyle">
      <div :style="searchWrapStyle">
        <Search :size="16" color="#9CA3AF" :style="searchIconStyle" />
        <input
          v-model="search"
          placeholder="문제집명 검색..."
          :style="inputStyle"
        />
      </div>
      <div :style="filterGroupStyle">
        <Filter :size="15" color="#6B7280" />
        <button
          v-for="f in filterOptions"
          :key="f.key"
          @click="underFilter = f.key"
          :style="{
            padding: '0.4375rem 0.875rem',
            borderRadius: '8px',
            border: underFilter === f.key ? '1.5px solid #C8962A' : '1px solid #E5E7EB',
            backgroundColor: underFilter === f.key ? '#FEF8EC' : '#FFFFFF',
            color: underFilter === f.key ? '#C8962A' : '#6B7280',
            fontSize: '0.8125rem',
            fontWeight: underFilter === f.key ? 600 : 400,
            cursor: 'pointer',
          }"
        >
          {{ f.label }}
        </button>
      </div>
    </div>

    <!-- Session count -->
    <div :style="countStyle">총 {{ filtered.length }}개 세션</div>

    <!-- Session Cards -->
    <div :style="cardListStyle">
      <div v-if="filtered.length === 0" :style="emptyCardStyle">
        {{
          summaries.length === 0
            ? "저장된 학습 세션이 없습니다. JSON 등록 화면에서 분석 결과를 먼저 등록하세요."
            : "검색 또는 필터 조건에 맞는 학습 세션이 없습니다."
        }}
      </div>
      <div
        v-else
        v-for="s in filtered"
        :key="s.id"
        @click="handleSelectSession(s.id)"
        :style="sessionCardStyle"
      >
        <!-- Date badge -->
        <div :style="dateBadgeStyle">
          <div :style="{ fontSize: '0.75rem', color: '#92690B' }">{{ s.date.slice(0, 7) }}</div>
          <div :style="{ fontSize: '1.375rem', fontWeight: 700, color: '#C8962A', lineHeight: 1 }">
            {{ s.date.slice(8) }}
          </div>
        </div>

        <!-- Info -->
        <div :style="infoStyle">
          <div :style="{ fontWeight: 600, color: '#111827', marginBottom: '0.375rem' }">{{ s.book }}</div>
          <div :style="infoRowStyle">
            <span>📄 {{ s.problemCount }}문제</span>
            <span>👥 참여자: {{ s.speakers.join(", ") }}</span>
            <span
              :style="{
                color: s.reviewRequiredCount > 5 ? '#EF4444' : '#C8962A',
                fontWeight: 500,
              }"
            >
              🔁 복습 필요 {{ s.reviewRequiredCount }}문제
            </span>
          </div>
        </div>

        <!-- Avg Understanding -->
        <div :style="avgWrapStyle">
          <div :style="avgLabelStyle">평균 이해도</div>
          <div :style="{ fontSize: '1.5rem', fontWeight: 700, color: avgColor(s.averageUnderstanding) }">
            {{ s.averageUnderstanding }}%
          </div>
          <div :style="barTrackStyle">
            <div
              :style="{
                width: `${s.averageUnderstanding}%`,
                height: '100%',
                backgroundColor: avgColor(s.averageUnderstanding),
                borderRadius: '999px',
              }"
            />
          </div>
        </div>

        <ChevronRight :size="18" color="#D1D5DB" />
      </div>
    </div>
  </div>
</template>
