# 2차 피드백 배치 3A (가독성 픽스) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** 문제별 이해도 표·오답노트·등록 페이지의 가독성/통일성을 개선한다(라이브러리 무관).

**Architecture:** 순수 프레젠테이션 변경. 인라인 `:style={}` 패턴 유지. 검증은 `npx tsc --noEmit`(신규 에러 없음) + 육안.

**Tech Stack:** Vue 3 Composition API, 인라인 스타일

## Global Constraints

- SQLP-FE는 git push 하지 않음
- 인라인 `:style={}` 유지, Tailwind 미사용
- 새 의존성 없음, BE 변경 없음

---

### Task A1: 문제별 이해도 표 가독성 (ProblemDetailView)

**Files:**
- Modify: `src/views/ProblemDetailView.vue`

- [ ] **Step 1: 헤더 행 배경 + 헤더 셀 중앙정렬/강조 + `#`→`번호`**

헤더 `<tr>`/`<th>` 블록을 교체한다.
old:
```html
              <thead>
                <tr :style="{ backgroundColor: '#F9FAFB' }">
                  <th
                    v-for="h in [
                      '#',
                      '과목',
                      '핵심 개념',
                      ...session.speakers.flatMap((speaker) => [
                        `${speaker} 정답`,
                        `${speaker} 이해도`,
                      ]),
                      '복습',
                    ]"
                    :key="h"
                    :style="{
                      padding: '0.75rem 1rem',
                      textAlign: 'left' as CSSProperties['textAlign'],
                      color: '#6B7280',
                      fontWeight: 500,
                      fontSize: '0.8125rem',
                      whiteSpace: 'nowrap',
                    }"
                  >
                    {{ h }}
                  </th>
                </tr>
              </thead>
```
new:
```html
              <thead>
                <tr :style="{ backgroundColor: '#FEF8EC', borderBottom: '2px solid #F0E0C0' }">
                  <th
                    v-for="h in [
                      '번호',
                      '과목',
                      '핵심 개념',
                      ...session.speakers.flatMap((speaker) => [
                        `${speaker} 정답`,
                        `${speaker} 이해도`,
                      ]),
                      '복습',
                    ]"
                    :key="h"
                    :style="{
                      padding: '0.75rem 1rem',
                      textAlign: 'center' as CSSProperties['textAlign'],
                      color: '#374151',
                      fontWeight: 700,
                      fontSize: '0.8125rem',
                      whiteSpace: 'nowrap',
                    }"
                  >
                    {{ h }}
                  </th>
                </tr>
              </thead>
```

- [ ] **Step 2: 정답 셀 중앙정렬**

speaker 정답 td를 중앙정렬한다.
old:
```html
                    <td :style="{ padding: '0.875rem 1rem' }">
                      <template v-if="p.participants.find((item) => item.name === speaker)">
                        <span
                          :style="{
                            color: p.participants.find((item) => item.name === speaker)!.is_correct
```
new:
```html
                    <td :style="{ padding: '0.875rem 1rem', textAlign: 'center' as CSSProperties['textAlign'] }">
                      <template v-if="p.participants.find((item) => item.name === speaker)">
                        <span
                          :style="{
                            color: p.participants.find((item) => item.name === speaker)!.is_correct
```

- [ ] **Step 3: 이해도 셀 중앙정렬**

speaker 이해도 td를 중앙정렬한다.
old:
```html
                    <td :style="{ padding: '0.875rem 1rem' }">
                      <template v-if="p.participants.find((item) => item.name === speaker)">
                        <span
                          :style="badgeStyle(p.participants.find((item) => item.name === speaker)!.understanding)"
```
new:
```html
                    <td :style="{ padding: '0.875rem 1rem', textAlign: 'center' as CSSProperties['textAlign'] }">
                      <template v-if="p.participants.find((item) => item.name === speaker)">
                        <span
                          :style="badgeStyle(p.participants.find((item) => item.name === speaker)!.understanding)"
```

- [ ] **Step 4: 복습 셀 중앙정렬**

복습 td에 중앙정렬을 추가한다.
old:
```html
                  <td :style="{ padding: '0.875rem 1rem', whiteSpace: 'nowrap' }">
                    <span
                      v-if="p.participants.some((participant) => participant.review_required)"
```
new:
```html
                  <td :style="{ padding: '0.875rem 1rem', whiteSpace: 'nowrap', textAlign: 'center' as CSSProperties['textAlign'] }">
                    <span
                      v-if="p.participants.some((participant) => participant.review_required)"
```

- [ ] **Step 5: 타입 체크 + 커밋**

```bash
cd "C:/Users/SSAFY/Desktop/SQLP/SQLP-FE"
npx tsc --noEmit 2>&1 | head -20
git add src/views/ProblemDetailView.vue
git commit -m "style: 문제별 이해도 표 헤더 강조/중앙정렬, # → 번호, 5개 컬럼 데이터 중앙정렬"
```
Expected: 신규 에러 없음.

브라우저 확인: 헤더가 골드 배경+중앙정렬+굵게, `번호` 컬럼명, 정답/이해도/복습 데이터가 중앙정렬.

---

### Task A2: 오답노트 가독성 (WrongAnswersView)

**Files:**
- Modify: `src/views/WrongAnswersView.vue`

- [ ] **Step 1: 사람 배지 색 통일**

세은/수철 다른 색 → 동일 골드.
old:
```html
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
```
new:
```html
              <span
                :style="{
                  backgroundColor: '#FEF8EC',
                  color: '#92690B',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  padding: '0.125rem 0.5rem',
                  borderRadius: '999px',
                }"
              >
                {{ item.person }}
              </span>
```

- [ ] **Step 2: 이해도 배지 3색 분리**

잘함·애매가 같은 노랑 → 잘함 초록/애매 주황/모름 빨강.
old:
```html
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
                {{ understandingLabel(item.understanding) }}
              </span>
```
new:
```html
              <span
                :style="{
                  backgroundColor: item.understanding === '잘함' ? '#DCFCE7' : item.understanding === '애매' ? '#FFEDD5' : '#FEE2E2',
                  color: item.understanding === '잘함' ? '#15803D' : item.understanding === '애매' ? '#C2410C' : '#B91C1C',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  padding: '0.125rem 0.5rem',
                  borderRadius: '999px',
                }"
              >
                {{ understandingLabel(item.understanding) }}
              </span>
```

- [ ] **Step 3: 해설 박스 배경 구분 강화**

해설 박스에 배경색 변경 + 테두리 추가.
old:
```html
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
```
new:
```html
            <div
              :style="{
                backgroundColor: '#F8FAFC',
                border: '1px solid #E5E7EB',
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
```

- [ ] **Step 4: 타입 체크 + 커밋**

```bash
cd "C:/Users/SSAFY/Desktop/SQLP/SQLP-FE"
npx tsc --noEmit 2>&1 | head -20
git add src/views/WrongAnswersView.vue
git commit -m "style: 오답노트 사람 배지 색 통일, 이해도 배지 3색 분리, 해설 박스 구분 강화"
```
Expected: 신규 에러 없음.

브라우저 확인: 세은/수철 배지 동일 색, 잘함(초록)/애매(주황)/모름(빨강) 구분, 해설 박스 테두리.

---

### Task A3: 등록 페이지 통일 (ConceptImportView → JsonRegistrationView 형식에 맞춤)

**Files:**
- Modify: `src/views/ConceptImportView.vue`

**Interfaces:**
- `JsonRegistrationView`의 드롭존 UX(드래그앤드롭 + `dropZoneStyle` + FileJson size 40 + "최대 10MB" + 검증 버튼 아웃라인)를 기준으로 `ConceptImportView`를 맞춘다.

- [ ] **Step 1: 최대 파일 크기 10MB로 상향**

old:
```typescript
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
```
new:
```typescript
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
```

- [ ] **Step 2: 크기 초과 메시지 문구 변경**

old:
```typescript
    showError(["파일이 너무 큽니다. (최대 2MB)"]);
```
new:
```typescript
    showError(["파일이 너무 큽니다. (최대 10MB)"]);
```

- [ ] **Step 3: isDragging ref + dropZoneStyle computed 추가**

`const fileInput = ref<HTMLInputElement | null>(null);` 줄 바로 아래에 추가한다.
old:
```typescript
const fileInput = ref<HTMLInputElement | null>(null);
```
new:
```typescript
const fileInput = ref<HTMLInputElement | null>(null);
const isDragging = ref(false);

const dropZoneStyle = computed<CSSProperties>(() => ({
  border: `2px dashed ${isDragging.value ? "#C8962A" : "#D1D5DB"}`,
  borderRadius: "10px",
  padding: "3rem 2rem",
  textAlign: "center" as const,
  cursor: "pointer",
  backgroundColor: isDragging.value ? "#FEF8EC" : "#F9FAFB",
  transition: "all 0.15s",
}));
```

- [ ] **Step 4: 검증 버튼 아웃라인 스타일로 통일**

`previewButtonStyle`을 JsonRegistrationView 검증 버튼과 동일한 아웃라인 스타일로 교체한다.
old:
```typescript
const previewButtonStyle = computed<CSSProperties>(() => ({
  padding: "0.6875rem 1.25rem",
  border: "none",
  borderRadius: "8px",
  backgroundColor: reading.value ? "#D1D5DB" : "#C8962A",
  color: reading.value ? "#9CA3AF" : "#FFFFFF",
  fontSize: "0.875rem",
  fontWeight: 600,
  cursor: reading.value ? "not-allowed" : "pointer",
  display: "flex",
  alignItems: "center",
  gap: "0.375rem",
}));
```
new:
```typescript
const previewButtonStyle = computed<CSSProperties>(() => ({
  padding: "0.6875rem 1.25rem",
  border: "1.5px solid #C8962A",
  borderRadius: "8px",
  backgroundColor: "#FFFFFF",
  color: "#C8962A",
  fontSize: "0.875rem",
  fontWeight: 600,
  cursor: reading.value ? "not-allowed" : "pointer",
  opacity: reading.value ? 0.6 : 1,
  display: "flex",
  alignItems: "center",
  gap: "0.375rem",
}));
```

- [ ] **Step 5: 드롭존 마크업을 드래그 가능 + 동일 크기로 교체**

old:
```html
      <!-- File upload -->
      <div
        :style="{
          border: '2px dashed #D1D5DB',
          borderRadius: '10px',
          padding: '1.75rem 1rem',
          textAlign: 'center' as CSSProperties['textAlign'],
          cursor: 'pointer',
          backgroundColor: '#F9FAFB',
          marginBottom: '1.25rem',
        }"
        @click="fileInput?.click()"
      >
        <FileJson :size="34" color="#9CA3AF" :style="{ margin: '0 auto 0.5rem' }" />
        <div :style="{ fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }">
          {{ fileName ? fileName : ".json 파일을 선택해서 업로드하세요" }}
        </div>
        <div :style="{ fontSize: '0.8125rem', color: '#9CA3AF' }">
          {{ reading ? "파일을 읽는 중..." : "최대 2MB · JSON 형식만 지원" }}
        </div>
        <input
          ref="fileInput"
          type="file"
          accept=".json,application/json"
          style="display: none"
          @change="onFileChange"
        />
      </div>
```
new:
```html
      <!-- 파일 업로드 -->
      <div
        :style="[dropZoneStyle, { marginBottom: '1.25rem' }]"
        @dragover.prevent="isDragging = true"
        @dragleave="isDragging = false"
        @drop.prevent="
          (e) => {
            isDragging = false;
            const file = (e as DragEvent).dataTransfer?.files[0];
            if (file) handleFile(file);
          }
        "
        @click="fileInput?.click()"
      >
        <FileJson
          :size="40"
          :color="isDragging ? '#C8962A' : '#9CA3AF'"
          :style="{ margin: '0 auto 0.75rem' }"
        />
        <div :style="{ fontWeight: 500, color: '#374151', marginBottom: '0.375rem' }">
          {{ fileName ? fileName : ".json 파일을 여기에 끌어오거나 클릭해서 업로드하세요" }}
        </div>
        <div :style="{ fontSize: '0.8125rem', color: '#9CA3AF' }">
          {{ reading ? "파일을 읽는 중..." : "최대 10MB · JSON 형식만 지원" }}
        </div>
        <input
          ref="fileInput"
          type="file"
          accept=".json,application/json"
          style="display: none"
          @change="onFileChange"
        />
      </div>
```

- [ ] **Step 6: 붙여넣기 라벨 문구 통일**

old:
```html
      <label :style="{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }">
        JSON 직접 붙여넣기
      </label>
```
new:
```html
      <label :style="{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }">
        또는 JSON 텍스트 직접 붙여넣기
      </label>
```

- [ ] **Step 7: 타입 체크 + 커밋**

```bash
cd "C:/Users/SSAFY/Desktop/SQLP/SQLP-FE"
npx tsc --noEmit 2>&1 | head -20
git add src/views/ConceptImportView.vue
git commit -m "style: 개념 등록 업로드 UX를 문제 등록과 통일 (드래그앤드롭, 크기, 10MB, 검증 버튼)"
```
Expected: 신규 에러 없음.

브라우저 확인: 등록 탭에서 문제 JSON ↔ 개념 JSON 의 드롭존 크기·문구·검증 버튼이 동일. 개념 드롭존도 드래그앤드롭 동작.

---

## Self-Review

**1. Spec coverage:** A1 표 가독성, A2 오답노트(사람배지/이해도배지/해설), A3 등록 통일 — 모두 커버.

**2. Placeholder scan:** 모든 스텝 실제 old/new 코드 포함.

**3. Type consistency:** A3에서 `ConceptImportView`는 이미 `ref`/`computed`/`CSSProperties`/`FileJson` import 보유. `dropZoneStyle`(computed)·`isDragging`(ref) 신규 추가, `:style="[dropZoneStyle, {...}]"` 배열 바인딩으로 marginBottom 보존. `reading` ref는 기존 유지.
