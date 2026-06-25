<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import {
  Home, Upload, BookOpen, BarChart2, AlertTriangle, FileText, Database, Bell, ChevronRight, TrendingUp,
} from "lucide-vue-next";
import { useSessionsStore } from "@/stores/sessions";

const NAV_ITEMS = [
  { name: "home", label: "홈", icon: Home },
  { name: "sessions", label: "학습 세션", icon: BookOpen },
  { name: "problem-detail", label: "문제별 이해도", icon: BarChart2 },
  { name: "weak-concepts", label: "취약 개념", icon: AlertTriangle },
  { name: "wrong-answers", label: "오답노트", icon: FileText },
  { name: "growth-report", label: "성장 리포트", icon: TrendingUp },
  { name: "register", label: "등록", icon: Upload },
];

const PAGE_LABELS: Record<string, string> = {
  home: "홈 대시보드",
  register: "JSON / 개념 등록",
  sessions: "학습 세션",
  "problem-detail": "문제별 이해도",
  "weak-concepts": "취약 개념 대시보드",
  "wrong-answers": "오답노트",
  "concept-summary": "개념 요약",
  "growth-report": "성장 리포트",
};

const route = useRoute();
const sessions = useSessionsStore();

const headerLabel = computed(() => PAGE_LABELS[String(route.name)] ?? "");
const todayLabel = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric", month: "long", day: "numeric", weekday: "long",
}).format(new Date());

onMounted(async () => {
  await sessions.refresh();
});
</script>

<template>
  <div style="display: flex; min-height: 100vh; background-color: #f4f5f7">
    <!-- Sidebar -->
    <aside
      :style="{ width: '240px', backgroundColor: '#1E2433', position: 'fixed', top: 0, left: 0, bottom: 0, display: 'flex', flexDirection: 'column', zIndex: 100 }"
    >
      <!-- Logo -->
      <div :style="{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #2B3445', display: 'flex', alignItems: 'center', gap: '0.625rem' }">
        <div :style="{ width: '32px', height: '32px', borderRadius: '7px', backgroundColor: '#C8962A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }">
          <Database :size="16" color="white" />
        </div>
        <span :style="{ color: '#FFFFFF', fontSize: '1rem', fontWeight: 700 }">SQLP AI Coach</span>
      </div>

      <!-- Nav -->
      <nav :style="{ flex: 1, padding: '1rem 0.75rem', overflowY: 'auto' }">
        <RouterLink
          v-for="item in NAV_ITEMS"
          :key="item.name"
          :to="{ name: item.name }"
          :style="{
            width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem',
            padding: '0.625rem 0.875rem', borderRadius: '8px', marginBottom: '0.25rem',
            textDecoration: 'none',
            backgroundColor: route.name === item.name ? '#2B3445' : 'transparent',
            color: route.name === item.name ? '#C8962A' : '#94A3B8',
            fontSize: '0.875rem', fontWeight: route.name === item.name ? 600 : 400,
          }"
        >
          <span :style="{ flexShrink: 0 }"><component :is="item.icon" :size="18" /></span>
          <span :style="{ flex: 1 }">{{ item.label }}</span>
          <ChevronRight v-if="route.name === item.name" :size="14" color="#C8962A" />
        </RouterLink>
      </nav>

      <!-- Mock controls -->
      <div :style="{ padding: '0.875rem 1rem', borderTop: '1px solid #2B3445', display: 'flex', flexDirection: 'column', gap: '0.5rem' }">
        <div :style="{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }">
          <span :style="{ color: '#94A3B8', fontSize: '0.75rem', fontWeight: 600 }">Mock 데이터</span>
          <span :style="{ color: sessions.mockDataActive ? '#C8962A' : '#64748B', fontSize: '0.6875rem', fontWeight: 600 }">
            {{ sessions.mockDataActive ? "ON" : "OFF" }}
          </span>
        </div>
        <div :style="{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }">
          <button
            @click="sessions.addMockData()"
            :style="{ border: '1px solid #475569', borderRadius: '7px', backgroundColor: sessions.mockDataActive ? '#2B3445' : '#C8962A', color: sessions.mockDataActive ? '#94A3B8' : '#FFFFFF', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, padding: '0.5rem 0.375rem' }"
          >추가</button>
          <button
            @click="sessions.removeMockData()"
            :style="{ border: '1px solid #475569', borderRadius: '7px', backgroundColor: 'transparent', color: '#CBD5E1', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, padding: '0.5rem 0.375rem' }"
          >삭제</button>
        </div>
      </div>

      <!-- Bottom user -->
      <div :style="{ padding: '1rem 1.25rem', borderTop: '1px solid #2B3445', display: 'flex', alignItems: 'center', gap: '0.75rem' }">
        <div :style="{ width: '34px', height: '34px', borderRadius: '50%', backgroundColor: '#C8962A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'white', fontSize: '0.875rem', fontWeight: 600 }">세</div>
        <div>
          <div :style="{ color: '#FFFFFF', fontSize: '0.875rem', fontWeight: 500 }">세은</div>
          <div :style="{ color: '#64748B', fontSize: '0.75rem' }">SQLP 준비 중</div>
        </div>
      </div>
    </aside>

    <!-- Main -->
    <div :style="{ flex: 1, marginLeft: '240px', display: 'flex', flexDirection: 'column', minHeight: '100vh' }">
      <header :style="{ position: 'sticky', top: 0, backgroundColor: '#FFFFFF', borderBottom: '1px solid #E5E7EB', padding: '0 1.75rem', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 50 }">
        <div :style="{ fontSize: '0.9375rem', fontWeight: 600, color: '#111827' }">{{ headerLabel }}</div>
        <div :style="{ display: 'flex', alignItems: 'center', gap: '1rem' }">
          <div :style="{ fontSize: '0.8125rem', color: '#6B7280' }">{{ todayLabel }}</div>
          <button :style="{ width: '34px', height: '34px', borderRadius: '8px', border: '1px solid #E5E7EB', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }">
            <Bell :size="16" color="#6B7280" />
          </button>
          <div :style="{ display: 'flex', alignItems: 'center', gap: '0.5rem' }">
            <div :style="{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#C8962A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.8125rem', fontWeight: 600 }">세</div>
            <span :style="{ fontSize: '0.875rem', fontWeight: 500, color: '#374151' }">세은</span>
          </div>
        </div>
      </header>

      <main :style="{ flex: 1, padding: '1.75rem', overflowY: 'auto' }">
        <RouterView />
      </main>
    </div>
  </div>
</template>
