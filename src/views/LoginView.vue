<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { Database, Brain, BookOpen } from "lucide-vue-next";
import { useAuthStore } from "@/stores/auth";
import { toApiError } from "@/api";

const email = ref("seun@sqlp.kr");
const password = ref("password123");
const router = useRouter();
const auth = useAuthStore();

const errorMessage = ref("");
const submitting = ref(false);

async function onLogin() {
  if (submitting.value) return;
  errorMessage.value = "";
  submitting.value = true;
  try {
    await auth.login(email.value, password.value);
    router.push({ name: "home" });
  } catch (error) {
    errorMessage.value = toApiError(error).message;
  } finally {
    submitting.value = false;
  }
}

const featureCards = [
  { icon: Database, title: "JSON 분석 결과 등록", desc: "외부 AI가 분석한 풀이 결과 JSON을 업로드하거나 직접 붙여넣어 학습 기록으로 등록하세요." },
  { icon: Brain, title: "문제별 이해도 진단", desc: "문제마다 잘함·애매·모름을 시각화하고, 취약 개념을 자동으로 분류합니다." },
  { icon: BookOpen, title: "맞춤 복습 추천", desc: "학습 패턴을 분석하여 오늘 복습해야 할 개념을 자동으로 추천합니다." },
];
</script>

<template>
  <div :style="{ minHeight: '100vh', display: 'flex', backgroundColor: '#FAFAF8' }">
    <!-- Left - Form -->
    <div :style="{ width: '50%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '3rem 2rem' }">
      <div :style="{ width: '100%', maxWidth: '400px' }">
        <div :style="{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.625rem' }">
          <div :style="{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#C8962A', display: 'flex', alignItems: 'center', justifyContent: 'center' }">
            <Database :size="18" color="white" />
          </div>
          <span :style="{ fontSize: '1.375rem', fontWeight: 700, color: '#1E2433' }">SQLP AI Coach</span>
        </div>
        <p :style="{ color: '#6B7280', fontSize: '0.8125rem', marginBottom: '2.5rem' }">
          학습 발화 분석 기반 맞춤형 SQLP 학습 추천·관리 서비스
        </p>

        <h2 :style="{ fontSize: '1.25rem', fontWeight: 600, color: '#111827', marginBottom: '1.5rem' }">로그인</h2>

        <div :style="{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }">
          <div>
            <label :style="{ display: 'block', marginBottom: '0.375rem', fontSize: '0.875rem', fontWeight: 500, color: '#374151' }">이메일</label>
            <input
              type="email" v-model="email" placeholder="your@email.com"
              :style="{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box', backgroundColor: '#fff' }"
            />
          </div>
          <div>
            <label :style="{ display: 'block', marginBottom: '0.375rem', fontSize: '0.875rem', fontWeight: 500, color: '#374151' }">비밀번호</label>
            <input
              type="password" v-model="password" placeholder="••••••••"
              :style="{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box', backgroundColor: '#fff' }"
            />
          </div>
          <p
            v-if="errorMessage"
            :style="{ margin: 0, fontSize: '0.8125rem', color: '#DC2626' }"
          >{{ errorMessage }}</p>
          <button
            @click="onLogin"
            :disabled="submitting"
            :style="{ width: '100%', padding: '0.8125rem', backgroundColor: '#C8962A', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.9375rem', fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }"
          >{{ submitting ? "로그인 중..." : "로그인" }}</button>
        </div>

        <p :style="{ textAlign: 'center', fontSize: '0.875rem', color: '#6B7280' }">
          계정이 없으신가요?
          <a href="#" :style="{ color: '#C8962A', fontWeight: 500, textDecoration: 'none' }">회원가입</a>
        </p>
      </div>
    </div>

    <!-- Right - Feature cards -->
    <div :style="{ flex: 1, backgroundColor: '#1E2433', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 3rem' }">
      <div :style="{ width: '100%', maxWidth: '440px' }">
        <h2 :style="{ color: '#FFFFFF', fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }">AI 기반 SQLP 학습의 새로운 기준</h2>
        <p :style="{ color: '#94A3B8', fontSize: '0.875rem', marginBottom: '2rem', lineHeight: 1.6 }">
          외부 AI 분석 결과를 등록하고, 맞춤형 학습 경로를 확인하세요.
        </p>

        <div
          v-for="(card, i) in featureCards" :key="card.title"
          :style="{ backgroundColor: '#2B3445', borderRadius: '12px', padding: '1.25rem', border: '1px solid #374155', marginBottom: i < 2 ? '1rem' : 0, display: 'flex', gap: '1rem', alignItems: 'flex-start' }"
        >
          <div :style="{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'rgba(200,150,42,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }">
            <component :is="card.icon" :size="20" color="#C8962A" />
          </div>
          <div>
            <div :style="{ color: '#FFFFFF', fontWeight: 500, marginBottom: '0.25rem' }">{{ card.title }}</div>
            <div :style="{ color: '#94A3B8', fontSize: '0.8125rem', lineHeight: 1.55 }">{{ card.desc }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
