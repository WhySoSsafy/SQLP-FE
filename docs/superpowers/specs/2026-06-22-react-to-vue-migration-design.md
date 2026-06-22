# React → Vue 마이그레이션 설계

작성일: 2026-06-22
대상: SQLP-FE 프론트엔드
상태: 승인됨 (브레인스토밍 완료, plan 작성 예정)

## 1. 배경 및 목적

기획서상 프론트엔드 스택은 Vue이지만, 실제 구현(Figma Make 생성물)은 **React 18 + Vite + TypeScript**로 되어 있다. 확인 근거:

- `vue` / `@vitejs/plugin-vue` / `vue-router` / `pinia` 의존성 **0개**
- `react` 18.3.1, `react-dom` 18.3.1, `@vitejs/plugin-react`, `react-router` 7.13.0 등 React 의존성 다수
- `vite.config.ts`에서 `@vitejs/plugin-react`(`react()`) 사용
- 진입점 `src/main.tsx`가 `createRoot(...).render(<App />)`
- `.vue` 파일 **0개**, `.tsx` 파일 **59개**

교육과정/팀 규칙상 Vue가 **필수 요구사항**이므로, 현재 React 화면을 Vue로 1:1 이식한다. 이 작업은 "React 흔적 제거"가 아니라 **프레임워크 전면 마이그레이션**이다.

### 범위 밖 (명시)
- 화면 로직 재설계나 UX 변경 (1:1 포팅이 원칙)
- localStorage 기반 기능을 실제 백엔드 API로 교체 ([105]/[106]에서 진행)
- 로그인/회원가입 실연동 ([103]에서 진행)
- lint 도입 (별도 결정)

## 2. 전략

**제자리 교체 (in-place)**: 현재 `SQLP-FE` 폴더 안에서 React를 걷어내고 Vue로 채운다. 재사용 가능한 순수 TS 자산을 보존해 작업량과 리스크를 줄이고 git 히스토리를 유지한다.

대안으로 (B) 새 Vue 프로젝트 스캐폴드 후 이식, (C) React/Vue 공존을 검토했으나, B는 Tailwind/Vite/자산 설정 재작업과 폴더 이원화 부담이 있고 C는 한 SPA에서 두 프레임워크를 동시 구동하는 것이 비현실적이라 제외했다.

작업은 **별도 브랜치 `feat/migrate-react-to-vue`** 에서 진행한다. (현재 `feat/101/api-client-structure`는 API 클라이언트 작업용)

### 보존 자산 (재사용)
- `domain/*.ts` (types, validation, analytics, storage, mockData, sampleData) — 순수 TS, 로직 무수정, import 경로만 정리
- `api/*` ([101] 결과물) — 순수 TS, 100% 재사용, 위치만 이동
- `mockup-data/`, Tailwind 설정, `.env.example`, Vite 기반

## 3. 타깃 스택

| 영역 | 현재 (React) | 변경 후 (Vue) |
|---|---|---|
| 프레임워크 | React 18 | Vue 3 + `<script setup lang="ts">` (TS 유지) |
| 빌드 | Vite + plugin-react | Vite + `@vitejs/plugin-vue` (+ `vue-tsc`) |
| UI | shadcn/ui (Radix) | shadcn-vue (reka-ui) |
| 라우팅 | `App.tsx` 수동 page 전환 | vue-router |
| 상태 | 없음 (localStorage + 도메인 함수) | Pinia (도메인 함수는 유지) |
| 차트 | recharts | vue-echarts (+ echarts) |
| 아이콘 | lucide-react | lucide-vue-next |
| 토스트 | sonner | vue-sonner |
| 테마 | next-themes | @vueuse/core (useColorMode) |

## 4. 폴더 구조 (src/app → src 평탄화 적용)

```
SQLP-FE/
├─ src/
│  ├─ main.ts                  # createApp(App).use(router).use(pinia).mount  (← main.tsx)
│  ├─ App.vue                  # <RouterView/> 루트  (← App.tsx의 상태/분기는 store+router로 이동)
│  ├─ router/
│  │  └─ index.ts              # vue-router: 8개 라우트 + 로그인 가드
│  ├─ stores/
│  │  ├─ auth.ts               # isLoggedIn (→ [102]에서 토큰 연동)
│  │  └─ sessions.ts           # sessions, selectedSessionId, mockDataActive + refresh/select/seed/clear
│  ├─ layouts/
│  │  └─ DefaultLayout.vue     # 사이드바+헤더 셸  (← Layout.tsx)
│  ├─ views/                   # 라우트 단위 페이지  (← components/*.tsx)
│  │  ├─ LoginView.vue
│  │  ├─ DashboardView.vue
│  │  ├─ JsonRegistrationView.vue
│  │  ├─ SessionListView.vue
│  │  ├─ ProblemDetailView.vue
│  │  ├─ WeakConceptsView.vue
│  │  ├─ CalendarView.vue
│  │  ├─ WrongAnswersView.vue
│  │  └─ StudyComparisonView.vue
│  ├─ components/ui/           # shadcn-vue 컴포넌트 (view가 실제 쓰는 것만 reka-ui 기반 생성)
│  ├─ composables/             # 테마 등 필요 시
│  ├─ domain/                  # ♻️ 유지 (순수 TS)
│  ├─ api/                     # ♻️ [101] 결과 유지 (src/app/api → src/api)
│  └─ styles/index.css         # ♻️ Tailwind 유지
├─ index.html                  # entry script: /src/main.ts
├─ vite.config.ts              # plugin-react → plugin-vue, @ alias(=src) 유지
└─ .env.example                # ♻️ 유지
```

`@` alias는 `src`를 가리키므로 import 경로는 `@/api`, `@/domain/...`, `@/stores/...`로 정리된다.

## 5. 화면/컴포넌트 1:1 매핑

| 현재 (React) | 변경 후 (Vue) | 비고 |
|---|---|---|
| `App.tsx` (상태+분기) | `App.vue` + `router/` + `stores/` | 상태→Pinia, page 전환→router |
| `LoginPage.tsx` | `views/LoginView.vue` | 스텁 유지 ([103]서 실연동) |
| `Layout.tsx` | `layouts/DefaultLayout.vue` | 사이드바 nav → `<RouterLink>` |
| `Dashboard.tsx` | `views/DashboardView.vue` | |
| `JsonRegistration.tsx` | `views/JsonRegistrationView.vue` | |
| `SessionList.tsx` | `views/SessionListView.vue` | |
| `ProblemDetail.tsx` | `views/ProblemDetailView.vue` | selectedSessionId → store/route param |
| `WeakConcepts.tsx` | `views/WeakConceptsView.vue` | recharts → vue-echarts |
| `CalendarPage.tsx` | `views/CalendarView.vue` | 하드코딩 유지 ([105/106]서 교체) |
| `WrongAnswers.tsx` | `views/WrongAnswersView.vue` | |
| `StudyComparison.tsx` | `views/StudyComparisonView.vue` | 하드코딩 유지 |
| `components/ui/*` (46개) | `components/ui/*` (shadcn-vue) | view가 실제 쓰는 것만 |

### 라우트 (vue-router)
`/login`, `/` (Dashboard), `/json-register`, `/sessions`, `/sessions/:id` (problem-detail), `/weak-concepts`, `/calendar`, `/wrong-answers`, `/study-comparison`. 로그인 안 됐으면 `/login`으로 가드.

### 상태 이전 (App.tsx → Pinia)
현재 `App.tsx`가 들고 props로 내려주는 상태를 스토어로 옮긴다:
- `isLoggedIn` → `auth` 스토어
- `sessions`, `selectedSessionId`, `mockDataActive` 및 `refreshSessions`/`selectSession`/`addMockData`/`removeMockData` → `sessions` 스토어 (내부적으로 기존 `domain/storage.ts` 함수 호출)

## 6. 의존성 처리 (3분류)

코드 import 실사용 여부를 기준으로 분류한다.

### ① 제거 (import 0건 — 순수 보일러플레이트)
`@mui/material`, `@mui/icons-material`, `@emotion/react`, `@emotion/styled`, `react-slick`, `react-responsive-masonry`, `react-dnd`, `react-dnd-html5-backend`, `react-popper`, `@popperjs/core`, `canvas-confetti`

### ② Vue 등가물로 교체 (실제 사용)
| 제거 | 추가 |
|---|---|
| `react`, `react-dom` | `vue` |
| `@vitejs/plugin-react` | `@vitejs/plugin-vue`, `vue-tsc` |
| `react-router` | `vue-router` |
| `@radix-ui/*` (다수) | `reka-ui` |
| `lucide-react` | `lucide-vue-next` |
| `recharts` | `vue-echarts` (+ `echarts`) |
| `sonner` | `vue-sonner` |
| `next-themes` | `@vueuse/core` |

유지: `class-variance-authority`, `clsx`, `tailwind-merge`, `tw-animate-css`, `date-fns`, `@tailwindcss/vite`, `tailwindcss`, `vite` (shadcn-vue도 동일하게 사용).

### ③ 보류 (사용처가 미사용 UI 래퍼뿐)
`embla-carousel-react`, `vaul`, `cmdk`, `input-otp`, `react-day-picker`, `react-resizable-panels`, `react-hook-form`, `motion` — 대부분 `components/ui/`의 래퍼 1개에만 존재하고 실제 view가 import하지 않는다. view가 실제 쓰는 UI 컴포넌트만 shadcn-vue로 생성하고, 나머지는 포팅하지 않는다 (필요 시 나중에 추가).

`pinia`는 신규 추가한다.

## 7. 단계별 실행 (plan에서 task로 분해)

1. **빌드 인프라 교체**: 브랜치 생성, Vite plugin-vue + vue-tsc + tsconfig + `index.html` + `main.ts` + Tailwind 연결, Vue 의존성 추가
2. **평탄화 + 보존 자산 이동**: `src/app/* → src/*`, `domain/`·`api/` import 경로 정리 (로직 무수정)
3. **라우터/스토어 골격**: vue-router 8라우트 + 로그인 가드, Pinia `auth`/`sessions` 스토어 (App.tsx 상태 이전)
4. **셸**: `DefaultLayout.vue` (사이드바 → RouterLink)
5. **UI 컴포넌트**: view가 실제 쓰는 shadcn-vue 컴포넌트만 생성
6. **화면 이식**: 9개 view를 `<script setup lang="ts">`로 1:1 포팅 (의존도 낮은 순: Login → Dashboard → SessionList → ...)
7. **차트**: WeakConcepts를 vue-echarts로
8. **정리/검증**: 미사용 React deps 제거, `npm install`, `npm run build`, 수동 스모크

각 화면은 독립적으로 포팅·확인할 수 있어, 한 번에 하나씩 진행하며 깨지면 해당 화면만 영향을 받는다.

## 8. 검증

- `npm run build` (vite build) — 빌드 통과
- `vue-tsc --noEmit` — 타입 체크 (스크립트 추가)
- lint 스크립트는 현재 없음 → 도입은 범위 밖
- 각 단계 후 빌드 + 해당 화면 수동 스모크

## 9. 주요 리스크

- **UI 컴포넌트 재현 (최대 리스크/작업량)**: shadcn-vue가 대부분 1:1 대응하지만 props/slot 패턴이 React와 달라 화면별 조정이 필요. view가 쓰는 것만 골라 점진 적용해 완화.
- **차트 외형 차이**: recharts → vue-echarts는 API가 달라 막대차트 외형을 다시 맞춰야 함.
- **localStorage 기능 보존**: `domain` 로직을 건드리지 않으면 동작 동일. 이번 범위에서 실제 API 교체는 하지 않음.
- **[101] API 클라이언트**: 순수 TS라 영향 없음. 위치만 `src/api/`로 이동.

## 10. 완료 기준

- 모든 React 의존성/코드/`.tsx`가 제거되고 Vue 기준으로 대체됨
- 9개 화면이 Vue로 1:1 동작 (기존 localStorage 기반 기능 보존)
- `domain`/`api` 자산 보존
- `npm run build` 성공
- [102] JWT 토큰 관리가 `auth` 스토어 + `api` 클라이언트 위에서 바로 이어질 수 있는 상태
