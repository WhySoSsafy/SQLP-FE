<script setup lang="ts">
import { ref, computed } from "vue";
import { CheckCircle, Circle } from "lucide-vue-next";
import { buildWrongAnswerItems } from "@/domain/analytics";
import { useSessionsStore } from "@/stores/sessions";

type FilterType = "all" | "wrong" | "vague" | "unknown" | "done";

const FILTER_LABELS: { key: FilterType; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "wrong", label: "틀린 문제" },
  { key: "vague", label: "애매한 문제" },
  { key: "unknown", label: "모르는 문제" },
  { key: "done", label: "복습 완료" },
];

const sessions = useSessionsStore();

const filter = ref<FilterType>("all");
const doneIds = ref<string[]>([]);

const items = computed(() =>
  buildWrongAnswerItems(sessions.sessions).map((item) => ({
    ...item,
    done: doneIds.value.includes(item.id),
  }))
);

const filtered = computed(() =>
  items.value.filter((item) => {
    if (filter.value === "all") return !item.done;
    if (filter.value === "done") return item.done;
    if (filter.value === "wrong") return !item.isCorrect && !item.done;
    if (filter.value === "vague") return item.understanding === "애매" && !item.done;
    if (filter.value === "unknown") return item.understanding === "모름" && !item.done;
    return true;
  })
);

function countForFilter(filterType: FilterType): number {
  if (filterType === "all") return items.value.filter((i) => !i.done).length;
  if (filterType === "wrong") return items.value.filter((i) => !i.isCorrect && !i.done).length;
  if (filterType === "vague") return items.value.filter((i) => i.understanding === "애매" && !i.done).length;
  if (filterType === "unknown") return items.value.filter((i) => i.understanding === "모름" && !i.done).length;
  return items.value.filter((i) => i.done).length;
}

function toggle(id: string) {
  if (doneIds.value.includes(id)) {
    doneIds.value = doneIds.value.filter((doneId) => doneId !== id);
  } else {
    doneIds.value = [...doneIds.value, id];
  }
}
</script>

<template>
  <!-- Empty state -->
  <div v-if="sessions.sessions.length === 0" :style="{ maxWidth: '900px' }">
    <div
      :style="{
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        padding: '3rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        textAlign: 'center',
        color: '#9CA3AF',
      }"
    >
      저장된 학습 데이터가 없습니다. JSON 등록 후 오답노트가 자동 생성됩니다.
    </div>
  </div>

  <!-- Main view -->
  <div v-else :style="{ maxWidth: '900px' }">
    <!-- Filter -->
    <div :style="{ display: 'flex', gap: '0.5rem', marginBottom: '1.375rem', flexWrap: 'wrap' }">
      <button
        v-for="f in FILTER_LABELS"
        :key="f.key"
        @click="filter = f.key"
        :style="{
          padding: '0.4375rem 1rem',
          borderRadius: '8px',
          border: filter === f.key ? 'none' : '1px solid #E5E7EB',
          backgroundColor: filter === f.key ? '#C8962A' : '#FFFFFF',
          color: filter === f.key ? '#FFFFFF' : '#6B7280',
          fontSize: '0.875rem',
          fontWeight: filter === f.key ? 600 : 400,
          cursor: 'pointer',
        }"
      >
        {{ f.label }}
        <span
          :style="{
            marginLeft: '0.375rem',
            backgroundColor: filter === f.key ? 'rgba(255,255,255,0.25)' : '#F3F4F6',
            color: filter === f.key ? '#fff' : '#9CA3AF',
            fontSize: '0.6875rem',
            fontWeight: 600,
            padding: '0 0.375rem',
            borderRadius: '999px',
          }"
        >
          {{ countForFilter(f.key) }}
        </span>
      </button>
    </div>

    <!-- Cards -->
    <div :style="{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }">
      <div
        v-if="filtered.length === 0"
        :style="{ textAlign: 'center', padding: '3rem', color: '#9CA3AF' }"
      >
        해당하는 오답이 없습니다. 🎉
      </div>

      <div
        v-for="item in filtered"
        :key="item.id"
        :style="{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          padding: '1.25rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          opacity: item.done ? 0.6 : 1,
          borderLeft: `4px solid ${item.understanding === '모름' ? '#EF4444' : '#C8962A'}`,
        }"
      >
        <div :style="{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }">
          <div :style="{ flex: 1 }">
            <!-- Header -->
            <div
              :style="{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.625rem',
                flexWrap: 'wrap',
              }"
            >
              <span :style="{ fontWeight: 700, color: '#111827' }">{{ item.problemNumber }}번</span>
              <span
                :style="{
                  backgroundColor: item.person === '세은' ? '#FEF3C7' : '#EFF6FF',
                  color: item.person === '세은' ? '#92690B' : '#1D4ED8',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  padding: '0.125rem 0.5rem',
                  borderRadius: '999px',
                }"
              >
                {{ item.person }}
              </span>
              <span
                :style="{
                  backgroundColor: item.understanding === '모름' ? '#FEF2F2' : '#FEF3C7',
                  color: item.understanding === '모름' ? '#991B1B' : '#92690B',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  padding: '0.125rem 0.5rem',
                  borderRadius: '999px',
                }"
              >
                {{ item.understanding }}
              </span>
              <span
                v-if="item.done"
                :style="{
                  backgroundColor: '#ECFDF5',
                  color: '#065F46',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  padding: '0.125rem 0.5rem',
                  borderRadius: '999px',
                }"
              >
                ✓ 복습 완료
              </span>
            </div>

            <!-- Concept -->
            <div
              :style="{
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#374151',
                marginBottom: '0.625rem',
              }"
            >
              관련 개념: {{ item.concepts.join(", ") }}
            </div>

            <div
              :style="{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.5rem 1.5rem',
                marginBottom: '0.75rem',
              }"
            >
              <div :style="{ fontSize: '0.8125rem' }">
                <span :style="{ color: '#EF4444', fontWeight: 500 }">놓친 개념: </span>
                <span :style="{ color: '#374151' }">
                  {{ item.missed.length === 0 ? "없음" : item.missed.join(", ") }}
                </span>
              </div>
              <div :style="{ fontSize: '0.8125rem' }">
                <span :style="{ color: '#6B7280', fontWeight: 500 }">오개념: </span>
                <span :style="{ color: '#374151' }">
                  {{ item.errors.length === 0 ? "없음" : item.errors.join(", ") }}
                </span>
              </div>
            </div>

            <div
              :style="{
                backgroundColor: '#F9FAFB',
                borderRadius: '8px',
                padding: '0.75rem',
                fontSize: '0.8125rem',
                color: '#374151',
                lineHeight: 1.6,
              }"
            >
              <span :style="{ fontWeight: 500, color: '#6B7280' }">해설: </span>
              {{ item.explanation }}
            </div>
          </div>

          <!-- Done button -->
          <button
            @click="toggle(item.id)"
            :style="{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: item.done ? '#10B981' : '#D1D5DB',
              flexShrink: 0,
              padding: '0.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
            }"
          >
            <CheckCircle v-if="item.done" :size="22" color="#10B981" />
            <Circle v-else :size="22" color="#D1D5DB" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
