# SQLP-FE UI 피드백 배치 1 설계 (그래프 제외)

**작성일:** 2026-06-25
**범위:** 피드백 항목 중 그래프가 필요 없는 UI 픽스만. 그래프(학습 세션 시각화, 문제별 이해도 Force-Directed Graph)는 배치 2로 분리.

## 배경

스터디 피드백에서 나온 UI 개선 요청을 두 배치로 나눈다.
- **배치 1 (이 문서):** 레이아웃·너비·가독성 픽스 — 라이브러리 추가 없음
- **배치 2 (별도):** ECharts `graph` + `force` 레이아웃 기반 시각화

핵심 발견:
- 프로젝트에 `vue-echarts` + `echarts/core`가 이미 설치되어 있음 (`WeakConceptsView`에서 사용). 배치 2 그래프는 새 의존성 불필요.
- `WeakConceptsView`는 이미 차트+사이드바 구성 → "오른쪽 빈 공간"은 너비 풀 적용만으로 해결.
- 해설 박스 / 태그 색 / 참가자 이름 색 피드백은 모두 `ProblemDetailView` 상세 패널 관련.

## 작업 항목

### 1. 전 페이지 너비 풀 적용
모든 주요 뷰의 루트 컨테이너에 박힌 `maxWidth` 고정값(`860px`, `900px`, `1100px`, `1200px` 등)을 제거하고 `width: '100%'`로 바꾼다. 오른쪽에 남던 빈 공간을 없앤다.

대상 파일:
- `src/views/SessionListView.vue` (`outerStyle.maxWidth: '900px'`)
- `src/views/ProblemDetailView.vue` (템플릿 루트 `maxWidth: '1200px'`)
- `src/views/WeakConceptsView.vue` (`maxWidth: '1200px'`)
- `src/views/WrongAnswersView.vue`
- `src/views/ConceptSummaryView.vue`
- `src/views/ConceptImportView.vue` (`maxWidth: '860px'`)
- `src/views/JsonRegistrationView.vue` (`max-width: 860px`)
- `src/views/RegisterView.vue` (`maxWidth: '860px'`)
- `src/views/GrowthReportView.vue`
- `src/views/DashboardView.vue` (캘린더 그리드 우측 고정 `380px` → 비율 기반으로 변경, 항목 2 참조)

규칙: 루트 컨테이너만 푼다. 내부 카드/그리드 폭은 건드리지 않는다.

### 2. 홈 캘린더 절반 비율 레이아웃
상단 요약 카드 4개는 `repeat(4, 1fr)` 그리드다. 하단도 동일 그리드(`repeat(4, 1fr)`)로 맞춘다.
- 캘린더 카드: `gridColumn: 'span 2'` → 왼쪽 절반(상단 1·2번 카드 폭)
- 오늘의 복습 추천: 3번째 칼럼 (평균 이해도 카드 아래)
- 최근 학습 세션: 4번째 칼럼 (연속 학습일 카드 아래)

현재 `DashboardView`의 하단은 `gridTemplateColumns: '1fr 380px'`에 오른쪽이 복습추천+세션을 세로 스택으로 묶고 있다. 이를 4열 그리드로 재배치한다:
```
gridTemplateColumns: 'repeat(4, 1fr)'
  - 캘린더: gridColumn: 'span 2'
  - 복습추천: gridColumn: 'span 1'
  - 최근세션: gridColumn: 'span 1'
align-items: start
```
복습추천·최근세션은 각각 단일 칼럼이므로 카드 내부 콘텐츠는 좁은 폭에서도 깨지지 않게 기존 스타일 유지(이미 세로 스택형 카드라 문제 없음).

### 3. 문제별 이해도 칼럼 줄바꿈 방지
`ProblemDetailView` 테이블에서 두 줄로 깨지는 칼럼을 한 줄로 고정한다.
- `#`(문제번호) 칼럼: 헤더 `'#'`와 `{{ p.problem_number }}번` 셀에 `whiteSpace: 'nowrap'`
- `복습` 칼럼: 헤더 `'복습'`과 `필요`/`—` 셀에 `whiteSpace: 'nowrap'`

현재 헤더는 이미 `whiteSpace: 'nowrap'`이 공통 적용돼 있으나(라인 161), 바디 셀의 문제번호 td와 복습 td에는 없다. 해당 td에 `whiteSpace: 'nowrap'`을 추가한다.

### 4. 문제별 이해도 상세 패널 가독성
`ProblemDetailView`의 우측 상세 패널(`v-if="selected"`)을 손본다.

(a) **해설 요약 박스**: 현재 "해설 요약" 섹션의 본문은 배경 없는 텍스트다. 흰 카드 배경과 구분되도록 박스로 감싼다.
```
backgroundColor: '#F8FAFC'
border: '1px solid #E5E7EB'
borderRadius: '8px'
padding: '0.75rem'
```
"문제 요약" 섹션은 현행 유지(요청은 해설 박스에 한정).

(b) **태그 색 분리**: `badgeConfig`의 세 값이 명확히 구분되도록 대비를 강화한다.
- `잘함`: 초록 (bg `#DCFCE7`, color `#15803D`)
- `애매`: 주황 (bg `#FFEDD5`, color `#C2410C`)  ← 기존 노랑계열이 잘함과 비슷해 보이던 문제 해결
- `모름`: 빨강 (bg `#FEE2E2`, color `#B91C1C`)

이 `badgeConfig`는 테이블 셀과 상세 패널이 공유하므로 양쪽에 동시 반영된다.

(c) **참가자 이름 색 통일**: `getAvatarColor(index)`가 인덱스별로 5색을 순환시켜 참가자마다 아바타·이름 톤이 달라진다. 단일 색(`#C8962A`, 브랜드 골드)으로 통일한다. 아바타 원형 배경과 이름 텍스트 색을 일관되게 만든다.

### 5. 등록 페이지 입력 방식 통일
`JsonRegistrationView`의 입력 방식을 개념 등록(`ConceptImportView`)과 맞춘다.
- 현재: 상단 탭 버튼 `📁 JSON 파일 업로드` / `✏️ JSON 직접 붙여넣기` 두 개를 두고 `activeTab`으로 전환.
- 변경: 탭 제거. **파일 업로드 드롭존 + JSON 텍스트 영역을 한 화면에 동시 표시** (개념 등록 레이아웃과 동일 구조: 드롭존 위, 텍스트 영역 아래).

영향:
- `activeTab` ref, `handleTabChange`, `tabButtonStyle`, 탭 버튼 마크업 제거.
- 파일 선택 시 기존 `handleFile`이 `jsonText`에 내용을 채우는 흐름은 유지 → 업로드와 붙여넣기가 같은 `jsonText`/검증 로직 공유 (개념 등록과 동일 패턴).
- 검증 버튼(`형식 검증하기`)·등록 버튼(`학습 기록 등록하기`)과 결과 표시 영역은 현행 유지.

## 비범위 (배치 2)
- 학습 세션 페이지 우측 시각화
- 문제별 이해도 우측 Force-Directed Graph (ECharts `graph` + `force`)

## 제약
- SQLP-FE는 git push 하지 않음 (로컬 전용)
- 인라인 `:style={}` 패턴 유지, Tailwind 미사용
- 새 npm 의존성 추가 없음 (배치 1)
- BE 변경 없음
