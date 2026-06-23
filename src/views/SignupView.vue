<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { Database, Brain, BookOpen } from "lucide-vue-next";
import { register, toApiError } from "@/api";

const name = ref("");
const email = ref("");
const password = ref("");
const passwordConfirm = ref("");
const router = useRouter();

const errorMessage = ref("");
const submitting = ref(false);

/** 회원가입 실패(ApiError)를 상황별 사용자 메시지로 변환한다. */
function toSignupErrorMessage(error: unknown): string {
  const apiError = toApiError(error);
  if (apiError.status === 0) {
    return "서버에 연결하지 못했습니다. 잠시 후 다시 시도해주세요.";
  }
  if (apiError.status >= 500) {
    return "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
  }
  // 400 VALIDATION_ERROR: 백엔드 필드 에러를 한국어 메시지로 매핑한다.
  const emailError = apiError.fieldErrors.find((f) => f.path.includes("email"));
  if (emailError) {
    return /exist/i.test(emailError.message)
      ? "이미 사용 중인 이메일입니다."
      : "올바른 이메일 형식이 아닙니다.";
  }
  if (apiError.fieldErrors.some((f) => f.path.includes("password"))) {
    return "비밀번호는 8자 이상이어야 합니다.";
  }
  if (apiError.fieldErrors.some((f) => f.path.includes("name"))) {
    return "이름을 입력해주세요.";
  }
  return apiError.message;
}

async function onSignup() {
  if (submitting.value) return;
  errorMessage.value = "";

  // 필수값 / 비밀번호 규칙은 API 전송 전에 프론트에서 먼저 검사한다.
  if (!name.value || !email.value || !password.value || !passwordConfirm.value) {
    errorMessage.value = "모든 항목을 입력해주세요.";
    return;
  }
  if (password.value.length < 8) {
    errorMessage.value = "비밀번호는 8자 이상이어야 합니다.";
    return;
  }
  if (password.value !== passwordConfirm.value) {
    errorMessage.value = "비밀번호가 일치하지 않습니다.";
    return;
  }

  submitting.value = true;
  try {
    await register({ name: name.value, email: email.value, password: password.value });
    // 백엔드가 토큰을 주지 않으므로 자동 로그인 없이 로그인 화면으로 이동한다.
    router.push({ name: "login", query: { registered: "1" } });
  } catch (error) {
    errorMessage.value = toSignupErrorMessage(error);
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

        <h2 :style="{ fontSize: '1.25rem', fontWeight: 600, color: '#111827', marginBottom: '1.5rem' }">회원가입</h2>

        <div :style="{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }">
          <div>
            <label :style="{ display: 'block', marginBottom: '0.375rem', fontSize: '0.875rem', fontWeight: 500, color: '#374151' }">이름</label>
            <input
              type="text" v-model="name" placeholder="홍길동"
              :style="{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box', backgroundColor: '#fff' }"
            />
          </div>
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
              type="password" v-model="password" placeholder="8자 이상"
              :style="{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box', backgroundColor: '#fff' }"
            />
          </div>
          <div>
            <label :style="{ display: 'block', marginBottom: '0.375rem', fontSize: '0.875rem', fontWeight: 500, color: '#374151' }">비밀번호 확인</label>
            <input
              type="password" v-model="passwordConfirm" placeholder="••••••••"
              @keyup.enter="onSignup"
              :style="{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box', backgroundColor: '#fff' }"
            />
          </div>
          <p
            v-if="errorMessage"
            :style="{ margin: 0, fontSize: '0.8125rem', color: '#DC2626' }"
          >{{ errorMessage }}</p>
          <button
            @click="onSignup"
            :disabled="submitting"
            :style="{ width: '100%', padding: '0.8125rem', backgroundColor: '#C8962A', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.9375rem', fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }"
          >{{ submitting ? "가입 중..." : "회원가입" }}</button>
        </div>

        <p :style="{ textAlign: 'center', fontSize: '0.875rem', color: '#6B7280' }">
          이미 계정이 있으신가요?
          <RouterLink :to="{ name: 'login' }" :style="{ color: '#C8962A', fontWeight: 500, textDecoration: 'none' }">로그인</RouterLink>
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
