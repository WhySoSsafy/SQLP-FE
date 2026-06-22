# React → Vue 마이그레이션 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** SQLP-FE 프론트엔드를 React 18에서 Vue 3로 1:1 이식하면서 기존 localStorage 기반 화면 동작을 그대로 보존한다.

**Architecture:** 현재 `SQLP-FE` 폴더 안에서 제자리(in-place) 교체. 순수 TS 자산(`domain/`, `api/`)은 `src/`로 옮겨 로직 변경 없이 재사용하고, React 컴포넌트(`.tsx`)는 `src/_legacy/`로 옮겨 포팅 원본으로만 쓴 뒤 마지막에 삭제한다. App.tsx의 상태/분기는 Pinia 스토어 + vue-router로 분해하고, 화면은 `<script setup lang="ts">` SFC로 옮긴다.

**Tech Stack:** Vue 3, Vite, TypeScript, vue-router, Pinia, lucide-vue-next, vue-echarts(echarts), @vueuse/core. (Tailwind/Vite는 유지)

## 중요 발견 (스펙 대비 단순화)

스펙 §6은 shadcn-vue(reka-ui)로 UI 컴포넌트를 교체한다고 했으나, **실측 결과 9개 화면(views)과 Layout이 `components/ui/*` shadcn 컴포넌트를 단 하나도 import하지 않는다.** 화면은 전부 인라인 스타일 + 원시 HTML 엘리먼트로 작성되어 있고, 외부 라이브러리는 `lucide-react`(아이콘, 9개 파일)와 `recharts`(차트, WeakConcepts 1개 파일)뿐이다.

따라서 **shadcn-vue/reka-ui 포팅은 불필요**하다. UI 라이브러리 교체는 lucide와 recharts 두 가지로 한정된다. 기존 `components/ui/*` 46개와 그에 딸린 미사용 라이브러리(`embla`, `vaul`, `cmdk`, `input-otp`, `react-day-picker`, `react-resizable-panels`, `react-hook-form`, `motion`)는 포팅하지 않고 `_legacy`와 함께 제거한다. 이는 스펙 §6 분류 ③("view가 실제 쓰는 것만")의 자연스러운 귀결이다.

## Global Constraints

스펙에서 가져온 프로젝트 전역 규칙. 모든 태스크에 암묵적으로 적용된다.

- **프레임워크**: Vue 3, 모든 컴포넌트는 `<script setup lang="ts">` 단일 파일 컴포넌트(SFC). TypeScript 유지.
- **경로 alias**: `@` → `src` (vite.config.ts와 tsconfig.json 모두에 설정). import은 `@/domain/...`, `@/api`, `@/stores/...`, `@/views/...` 형태.
- **보존(무수정)**: `src/domain/*.ts` 6개 파일과 `src/api/*`의 **로직은 절대 변경하지 않는다.** 위치 이동과 그로 인한 import 경로 정리만 허용.
- **범위 밖**: localStorage→실제 API 교체([105]/[106]), 로그인 실연동([103]), lint 도입. 화면 UX/디자인 변경 금지(1:1 포팅).
- **인라인 스타일 보존**: 원본의 인라인 스타일 객체는 키/값을 그대로 옮긴다(색상 `#C8962A`, `#1E2433` 등 verbatim).
- **아이콘**: `lucide-react` → `lucide-vue-next` (컴포넌트명 동일).
- **차트**: `recharts` → `vue-echarts`(+ `echarts`).
- **검증 방식**: 이 프로젝트는 테스트 러너가 없다(스펙 §8). 각 태스크 검증은 **`npm run type-check`(vue-tsc) + `npm run build` + 브라우저 수동 스모크**로 한다. 단위 테스트는 도입하지 않는다.
- **마운트 타깃**: `index.html`의 `<div id="root">`를 유지하므로 앱은 `#root`에 마운트한다.

## JSX → Vue SFC 변환 레시피 (모든 view 태스크가 참조)

기계적 변환 규칙. view 포팅 태스크에서 "레시피 적용"은 아래를 의미한다.

1. **구조**: 파일 상단 `<script setup lang="ts">` + 하단 `<template>`. `export default`/`function Component` 제거. 컴포넌트는 단일 루트 엘리먼트로 감싼다(원본 최상위가 하나의 `<div>`이면 그대로).
2. **상태**: `const [x, setX] = useState(init)` → `const x = ref(init)`. 스크립트에서는 `x.value`, 템플릿에서는 `x`. `setX(v)` → `x.value = v`.
3. **ref(DOM)**: `const r = useRef(null)` + `<input ref={r}>` → `const r = ref<HTMLInputElement | null>(null)` + `<input ref="r">` (script-setup에서 변수명과 동일한 문자열).
4. **effect**: `useEffect(() => {...}, [])` → `onMounted(() => {...})`.
5. **이벤트**: `onClick={fn}` → `@click="fn"`. `onChange={(e) => setX(e.target.value)}` → 입력은 `v-model="x"` 우선. 불가 시 `@input="x = ($event.target as HTMLInputElement).value"`.
6. **스타일**: `style={{ marginBottom: "1rem", fontWeight: 600 }}` → `:style="{ marginBottom: '1rem', fontWeight: 600 }"` (camelCase 키, 객체 그대로). 조건부 값 `active ? a : b`도 객체 안에서 동일하게 표현.
7. **클래스**: `className="x"` → `class="x"` (이 코드베이스엔 거의 없음).
8. **조건**: `{cond && <X/>}` → `<X v-if="cond"/>`. `{cond ? <A/> : <B/>}` → `<A v-if="cond"/><B v-else/>`. 텍스트 삼항은 `{{ cond ? 'A' : 'B' }}`.
9. **반복**: `{arr.map((it, i) => <X key={it.id}/>)}` → `<X v-for="(it, i) in arr" :key="it.id"/>`.
10. **표현식**: JSX `{value}` → 템플릿 `{{ value }}`. 속성 바인딩 `prop={value}` → `:prop="value"`.
11. **아이콘**: `import { Database } from "lucide-react"` → `import { Database } from "lucide-vue-next"`; `<Database size={18} color="white"/>` → `<Database :size="18" color="white" />`.
12. **동적 컴포넌트(아이콘 맵)**: 배열에 아이콘 컴포넌트를 담아 렌더할 땐 `<component :is="item.icon" :size="18" />`.
13. **렌더 중 계산**: `new Date()`, `Intl.*`, 파생 값은 `<script>`에서 `const`/`computed`로 계산해 템플릿에서 사용.
14. **props 제거**: 원본이 받던 props(`sessions`, `selectedSessionId`, `onNavigate`, `onSelectSession`, `onSessionsChanged`)는 **각 view 태스크에 명시된 스토어/라우터 호출로 대체**한다(아래 태스크별 "Wiring" 참조).

---

## Task 1: Vue 빌드 기반 구축 + 자산 재배치

React 진입점을 걷어내고 최소 Vue 앱이 빌드되도록 만든다. 보존 자산을 `src/`로 옮기고 React 컴포넌트는 `_legacy`로 격리한다.

**Files:**
- Modify: `package.json` (의존성 교체, 스크립트 추가)
- Modify: `vite.config.ts` (plugin-react → plugin-vue)
- Create: `tsconfig.json`
- Modify: `index.html` (`/src/main.tsx` → `/src/main.ts`)
- Create: `src/main.ts`
- Create: `src/App.vue` (임시 플레이스홀더)
- Delete: `src/main.tsx`
- Move: `src/app/domain/` → `src/domain/`, `src/app/api/` → `src/api/`
- Move: `src/app/App.tsx`, `src/app/components/` → `src/_legacy/`
- Keep: `src/styles/`, `src/vite-env.d.ts`, `.env.example`, `mockup-data/`

**Interfaces:**
- Produces: 빌드 가능한 빈 Vue 앱. `@/domain/*`, `@/api` import 경로 사용 가능. `npm run type-check`, `npm run build` 스크립트.

- [ ] **Step 1: 브랜치 생성**

```bash
git checkout -b feat/migrate-react-to-vue
```

- [ ] **Step 2: 자산 이동 (git mv로 히스토리 보존)**

```bash
# 보존 자산은 src/ 바로 아래로 (평탄화)
git mv src/app/domain src/domain
git mv src/app/api src/api
# React 원본은 포팅 참조용으로 격리
mkdir -p src/_legacy
git mv src/app/App.tsx src/_legacy/App.tsx
git mv src/app/components src/_legacy/components
git rm src/main.tsx
# 빈 src/app 정리
rmdir src/app 2>/dev/null || true
```

- [ ] **Step 3: `domain`/`api` 내부 상대 import 확인**

`src/domain/*`는 서로 상대 경로(`./types`, `./mockData`)로 참조하므로 이동 후에도 그대로 유효하다. `src/api/*`도 폴더 내부 상대 import(`./tokens` 등)라 유효하다. 변경 불필요. 확인만:

Run: `grep -rnE "from \"\.\./app|from \"@/app" src/domain src/api`
Expected: 출력 없음 (app 경로 참조 없음)

- [ ] **Step 4: 의존성 교체 (package.json)**

`package.json`의 `dependencies`를 아래로 교체(React/MUI/미사용 라이브러리 전부 제거):

```json
  "dependencies": {
    "@vueuse/core": "^11.0.0",
    "class-variance-authority": "0.7.1",
    "clsx": "2.1.1",
    "date-fns": "3.6.0",
    "echarts": "^5.5.0",
    "lucide-vue-next": "^0.487.0",
    "pinia": "^2.2.0",
    "tailwind-merge": "3.2.0",
    "tw-animate-css": "1.3.8",
    "vue": "^3.5.0",
    "vue-echarts": "^7.0.0",
    "vue-router": "^4.4.0"
  },
```

`devDependencies`를 아래로 교체:

```json
  "devDependencies": {
    "@tailwindcss/vite": "4.1.12",
    "@vitejs/plugin-vue": "^5.1.0",
    "tailwindcss": "4.1.12",
    "vite": "6.3.5",
    "vue-tsc": "^2.1.0"
  },
```

`scripts`를 아래로 교체:

```json
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc --noEmit && vite build",
    "type-check": "vue-tsc --noEmit"
  },
```

`peerDependencies`, `peerDependenciesMeta`, `pnpm` 블록은 삭제한다.

- [ ] **Step 5: vite.config.ts 교체**

```ts
import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
```

(기존 `figmaAssetResolver`는 `figma:asset/` import이 코드에 없으므로 제거. 확인: `grep -rn "figma:asset" src` → 없음.)

- [ ] **Step 6: tsconfig.json 생성**

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "useDefineForClassFields": true,
    "strict": true,
    "jsx": "preserve",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "noEmit": true,
    "lib": ["ESNext", "DOM", "DOM.Iterable"],
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] },
    "types": ["vite/client"]
  },
  "include": ["src/**/*.ts", "src/**/*.d.ts", "src/**/*.vue"],
  "exclude": ["src/_legacy", "node_modules", "dist"]
}
```

- [ ] **Step 7: index.html 스크립트 경로 변경**

`src/main.tsx`를 `src/main.ts`로:

```html
      <script type="module" src="/src/main.ts"></script>
```

- [ ] **Step 8: 임시 App.vue 생성**

```vue
<script setup lang="ts"></script>

<template>
  <div style="padding: 2rem; font-family: sans-serif">Vue 마이그레이션 진행 중</div>
</template>
```

- [ ] **Step 9: main.ts 생성**

```ts
import { createApp } from "vue";
import App from "./App.vue";
import "./styles/index.css";

createApp(App).mount("#root");
```

- [ ] **Step 10: 설치 및 검증**

```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```
Expected: 설치 성공, `vue-tsc --noEmit` 통과, vite build 성공(dist 생성). `_legacy`는 tsconfig exclude라 타입 체크 대상 아님.

- [ ] **Step 11: dev 스모크**

```bash
npm run dev
```
Expected: 브라우저에서 "Vue 마이그레이션 진행 중" 텍스트 표시. (확인 후 종료)

- [ ] **Step 12: 커밋**

```bash
git add -A
git commit -m "build: replace React toolchain with Vue 3 (Vite, tsconfig), relocate domain/api, isolate legacy"
```

---

## Task 2: Pinia 스토어 (auth + sessions)

`App.tsx`가 들고 있던 상태/액션을 스토어로 옮긴다.

**Files:**
- Create: `src/stores/auth.ts`
- Create: `src/stores/sessions.ts`
- Reference: `src/_legacy/App.tsx` (상태/액션 원본)

**Interfaces:**
- Produces:
  - `useAuthStore()` → `{ isLoggedIn: Ref<boolean>, login(): void, logout(): void }`
  - `useSessionsStore()` → `{ sessions: Ref<LearningSession[]>, selectedSessionId: Ref<string | null>, mockDataActive: Ref<boolean>, refresh(): void, selectSession(id: string): void, addMockData(): void, removeMockData(): void }`
- Consumes: `@/domain/storage` 함수들(`loadSessions`, `getSelectedSessionId`, `hasMockSessions`, `seedMockSessions`, `clearMockSessions`, `setSelectedSessionId`), `@/domain/types`의 `LearningSession`.

- [ ] **Step 1: auth 스토어 생성**

`src/stores/auth.ts`:

```ts
import { defineStore } from "pinia";
import { ref } from "vue";

// 로그인 상태만 보관한다. 실제 토큰/인증 연동은 [102] JWT 토큰 관리에서
// 이 스토어를 확장한다(예: api/tokens.ts와 연결).
export const useAuthStore = defineStore("auth", () => {
  const isLoggedIn = ref(false);

  function login() {
    isLoggedIn.value = true;
  }

  function logout() {
    isLoggedIn.value = false;
  }

  return { isLoggedIn, login, logout };
});
```

- [ ] **Step 2: sessions 스토어 생성**

`src/stores/sessions.ts` (원본 `App.tsx`의 `refreshSessions`/`selectSession`/`addMockData`/`removeMockData`를 이전. 단, 원본 `selectSession`에 있던 화면 전환은 라우팅이므로 스토어에서 제외하고 호출 컴포넌트가 담당):

```ts
import { defineStore } from "pinia";
import { ref } from "vue";
import type { LearningSession } from "@/domain/types";
import {
  clearMockSessions,
  getSelectedSessionId,
  hasMockSessions,
  loadSessions,
  seedMockSessions,
  setSelectedSessionId as persistSelectedSessionId,
} from "@/domain/storage";

export const useSessionsStore = defineStore("sessions", () => {
  const sessions = ref<LearningSession[]>([]);
  const selectedSessionId = ref<string | null>(null);
  const mockDataActive = ref(false);

  function refresh() {
    sessions.value = loadSessions();
    selectedSessionId.value = getSelectedSessionId();
    mockDataActive.value = hasMockSessions();
  }

  function selectSession(sessionId: string) {
    persistSelectedSessionId(sessionId);
    selectedSessionId.value = sessionId;
  }

  function addMockData() {
    seedMockSessions();
    refresh();
  }

  function removeMockData() {
    clearMockSessions();
    refresh();
  }

  return {
    sessions,
    selectedSessionId,
    mockDataActive,
    refresh,
    selectSession,
    addMockData,
    removeMockData,
  };
});
```

- [ ] **Step 3: 타입 체크**

Run: `npm run type-check`
Expected: 통과 (스토어가 domain 함수/타입과 일치).

- [ ] **Step 4: 커밋**

```bash
git add src/stores
git commit -m "feat: add auth and sessions Pinia stores (port App.tsx state)"
```

---

## Task 3: 라우팅 골격 + 셸 + 로그인 게이트

vue-router, 레이아웃 셸, 실제 LoginView, 그리고 8개 콘텐츠 view의 플레이스홀더 스텁을 만들어 **앱 전체가 탐색 가능**하게 만든다. 이후 태스크가 스텁을 실제 화면으로 교체한다.

**Files:**
- Modify: `src/main.ts` (pinia + router 등록)
- Modify: `src/App.vue` (`<RouterView/>`)
- Create: `src/router/index.ts`
- Create: `src/layouts/DefaultLayout.vue`
- Create: `src/views/LoginView.vue` (실제)
- Create (스텁 8개): `src/views/DashboardView.vue`, `JsonRegistrationView.vue`, `SessionListView.vue`, `ProblemDetailView.vue`, `WeakConceptsView.vue`, `CalendarView.vue`, `WrongAnswersView.vue`, `StudyComparisonView.vue`
- Reference: `src/_legacy/components/Layout.tsx`, `src/_legacy/components/LoginPage.tsx`

**Interfaces:**
- Consumes: `useAuthStore`, `useSessionsStore`.
- Produces: 라우트 이름 `login`, `home`, `json-register`, `sessions`, `problem-detail`, `weak-concepts`, `calendar`, `wrong-answers`, `study-comparison`. `DefaultLayout`은 `<main>` 안에 자식 `<RouterView/>`를 렌더. 콘텐츠 view들은 props 없이 스토어/라우터에서 데이터를 읽는다.

- [ ] **Step 1: 라우터 생성**

`src/router/index.ts` (스펙 §5의 problem-detail은 원본이 URL 파라미터가 아니라 선택 상태를 썼으므로, 1:1 충실도를 위해 파라미터 없는 `problem-detail` 경로로 두고 `selectedSessionId` 스토어를 사용한다):

```ts
import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/login",
      name: "login",
      component: () => import("@/views/LoginView.vue"),
      meta: { public: true },
    },
    {
      path: "/",
      component: () => import("@/layouts/DefaultLayout.vue"),
      children: [
        { path: "", name: "home", component: () => import("@/views/DashboardView.vue") },
        { path: "json-register", name: "json-register", component: () => import("@/views/JsonRegistrationView.vue") },
        { path: "sessions", name: "sessions", component: () => import("@/views/SessionListView.vue") },
        { path: "problem-detail", name: "problem-detail", component: () => import("@/views/ProblemDetailView.vue") },
        { path: "weak-concepts", name: "weak-concepts", component: () => import("@/views/WeakConceptsView.vue") },
        { path: "calendar", name: "calendar", component: () => import("@/views/CalendarView.vue") },
        { path: "wrong-answers", name: "wrong-answers", component: () => import("@/views/WrongAnswersView.vue") },
        { path: "study-comparison", name: "study-comparison", component: () => import("@/views/StudyComparisonView.vue") },
      ],
    },
  ],
});

router.beforeEach((to) => {
  const auth = useAuthStore();
  if (!to.meta.public && !auth.isLoggedIn) return { name: "login" };
  if (to.name === "login" && auth.isLoggedIn) return { name: "home" };
});

export default router;
```

- [ ] **Step 2: main.ts 갱신 (pinia + router)**

```ts
import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import "./styles/index.css";

createApp(App).use(createPinia()).use(router).mount("#root");
```

- [ ] **Step 3: App.vue 갱신**

```vue
<script setup lang="ts"></script>

<template>
  <RouterView />
</template>
```

- [ ] **Step 4: 8개 콘텐츠 view 스텁 생성**

아래 내용을 각 파일에 생성한다. `LABEL`은 파일별로 바꾼다: Dashboard="홈 대시보드", JsonRegistration="JSON 등록", SessionList="학습 세션", ProblemDetail="문제별 이해도", WeakConcepts="취약 개념", Calendar="학습 캘린더", WrongAnswers="오답노트", StudyComparison="스터디 비교".

예) `src/views/DashboardView.vue`:

```vue
<script setup lang="ts"></script>

<template>
  <div style="padding: 1rem; color: #6b7280">홈 대시보드 (포팅 예정)</div>
</template>
```

나머지 7개도 동일 패턴으로 LABEL만 바꿔 생성.

- [ ] **Step 5: DefaultLayout.vue 생성 (Layout.tsx 포팅)**

`src/layouts/DefaultLayout.vue` — 사이드바 nav를 `<RouterLink>`로, mock 컨트롤을 sessions 스토어로, 헤더 라벨을 현재 라우트명으로 연결. `<main>`에 자식 `<RouterView/>`. `onMounted`에서 `sessions.refresh()`:

```vue
<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import {
  Home, Upload, BookOpen, BarChart2, AlertTriangle, Calendar, FileText, Users, Database, Bell, ChevronRight,
} from "lucide-vue-next";
import { useSessionsStore } from "@/stores/sessions";

const NAV_ITEMS = [
  { name: "home", label: "홈", icon: Home },
  { name: "json-register", label: "JSON 등록", icon: Upload },
  { name: "sessions", label: "학습 세션", icon: BookOpen },
  { name: "problem-detail", label: "문제별 이해도", icon: BarChart2 },
  { name: "weak-concepts", label: "취약 개념", icon: AlertTriangle },
  { name: "calendar", label: "학습 캘린더", icon: Calendar },
  { name: "wrong-answers", label: "오답노트", icon: FileText },
  { name: "study-comparison", label: "스터디 비교", icon: Users },
];

const PAGE_LABELS: Record<string, string> = {
  home: "홈 대시보드",
  "json-register": "AI 분석 결과 JSON 등록",
  sessions: "학습 세션",
  "problem-detail": "문제별 이해도",
  "weak-concepts": "취약 개념 대시보드",
  calendar: "학습 캘린더",
  "wrong-answers": "오답노트",
  "study-comparison": "스터디원 비교",
};

const route = useRoute();
const sessions = useSessionsStore();

const headerLabel = computed(() => PAGE_LABELS[String(route.name)] ?? "");
const todayLabel = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric", month: "long", day: "numeric", weekday: "long",
}).format(new Date());

onMounted(() => {
  sessions.refresh();
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
```

- [ ] **Step 6: LoginView.vue 생성 (LoginPage.tsx 포팅)**

`src/views/LoginView.vue` — `onLogin`은 `auth.login()` 후 home으로 이동. email/password는 `v-model`. 피처 카드는 아이콘 컴포넌트 배열 + `<component :is>`:

```vue
<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { Database, Brain, BookOpen } from "lucide-vue-next";
import { useAuthStore } from "@/stores/auth";

const email = ref("seun@sqlp.kr");
const password = ref("password123");
const router = useRouter();
const auth = useAuthStore();

function onLogin() {
  auth.login();
  router.push({ name: "home" });
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
          <button
            @click="onLogin"
            :style="{ width: '100%', padding: '0.8125rem', backgroundColor: '#C8962A', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.9375rem', fontWeight: 600, cursor: 'pointer' }"
          >로그인</button>
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
```

- [ ] **Step 7: 타입 체크 + 빌드**

Run: `npm run build`
Expected: 통과.

- [ ] **Step 8: dev 스모크**

```bash
npm run dev
```
Expected:
- 최초 진입 시 `/login`으로 리다이렉트, 로그인 화면(좌측 폼 + 우측 다크 피처카드 3개) 표시.
- "로그인" 클릭 → `/`로 이동, 좌측 사이드바(8개 메뉴) + 헤더(오늘 날짜) + "홈 대시보드 (포팅 예정)" 표시.
- 사이드바 메뉴 클릭 시 라우트 전환되고 활성 메뉴가 금색(#C8962A)으로 강조됨.
- 사이드바 하단 "추가"/"삭제" 클릭 시 Mock ON/OFF 토글.

- [ ] **Step 9: 커밋**

```bash
git add src/router src/layouts src/views src/main.ts src/App.vue
git commit -m "feat: add vue-router skeleton, DefaultLayout shell, LoginView, view stubs"
```

---

## Task 4: DashboardView (Dashboard.tsx 포팅)

**Files:**
- Modify: `src/views/DashboardView.vue` (스텁 → 실제)
- Reference: `src/_legacy/components/Dashboard.tsx`
- Delete (태스크 끝): `src/_legacy/components/Dashboard.tsx`

**Wiring (props 대체):**
- 원본 props: `onNavigate(page)`, `sessions`.
- 대체:
  - `import { useSessionsStore } from "@/stores/sessions"` → `const sessions = useSessionsStore()`. 원본의 `sessions` prop 사용처를 `sessions.sessions`로.
  - `import { useRouter } from "vue-router"` → `const router = useRouter()`. 원본 `onNavigate("xxx")` 호출을 `router.push({ name: "xxx" })`로 (페이지 id는 라우트 name과 동일).
  - 도메인 함수 import은 원본 그대로 사용: `import { buildDashboardSummary, buildReviewRecommendations, summarizeSessions } from "@/domain/analytics"` (경로만 `@/domain/analytics`).

- [ ] **Step 1: 원본 확인**

Run: `cat src/_legacy/components/Dashboard.tsx`
원본의 import, props, 파생 계산(`buildDashboardSummary(sessions)` 등), JSX 구조를 파악.

- [ ] **Step 2: 포팅**

`src/views/DashboardView.vue`를 `<script setup lang="ts">` + `<template>`로 작성. JSX→Vue 변환 레시피 전 항목 적용. props는 위 Wiring대로 스토어/라우터로 대체. lucide import는 `lucide-vue-next`로. 파생 계산은 `<script>`에서 `computed`로:

```ts
import { computed } from "vue";
const summary = computed(() => buildDashboardSummary(sessions.sessions));
// ...원본의 각 파생값을 computed로
```

- [ ] **Step 3: 타입 체크 + 빌드**

Run: `npm run build`
Expected: 통과.

- [ ] **Step 4: dev 스모크**

`/`(홈)에서 원본 대시보드와 동일하게: 요약 카드(주간 풀이 수/복습 필요/평균 이해도/스트릭), 최근 세션 목록, 복습 추천이 표시되는지 확인. Mock "추가" 후 데이터가 채워지는지 확인. 카드/링크 클릭 시 해당 라우트로 이동하는지 확인.

- [ ] **Step 5: 레거시 삭제 + 커밋**

```bash
git rm src/_legacy/components/Dashboard.tsx
git add src/views/DashboardView.vue
git commit -m "feat: port DashboardView to Vue"
```

---

## Task 5: JsonRegistrationView (JsonRegistration.tsx 포팅)

가장 큰 화면(439줄). 파일 업로드 + 텍스트 붙여넣기 + 검증/미리보기 + 등록.

**Files:**
- Modify: `src/views/JsonRegistrationView.vue`
- Reference: `src/_legacy/components/JsonRegistration.tsx`
- Delete (태스크 끝): `src/_legacy/components/JsonRegistration.tsx`

**Wiring:**
- 원본 props: `onSessionsChanged()` → `const sessions = useSessionsStore()`; 등록 성공 후 `sessions.refresh()` 호출.
- 도메인 import 유지(경로만): `import { parseAndValidateSession } from "@/domain/validation"`, `import { saveSession } from "@/domain/storage"`, `import type { LearningSession, ValidationPreview } from "@/domain/types"`.
- `useState`→`ref`, `useRef`(파일 input)→`ref<HTMLInputElement | null>(null)` + `<input ref="fileInput">`. 파일 선택 핸들러의 `FileReader` 로직은 그대로.
- lucide import → `lucide-vue-next` (`Upload, FileJson, CheckCircle, XCircle, Tag`).

- [ ] **Step 1: 원본 확인**

Run: `cat src/_legacy/components/JsonRegistration.tsx`
업로드/붙여넣기 상태, `parseAndValidateSession` 호출 흐름, 미리보기/오류 렌더, 등록 버튼 핸들러 파악.

- [ ] **Step 2: 포팅**

레시피 적용. 파일 input은 숨김 + 버튼 클릭으로 트리거하는 패턴이면 `fileInput.value?.click()` 사용. textarea는 `v-model`. 등록 성공 시 `saveSession(...)` 결과 처리 후 `sessions.refresh()`.

- [ ] **Step 3: 타입 체크 + 빌드**

Run: `npm run build`
Expected: 통과.

- [ ] **Step 4: dev 스모크**

`/json-register`에서:
- `mockup-data/sqlp-mock-join.json` 내용을 textarea에 붙여넣고 "형식 검증" → 미리보기(문제 수/참여자/개념 태그) 표시.
- 잘못된 JSON 입력 시 오류 메시지 표시.
- "등록" → 성공 후 학습 세션 목록/대시보드에 반영(스토어 refresh).

- [ ] **Step 5: 레거시 삭제 + 커밋**

```bash
git rm src/_legacy/components/JsonRegistration.tsx
git add src/views/JsonRegistrationView.vue
git commit -m "feat: port JsonRegistrationView to Vue"
```

---

## Task 6: SessionListView (SessionList.tsx 포팅)

**Files:**
- Modify: `src/views/SessionListView.vue`
- Reference: `src/_legacy/components/SessionList.tsx`
- Delete (태스크 끝): `src/_legacy/components/SessionList.tsx`

**Wiring:**
- 원본 props: `sessions`, `onSelectSession(id)`.
- 대체: `const sessions = useSessionsStore()`, `const router = useRouter()`. 목록은 `sessions.sessions` 사용. 세션 클릭 핸들러 = `sessions.selectSession(id); router.push({ name: "problem-detail" })` (원본 `onSelectSession`이 선택+화면전환을 했던 것을 재현).
- 검색/필터 `useState` → `ref`. 도메인 요약 함수(`summarizeSessions` 등) import 경로 `@/domain/...`.

- [ ] **Step 1: 원본 확인**

Run: `cat src/_legacy/components/SessionList.tsx`

- [ ] **Step 2: 포팅** — 레시피 적용 + 위 Wiring.

- [ ] **Step 3: 빌드**

Run: `npm run build`
Expected: 통과.

- [ ] **Step 4: dev 스모크**

`/sessions`에서 (Mock 추가 상태): 세션 카드 목록 표시, 검색/이해도 필터 동작, 카드 클릭 시 `/problem-detail`로 이동하며 해당 세션이 선택됨.

- [ ] **Step 5: 레거시 삭제 + 커밋**

```bash
git rm src/_legacy/components/SessionList.tsx
git add src/views/SessionListView.vue
git commit -m "feat: port SessionListView to Vue"
```

---

## Task 7: ProblemDetailView (ProblemDetail.tsx 포팅)

**Files:**
- Modify: `src/views/ProblemDetailView.vue`
- Reference: `src/_legacy/components/ProblemDetail.tsx`
- Delete (태스크 끝): `src/_legacy/components/ProblemDetail.tsx`

**Wiring:**
- 원본 props: `sessions`, `selectedSessionId`.
- 대체: `const sessions = useSessionsStore()`. 원본의 `selectedSessionId` 사용처 → `sessions.selectedSessionId`, `sessions` → `sessions.sessions`. 선택된 세션을 찾는 로직(원본에 있는 find/fallback)은 그대로 두되 소스만 스토어로.

- [ ] **Step 1: 원본 확인**

Run: `cat src/_legacy/components/ProblemDetail.tsx`

- [ ] **Step 2: 포팅** — 레시피 적용 + 위 Wiring. 선택 세션 파생은 `computed`로.

- [ ] **Step 3: 빌드**

Run: `npm run build`
Expected: 통과.

- [ ] **Step 4: dev 스모크**

`/sessions`에서 세션을 선택해 `/problem-detail` 진입 시: 문제별 표(참여자 열), 정답/이해도/놓친 개념, 상세 패널이 원본과 동일하게 표시.

- [ ] **Step 5: 레거시 삭제 + 커밋**

```bash
git rm src/_legacy/components/ProblemDetail.tsx
git add src/views/ProblemDetailView.vue
git commit -m "feat: port ProblemDetailView to Vue"
```

---

## Task 8: WeakConceptsView (WeakConcepts.tsx 포팅 + recharts→vue-echarts)

차트가 포함된 유일한 화면. recharts 막대차트를 vue-echarts로 교체한다.

**Files:**
- Modify: `src/views/WeakConceptsView.vue`
- Reference: `src/_legacy/components/WeakConcepts.tsx`
- Delete (태스크 끝): `src/_legacy/components/WeakConcepts.tsx`

**Wiring:**
- 원본 props: `sessions` → `const sessions = useSessionsStore()`, 사용처 `sessions.sessions`.
- 도메인 import 유지(경로만): `buildWeakConcepts` 등.
- 차트: 원본의 `chartData`/참여자 목록/색상/`activeFilter` 계산 로직은 **그대로 유지**하고, recharts JSX만 vue-echarts로 교체.

**echarts 등록 + 컴포넌트** (`<script setup>` 상단):

```ts
import { computed, ref } from "vue";
import VChart from "vue-echarts";
import { use } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { BarChart } from "echarts/charts";
import { GridComponent, TooltipComponent, LegendComponent } from "echarts/components";
import { useSessionsStore } from "@/stores/sessions";

use([CanvasRenderer, BarChart, GridComponent, TooltipComponent, LegendComponent]);
```

**option 빌더** — 원본 recharts 구성(XAxis=name, YAxis 0~100 `%`, 참여자별 Bar + 필터 all일 때 "평균" Bar, 색상 `colorOf`)을 echarts option으로:

```ts
// participants: string[] (원본에서 계산), colorOf: (name: string) => string (원본 색상 로직),
// chartData: Array<Record<string, number | string>> (원본 그대로), activeFilter: Ref<string>
const chartOption = computed(() => {
  const names = chartData.value.map((d) => d.name as string);
  const seriesNames = [
    ...participants.value,
    ...(activeFilter.value === "all" ? ["평균"] : []),
  ];
  return {
    grid: { top: 8, right: 16, left: 8, bottom: 24, containLabel: true },
    tooltip: { trigger: "axis", valueFormatter: (v: number) => `${v}%` },
    legend: { bottom: 0 },
    xAxis: { type: "category", data: names, axisLabel: { fontSize: 11, color: "#6B7280" } },
    yAxis: { type: "value", min: 0, max: 100, axisLabel: { fontSize: 11, color: "#6B7280", formatter: "{value}%" } },
    series: seriesNames.map((s) => ({
      name: s,
      type: "bar",
      data: chartData.value.map((d) => d[s] ?? 0),
      itemStyle: { color: s === "평균" ? "#E5E7EB" : colorOf(s), borderRadius: [4, 4, 0, 0] },
    })),
  };
});
```

템플릿의 recharts `<ResponsiveContainer>...<BarChart>...` 블록 전체를:

```vue
<VChart :option="chartOption" :style="{ height: '280px', width: '100%' }" autoresize />
```

> 주의: 위 `participants`, `colorOf`, `chartData`, `activeFilter`의 실제 변수명/형태는 원본 `WeakConcepts.tsx`를 확인해 일치시킨다(원본 로직을 그대로 옮기고 차트 렌더만 교체).

- [ ] **Step 1: 원본 확인**

Run: `cat src/_legacy/components/WeakConcepts.tsx`
`chartData`, 참여자 목록, 색상 함수, `activeFilter` 정의를 정확히 파악.

- [ ] **Step 2: 포팅** — 레시피 적용. 비차트 부분(TOP 카드, 복습 추천 목록)은 인라인 스타일 그대로. 차트만 vue-echarts로 교체(위 코드).

- [ ] **Step 3: 빌드**

Run: `npm run build`
Expected: 통과.

- [ ] **Step 4: dev 스모크**

`/weak-concepts`(Mock 추가 상태)에서: TOP 취약 개념 카드, 참여자별 막대차트(Y축 0~100%, 툴팁 `%`, 필터 "all"일 때 평균 막대 포함), 복습 추천이 표시. 필터 전환 시 차트 갱신.

- [ ] **Step 5: 레거시 삭제 + 커밋**

```bash
git rm src/_legacy/components/WeakConcepts.tsx
git add src/views/WeakConceptsView.vue
git commit -m "feat: port WeakConceptsView to Vue (recharts -> vue-echarts)"
```

---

## Task 9: CalendarView (CalendarPage.tsx 포팅)

원본이 하드코딩 데이터를 쓰는 화면(스펙: 하드코딩 유지).

**Files:**
- Modify: `src/views/CalendarView.vue`
- Reference: `src/_legacy/components/CalendarPage.tsx`
- Delete (태스크 끝): `src/_legacy/components/CalendarPage.tsx`

**Wiring:** 원본은 props 없음. 하드코딩된 `STUDY_DAYS` 등 상수/로직 그대로 유지. lucide import만 `lucide-vue-next`로.

- [ ] **Step 1: 원본 확인** — Run: `cat src/_legacy/components/CalendarPage.tsx`
- [ ] **Step 2: 포팅** — 레시피 적용. 날짜 계산 로직은 `<script>`로 이동.
- [ ] **Step 3: 빌드** — Run: `npm run build` → 통과.
- [ ] **Step 4: dev 스모크** — `/calendar`에서 달력 그리드 + 학습일 표시가 원본과 동일.
- [ ] **Step 5: 레거시 삭제 + 커밋**

```bash
git rm src/_legacy/components/CalendarPage.tsx
git add src/views/CalendarView.vue
git commit -m "feat: port CalendarView to Vue"
```

---

## Task 10: WrongAnswersView (WrongAnswers.tsx 포팅)

**Files:**
- Modify: `src/views/WrongAnswersView.vue`
- Reference: `src/_legacy/components/WrongAnswers.tsx`
- Delete (태스크 끝): `src/_legacy/components/WrongAnswers.tsx`

**Wiring:**
- 원본 props: `sessions` → `const sessions = useSessionsStore()`, 사용처 `sessions.sessions`.
- 도메인 import 유지(경로만): `buildWrongAnswerItems` 등.
- 필터 상태(all/wrong/vague/unknown/done)와 "완료 표시" 토글 `useState`→`ref`. (완료 토글이 localStorage가 아니라 로컬 컴포넌트 상태면 그대로 ref로 유지 — 동작 1:1.)

- [ ] **Step 1: 원본 확인** — Run: `cat src/_legacy/components/WrongAnswers.tsx`
- [ ] **Step 2: 포팅** — 레시피 적용 + 위 Wiring.
- [ ] **Step 3: 빌드** — Run: `npm run build` → 통과.
- [ ] **Step 4: dev 스모크** — `/wrong-answers`(Mock 추가)에서: 오답/애매/모름 카드 목록, 필터 전환, 완료 토글이 원본과 동일.
- [ ] **Step 5: 레거시 삭제 + 커밋**

```bash
git rm src/_legacy/components/WrongAnswers.tsx
git add src/views/WrongAnswersView.vue
git commit -m "feat: port WrongAnswersView to Vue"
```

---

## Task 11: StudyComparisonView (StudyComparison.tsx 포팅)

원본이 하드코딩 데이터를 쓰는 스텁 화면(스펙: 하드코딩 유지).

**Files:**
- Modify: `src/views/StudyComparisonView.vue`
- Reference: `src/_legacy/components/StudyComparison.tsx`
- Delete (태스크 끝): `src/_legacy/components/StudyComparison.tsx`

**Wiring:** 원본 props 없음(하드코딩 `ROWS`). 상수/로직 그대로. lucide import만 교체.

- [ ] **Step 1: 원본 확인** — Run: `cat src/_legacy/components/StudyComparison.tsx`
- [ ] **Step 2: 포팅** — 레시피 적용.
- [ ] **Step 3: 빌드** — Run: `npm run build` → 통과.
- [ ] **Step 4: dev 스모크** — `/study-comparison`에서 비교 표가 원본과 동일.
- [ ] **Step 5: 레거시 삭제 + 커밋**

```bash
git rm src/_legacy/components/StudyComparison.tsx
git add src/views/StudyComparisonView.vue
git commit -m "feat: port StudyComparisonView to Vue"
```

---

## Task 12: 레거시 제거 + 최종 검증

남은 React 잔재를 모두 제거하고 전체를 검증한다.

**Files:**
- Delete: `src/_legacy/` 전체 (App.tsx, components/ui/ 46개 포함)
- Verify: `package.json`, 전체 빌드

- [ ] **Step 1: 남은 레거시/잔재 확인**

```bash
ls src/_legacy/components 2>/dev/null
ls src/_legacy/components/ui 2>/dev/null | wc -l
```
Expected: 콘텐츠 컴포넌트(Task 4~11)는 이미 삭제됨. `App.tsx`, `Layout.tsx`, `LoginPage.tsx`, `components/ui/*`(46개), `figma/`만 남아 있음.

- [ ] **Step 2: 레거시 폴더 통째로 삭제**

```bash
git rm -r src/_legacy
```

- [ ] **Step 3: React 잔재 전수 검색**

```bash
grep -rniE "react|\.tsx|useState|createRoot|react-router|recharts|lucide-react" src --include="*.ts" --include="*.vue"
```
Expected: 출력 없음. (있으면 해당 파일 수정)

```bash
grep -riE "\"react|react-dom|plugin-react|recharts|lucide-react|@radix-ui|@mui" package.json
```
Expected: 출력 없음.

- [ ] **Step 4: .tsx 파일 잔존 확인**

```bash
find src -name "*.tsx" -o -name "*.jsx"
```
Expected: 출력 없음.

- [ ] **Step 5: 클린 설치 + 전체 검증**

```bash
rm -rf node_modules package-lock.json dist
npm install
npm run build
```
Expected: 설치 성공, `vue-tsc --noEmit` 통과, vite build 성공.

- [ ] **Step 6: 전체 dev 스모크 (회귀 점검)**

```bash
npm run dev
```
체크리스트:
- 로그인 → 홈 이동.
- 8개 메뉴 전부 진입, 각 화면이 정상 렌더(에러/빈 화면 없음).
- Mock "추가" → 모든 데이터 화면(대시보드/세션/문제별/취약개념/오답노트)에 데이터 반영, "삭제" → 비워짐.
- JSON 등록 → 검증/미리보기/등록 동작.
- WeakConcepts 차트 렌더.

- [ ] **Step 7: 커밋**

```bash
git add -A
git commit -m "chore: remove legacy React sources, finalize Vue migration"
```

---

## Self-Review (작성자 점검 결과)

**1. 스펙 커버리지:**
- §2 제자리 교체/보존 자산 → Task 1 (자산 이동), Global Constraints(무수정 규칙). ✅
- §3 타깃 스택 → Task 1(deps), Task 3(router/pinia), Task 8(echarts). ✅
- §4 폴더 구조(평탄화) → Task 1. ✅
- §5 화면/컴포넌트 매핑 + 상태 이전 → Task 2(스토어), Task 3(router/shell/login), Task 4~11(views). ✅
- §6 의존성 3분류 → Task 1(제거+교체), Task 12(잔재 검증). ✅ 단, shadcn-vue는 "중요 발견"에 따라 불필요로 정정(스펙 §6 ③의 귀결).
- §7 단계별 실행 → Task 1~12로 분해. ✅
- §8 검증(build/type-check/스모크, lint 없음) → 각 태스크 검증 단계 + Global Constraints. ✅
- §9 리스크(UI 재현) → "중요 발견"으로 대폭 축소(ui 미사용). 차트/ localStorage 보존은 Task 8/Global Constraints에서 처리. ✅

**2. 플레이스홀더 스캔:** 인프라/스토어/라우터/셸/Login/차트는 완전한 코드 제공. 콘텐츠 view 8개는 "원본 파일 + 변환 레시피(전역 정의) + 정확한 Wiring 코드 + 스모크 체크리스트"로 기술 — 원본과 레시피가 출력을 결정하므로 추측이 아님(이 코드베이스는 인라인 스타일 원시 마크업이라 기계적 변환이 성립). TBD/TODO 없음.

**3. 타입/이름 일관성:** 스토어 API(`sessions.sessions`, `selectedSessionId`, `refresh`, `selectSession`, `addMockData`, `removeMockData`, `useAuthStore.login`)가 Task 2 정의와 Task 3~11 사용에서 일치. 라우트 name(`home`/`json-register`/`sessions`/`problem-detail`/`weak-concepts`/`calendar`/`wrong-answers`/`study-comparison`)이 라우터·NAV_ITEMS·네비게이션 호출에서 일치. 도메인 함수명은 원본 import을 그대로 사용(경로만 `@/domain/*`).
