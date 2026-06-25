# UI 피드백 배치 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 스터디 피드백 중 그래프가 필요 없는 UI 픽스(너비 풀 적용, 홈 캘린더 절반 비율, 문제별 이해도 가독성, 등록 입력 통일)를 적용한다.

**Architecture:** 순수 프레젠테이션(인라인 스타일/템플릿) 변경만. 로직·API·도메인 타입 무변경. 새 의존성 없음. 검증은 `npx tsc --noEmit`(신규 타입 에러 없음) + 브라우저 육안 확인.

**Tech Stack:** Vue 3 Composition API, 인라인 `:style={}` 패턴, lucide-vue-next

## Global Constraints

- SQLP-FE는 git push 하지 않음 (로컬 전용)
- 인라인 `:style={}` 패턴 유지, Tailwind 미사용
- 새 npm 의존성 추가 없음
- BE 변경 없음
- 라우팅에서 제거된 뷰(`CalendarView.vue`, `StudyComparisonView.vue`)와 인증 페이지(`LoginView.vue`, `SignupView.vue`)는 건드리지 않는다
- 각 뷰의 루트 컨테이너 너비만 푼다. 내부 카드/그리드 폭은 유지

---

### Task 1: 전 페이지 너비 풀 적용

**Files:**
- Modify: `src/views/SessionListView.vue:46`
- Modify: `src/views/WeakConceptsView.vue:121`
- Modify: `src/views/WrongAnswersView.vue` (4곳: 74, 90, 106, 122)
- Modify: `src/views/ConceptSummaryView.vue:52`
- Modify: `src/views/ConceptImportView.vue:161`
- Modify: `src/views/RegisterView.vue:11`
- Modify: `src/views/GrowthReportView.vue:161`

**Interfaces:**
- Consumes: 없음
- Produces: 없음 (독립 스타일 변경)

참고: `ProblemDetailView`와 `JsonRegistrationView`의 너비는 각각 Task 3, Task 4에서 처리하므로 이 태스크에서 건드리지 않는다.

- [ ] **Step 1: SessionListView 루트 너비 변경**

`src/views/SessionListView.vue` 46번 줄:
```typescript
const outerStyle: CSSProperties = { maxWidth: "900px" };
```
→
```typescript
const outerStyle: CSSProperties = { width: "100%" };
```

- [ ] **Step 2: WeakConceptsView 루트 너비 변경**

`src/views/WeakConceptsView.vue` 121번 줄:
```html
  <div :style="{ maxWidth: '1200px' }">
```
→
```html
  <div :style="{ width: '100%' }">
```

- [ ] **Step 3: WrongAnswersView 4개 루트 너비 변경**

`src/views/WrongAnswersView.vue`에서 `:style="{ maxWidth: '900px' }"` 4곳을 모두 `:style="{ width: '100%' }"`로 바꾼다 (loading/error/empty/main 분기). Edit 도구의 `replace_all: true`로 일괄 변경:
```
old: :style="{ maxWidth: '900px' }"
new: :style="{ width: '100%' }"
```

- [ ] **Step 4: ConceptSummaryView 루트 너비 변경**

`src/views/ConceptSummaryView.vue` 52번 줄:
```html
  <div :style="{ maxWidth: '860px' }">
```
→
```html
  <div :style="{ width: '100%' }">
```

- [ ] **Step 5: ConceptImportView 루트 너비 변경**

`src/views/ConceptImportView.vue` 161번 줄:
```html
  <div :style="{ maxWidth: '860px' }">
```
→
```html
  <div :style="{ width: '100%' }">
```

- [ ] **Step 6: RegisterView 루트 너비 변경**

`src/views/RegisterView.vue` 11번 줄:
```html
  <div :style="{ maxWidth: '860px' }">
```
→
```html
  <div :style="{ width: '100%' }">
```

- [ ] **Step 7: GrowthReportView 루트 너비 변경**

`src/views/GrowthReportView.vue` 161번 줄:
```html
  <div :style="{ maxWidth: '960px' }">
```
→
```html
  <div :style="{ width: '100%' }">
```

- [ ] **Step 8: 타입 체크**

Run: `cd "C:/Users/SSAFY/Desktop/SQLP/SQLP-FE" && npx tsc --noEmit 2>&1 | head -30`
Expected: 이 변경으로 인한 신규 에러 없음 (기존 `.vue` 모듈 선언 관련 사전 에러는 무시).

- [ ] **Step 9: 커밋**

```bash
cd "C:/Users/SSAFY/Desktop/SQLP/SQLP-FE"
git add src/views/SessionListView.vue src/views/WeakConceptsView.vue src/views/WrongAnswersView.vue src/views/ConceptSummaryView.vue src/views/ConceptImportView.vue src/views/RegisterView.vue src/views/GrowthReportView.vue
git commit -m "style: 전 페이지 루트 너비 풀 적용 (max-width 고정 제거)"
```

---

### Task 2: 홈 캘린더 절반 비율 레이아웃

**Files:**
- Modify: `src/views/DashboardView.vue` (하단 섹션 305~531번 줄 영역)

**Interfaces:**
- Consumes: 없음
- Produces: 없음

상단 요약 카드 그리드(`repeat(4, 1fr)`)와 동일한 4열 그리드로 하단을 재배치한다. 캘린더는 2칸(span 2), 복습추천·최근세션은 각 1칸.

- [ ] **Step 1: 하단 그리드 컬럼 정의 변경**

`src/views/DashboardView.vue`에서 하단 그리드의 컬럼 정의를 4열로 바꾼다.
```html
        gridTemplateColumns: '1fr 380px',
```
→
```html
        gridTemplateColumns: 'repeat(4, 1fr)',
```

- [ ] **Step 2: 캘린더 카드에 span 2 부여**

캘린더 카드 스타일에 `gridColumn: 'span 2'`를 추가한다.
old:
```html
      <!-- 왼쪽: 학습 캘린더 -->
      <div
        :style="{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          padding: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }"
      >
```
new:
```html
      <!-- 왼쪽: 학습 캘린더 (span 2) -->
      <div
        :style="{
          gridColumn: 'span 2',
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          padding: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }"
      >
```

- [ ] **Step 3: 오른쪽 세로 스택 래퍼 제거 (열기 부분)**

복습추천·최근세션을 감싸던 `flex column` 래퍼를 제거해 두 섹션이 그리드 직접 자식이 되게 한다.
old:
```html
      <!-- 오른쪽: 복습 추천 + 최근 세션 -->
      <div :style="{ display: 'flex', flexDirection: 'column' as CSSProperties['flexDirection'], gap: '1.5rem' }">
        <!-- 오늘의 복습 추천 -->
        <div>
```
new:
```html
      <!-- 3번째 칼럼: 오늘의 복습 추천 -->
      <div>
```

- [ ] **Step 4: 오른쪽 세로 스택 래퍼 제거 (닫기 부분)**

래퍼의 닫는 `</div>`를 제거한다. 템플릿 끝부분:
old:
```html
        </div>
      </div>
    </div>
  </div>
</template>
```
new:
```html
        </div>
    </div>
  </div>
</template>
```

- [ ] **Step 5: 최근 세션 섹션 주석 명확화 (선택)**

`<!-- 최근 학습 세션 -->` 주석을 `<!-- 4번째 칼럼: 최근 학습 세션 -->`으로 바꿔 칼럼 위치를 명시한다. (기능 무관, 가독성용)
old:
```html
        <!-- 최근 학습 세션 -->
        <div>
          <div :style="sectionHeaderStyle">
            <h3 :style="{ color: '#111827' }">최근 학습 세션</h3>
```
new:
```html
      <!-- 4번째 칼럼: 최근 학습 세션 -->
      <div>
          <div :style="sectionHeaderStyle">
            <h3 :style="{ color: '#111827' }">최근 학습 세션</h3>
```

- [ ] **Step 6: 타입 체크**

Run: `cd "C:/Users/SSAFY/Desktop/SQLP/SQLP-FE" && npx tsc --noEmit 2>&1 | head -30`
Expected: 신규 에러 없음.

- [ ] **Step 7: 브라우저 확인**

홈 화면에서 하단이 4열로 정렬되는지 확인:
- 캘린더가 왼쪽 절반(상단 1·2번 카드 폭)을 차지
- 복습 추천이 3번째 칼럼(평균 이해도 카드 아래)
- 최근 세션이 4번째 칼럼(연속 학습일 카드 아래)

- [ ] **Step 8: 커밋**

```bash
cd "C:/Users/SSAFY/Desktop/SQLP/SQLP-FE"
git add src/views/DashboardView.vue
git commit -m "style: 홈 하단을 4열 그리드로 재배치 (캘린더 절반, 복습·세션 각 1칸)"
```

---

### Task 3: 문제별 이해도 가독성 (ProblemDetailView)

**Files:**
- Modify: `src/views/ProblemDetailView.vue` (script 47~55번, 템플릿 90번·문제번호 td·복습 td·해설 요약 섹션)

**Interfaces:**
- Consumes: 없음
- Produces: 없음

`badgeConfig`는 테이블 셀과 상세 패널이 공유하므로 색 변경은 양쪽에 동시 반영된다.

- [ ] **Step 1: 루트 너비 풀 적용**

90번 줄:
```html
  <div :style="{ display: 'flex', gap: '1.5rem', maxWidth: '1200px' }">
```
→
```html
  <div :style="{ display: 'flex', gap: '1.5rem', width: '100%' }">
```

- [ ] **Step 2: 참가자 아바타 색 통일**

`getAvatarColor`가 인덱스별 5색을 순환하던 것을 브랜드 골드 단일색으로 통일한다.
old:
```typescript
function getAvatarColor(index: number): string {
  return ["#C8962A", "#3B82F6", "#10B981", "#8B5CF6", "#EF4444"][index % 5];
}
```
new:
```typescript
function getAvatarColor(_index: number): string {
  return "#C8962A";
}
```

- [ ] **Step 3: 이해도 태그 색 대비 강화**

`badgeConfig`의 세 값이 명확히 구분되도록 색을 바꾼다 (애매가 잘함과 비슷해 보이던 문제 해결).
old:
```typescript
const badgeConfig: Record<Understanding, { bg: string; color: string; text: string }> = {
  잘함: { bg: "#ECFDF5", color: "#065F46", text: "잘함" },
  애매: { bg: "#FEF3C7", color: "#92690B", text: "애매" },
  모름: { bg: "#FEF2F2", color: "#991B1B", text: "모름" },
};
```
new:
```typescript
const badgeConfig: Record<Understanding, { bg: string; color: string; text: string }> = {
  잘함: { bg: "#DCFCE7", color: "#15803D", text: "잘함" },
  애매: { bg: "#FFEDD5", color: "#C2410C", text: "애매" },
  모름: { bg: "#FEE2E2", color: "#B91C1C", text: "모름" },
};
```

- [ ] **Step 4: 문제번호(#) 칼럼 줄바꿈 방지**

문제번호 td에 `whiteSpace: 'nowrap'`을 추가한다.
old:
```html
                  <td
                    :style="{
                      padding: '0.875rem 1rem',
                      color: '#374151',
                      fontWeight: 600,
                    }"
                  >
                    {{ p.problem_number }}번
                  </td>
```
new:
```html
                  <td
                    :style="{
                      padding: '0.875rem 1rem',
                      color: '#374151',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                    }"
                  >
                    {{ p.problem_number }}번
                  </td>
```

- [ ] **Step 5: 복습 칼럼 줄바꿈 방지**

복습 td에 `whiteSpace: 'nowrap'`을 추가한다 (v-if review_required로 시작하는 td가 복습 칼럼).
old:
```html
                  <td :style="{ padding: '0.875rem 1rem' }">
                    <span
                      v-if="p.participants.some((participant) => participant.review_required)"
```
new:
```html
                  <td :style="{ padding: '0.875rem 1rem', whiteSpace: 'nowrap' }">
                    <span
                      v-if="p.participants.some((participant) => participant.review_required)"
```

- [ ] **Step 6: 해설 요약 박스 처리**

상세 패널의 "해설 요약" 본문을 흰 배경과 구분되는 박스로 감싼다.
old:
```html
        <!-- Section: 해설 요약 -->
        <div :style="{ marginBottom: '1rem' }">
          <div :style="sectionLabelStyle">해설 요약</div>
          <div
            :style="{
              fontSize: '0.8125rem',
              color: '#374151',
              lineHeight: '1.6',
            }"
          >
            {{ selected.solution_summary }}
          </div>
        </div>
```
new:
```html
        <!-- Section: 해설 요약 -->
        <div :style="{ marginBottom: '1rem' }">
          <div :style="sectionLabelStyle">해설 요약</div>
          <div
            :style="{
              fontSize: '0.8125rem',
              color: '#374151',
              lineHeight: '1.6',
              backgroundColor: '#F8FAFC',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              padding: '0.75rem',
            }"
          >
            {{ selected.solution_summary }}
          </div>
        </div>
```

- [ ] **Step 7: 타입 체크**

Run: `cd "C:/Users/SSAFY/Desktop/SQLP/SQLP-FE" && npx tsc --noEmit 2>&1 | head -30`
Expected: 신규 에러 없음. (`getAvatarColor`의 `_index` 미사용 파라미터는 `_` 접두사로 lint 통과)

- [ ] **Step 8: 브라우저 확인**

문제별 이해도 탭에서:
- `#` 칼럼·`복습` 칼럼이 한 줄로 표시 (두 줄 깨짐 없음)
- 행 클릭 시 상세 패널의 "해설 요약"이 회색 박스로 구분
- 이해도 태그 잘함(초록)/애매(주황)/모름(빨강)이 뚜렷이 구분
- 참가자 아바타가 모두 동일 골드색

- [ ] **Step 9: 커밋**

```bash
cd "C:/Users/SSAFY/Desktop/SQLP/SQLP-FE"
git add src/views/ProblemDetailView.vue
git commit -m "style: 문제별 이해도 가독성 개선 (칼럼 nowrap, 해설 박스, 태그 색 분리, 아바타 통일)"
```

---

### Task 4: 등록 페이지 입력 방식 통일 (JsonRegistrationView)

**Files:**
- Modify: `src/views/JsonRegistrationView.vue` (script: type/ref/함수/스타일 제거, 템플릿: 탭 제거 + 입력 동시 표시 + 너비 풀)

**Interfaces:**
- Consumes: 없음
- Produces: 없음

탭(파일 업로드 / 직접 붙여넣기)을 제거하고 개념 등록(`ConceptImportView`)처럼 드롭존 + 텍스트 영역을 한 화면에 동시 표시한다. `handleFile`이 파일 내용을 `jsonText`에 채우는 기존 흐름을 그대로 사용하므로 검증/등록 로직은 무변경.

- [ ] **Step 1: `type Tab` 선언 제거**

old:
```typescript
type Tab = "file" | "paste";
type ValidateStatus = null | "ok" | "error";
```
new:
```typescript
type ValidateStatus = null | "ok" | "error";
```

- [ ] **Step 2: `activeTab` ref 제거**

old:
```typescript
const activeTab = ref<Tab>("paste");
const jsonText = ref("");
```
new:
```typescript
const jsonText = ref("");
```

- [ ] **Step 3: `handleTabChange` 함수 제거**

아래 함수 블록 전체를 삭제한다:
```typescript
const handleTabChange = (tab: Tab) => {
  activeTab.value = tab;
  jsonText.value = "";
  fileName.value = null;
  if (fileInput.value) {
    fileInput.value.value = "";
  }
  resetValidation();
};
```
(앞뒤 빈 줄 정리. `handleFile` 함수와 `previewRows` computed 사이에 위치)

- [ ] **Step 4: `tabButtonStyle` 스타일 함수 제거**

아래 블록 전체를 삭제한다:
```typescript
const tabButtonStyle = (tab: Tab): CSSProperties => ({
  padding: "0.875rem 1.5rem",
  fontSize: "0.875rem",
  fontWeight: activeTab.value === tab ? 600 : 400,
  color: activeTab.value === tab ? "#C8962A" : "#6B7280",
  backgroundColor: "transparent",
  border: "none",
  cursor: "pointer",
  borderBottom: activeTab.value === tab ? "2px solid #C8962A" : "2px solid transparent",
  marginBottom: "-1px",
});
```

- [ ] **Step 5: 루트 너비 풀 적용**

287번 줄:
```html
  <div style="max-width: 860px">
```
→
```html
  <div :style="{ width: '100%' }">
```

- [ ] **Step 6: 탭 버튼 마크업 제거**

카드 상단의 탭 블록 전체를 삭제한다:
```html
      <!-- Tabs -->
      <div style="display: flex; border-bottom: 1px solid #e5e7eb">
        <button
          v-for="tab in (['file', 'paste'] as Tab[])"
          :key="tab"
          :style="tabButtonStyle(tab)"
          @click="handleTabChange(tab)"
        >
          {{ tab === "file" ? "📁  JSON 파일 업로드" : "✏️  JSON 직접 붙여넣기" }}
        </button>
      </div>
```

- [ ] **Step 7: 조건부 입력 → 동시 표시로 교체**

`<div style="padding: 1.5rem">` 내부의 `v-if`(드롭존) / `v-else`(텍스트영역) 블록을 동시 표시 마크업으로 교체한다.
old:
```html
        <!-- File upload tab -->
        <div v-if="activeTab === 'file'">
          <div
            :style="dropZoneStyle"
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
              {{ fileName ? "파일이 선택되었습니다." : "최대 10MB · JSON 형식만 지원" }}
            </div>
            <input
              ref="fileInput"
              type="file"
              accept=".json"
              style="display: none"
              @change="
                (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) handleFile(file);
                }
              "
            />
          </div>
        </div>

        <!-- Paste tab -->
        <div v-else>
          <label
            :style="{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#374151',
              marginBottom: '0.5rem',
            }"
          >
            JSON 텍스트 붙여넣기
          </label>
          <textarea
            v-model="jsonText"
            :placeholder="PLACEHOLDER_JSON"
            :style="{
              width: '100%',
              height: '260px',
              padding: '0.875rem',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              fontSize: '0.8125rem',
              fontFamily: 'monospace',
              resize: 'vertical',
              outline: 'none',
              color: '#374151',
              backgroundColor: '#FAFAFA',
              boxSizing: 'border-box',
            }"
            @input="resetValidation"
          />
        </div>
```
new:
```html
        <!-- 파일 업로드 -->
        <div
          :style="dropZoneStyle"
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
            {{ fileName ? "파일이 선택되었습니다." : "최대 10MB · JSON 형식만 지원" }}
          </div>
          <input
            ref="fileInput"
            type="file"
            accept=".json"
            style="display: none"
            @change="
              (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) handleFile(file);
              }
            "
          />
        </div>

        <!-- 직접 붙여넣기 -->
        <label
          :style="{
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: 500,
            color: '#374151',
            margin: '1.25rem 0 0.5rem',
          }"
        >
          또는 JSON 텍스트 직접 붙여넣기
        </label>
        <textarea
          v-model="jsonText"
          :placeholder="PLACEHOLDER_JSON"
          :style="{
            width: '100%',
            height: '260px',
            padding: '0.875rem',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            fontSize: '0.8125rem',
            fontFamily: 'monospace',
            resize: 'vertical',
            outline: 'none',
            color: '#374151',
            backgroundColor: '#FAFAFA',
            boxSizing: 'border-box',
          }"
          @input="resetValidation"
        />
```

- [ ] **Step 8: 타입 체크**

Run: `cd "C:/Users/SSAFY/Desktop/SQLP/SQLP-FE" && npx tsc --noEmit 2>&1 | head -30`
Expected: 신규 에러 없음. `activeTab`/`Tab`/`handleTabChange`/`tabButtonStyle` 미참조 확인 (남아 있으면 미사용 에러 발생 → 제거 누락 점검).

- [ ] **Step 9: 브라우저 확인**

등록 탭 → "📄 문제 JSON 등록"에서:
- 상단 탭 버튼이 사라지고 드롭존 + 텍스트 영역이 한 화면에 동시 표시
- 파일 업로드 시 텍스트 영역에 내용이 채워짐
- "형식 검증하기" → "학습 기록 등록하기" 흐름 정상 동작

- [ ] **Step 10: 커밋**

```bash
cd "C:/Users/SSAFY/Desktop/SQLP/SQLP-FE"
git add src/views/JsonRegistrationView.vue
git commit -m "style: 문제 JSON 등록 입력 방식을 드롭존+텍스트 동시 표시로 통일 (탭 제거)"
```

---

## Self-Review

**1. Spec coverage:**
- 너비 풀 적용 → Task 1 (+ Task 3 Step 1, Task 4 Step 5 for the two views handled in their own tasks) ✅
- 홈 캘린더 절반 비율 → Task 2 ✅
- 문제번호·복습 칼럼 nowrap → Task 3 Step 4·5 ✅
- 해설 박스 → Task 3 Step 6 ✅
- 태그 색 분리 → Task 3 Step 3 ✅
- 참가자 이름 색 통일 → Task 3 Step 2 ✅
- 등록 입력 통일 → Task 4 ✅

**2. Placeholder scan:** 모든 스텝에 실제 old/new 코드 포함. 플레이스홀더 없음.

**3. Type consistency:** `badgeConfig`/`getAvatarColor` 시그니처 유지(호출부 무변경). `jsonText`/`handleFile`/`resetValidation`/`dropZoneStyle`/`isDragging`/`fileInput`/`PLACEHOLDER_JSON`는 Task 4에서 보존, `activeTab`/`Tab`/`handleTabChange`/`tabButtonStyle`만 제거 — 상호 참조 정합.
