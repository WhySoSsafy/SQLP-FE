# SQLP-FE 2차 피드백 UI 개선 설계

**작성일:** 2026-06-25
**범위:** 2차 스터디 피드백 7개 영역을 3배치로 분할. 각 배치는 독립 실행/리뷰 가능.

## 배경 / 확인된 사실

- **"5단 노트 페이지" = 오답노트(`WrongAnswersView`)** — STT가 "오답노트"를 "5단 노트"로 옮김. 코드 일치 확인.
- `CalendarDayEntry`에는 `averageUnderstanding`(단일 0~100)만 있고 **참여자별 이해도 없음**. 참여자별 표시는 그 날짜 세션의 상세(`fetchSessionDetail`)를 추가 조회해 계산한다(BE 변경 없음).
- `WeakConcept`에 `scoreByParticipant`/`weakCountByParticipant`가 있어 세은/수철 분리 가능.
- 프로젝트에 `vue-echarts`/`echarts` 설치됨 — force graph·영역 차트 모두 새 의존성 없이 가능.
- force graph 깜빡임 원인: float 레이아웃으로 노드가 커서 밑을 들락날락 → 강조가 딱딱 on/off. **float은 유지**, 전환을 부드럽게 한다.

## 결정 (사용자 확정)

1. 홈 캘린더: 세션 상세 조회로 참여자별 이해도 표시.
2. 학습 세션 2번째 차트: 복습 필요 추이 영역 차트.
3. 3배치 분할.
4. force graph: float 유지 + 호버 강조 유지, `stateAnimation`으로 비강조 노드를 빠르고 자연스럽게 페이드.

---

## 배치 3A — 가독성 픽스 (라이브러리 무관)

### A1. 문제별 이해도 표 (`ProblemDetailView`)
- 테이블 헤더 행: 배경을 본문과 구분되게(brand 톤 `#FEF8EC`) + 헤더 텍스트 **중앙 정렬** + `fontWeight 700` + 진한 색(`#374151`).
- 헤더 `'#'` → `'번호'`로 변경.
- 5개 컬럼(각 speaker의 `정답`/`이해도` + `복습`) **본문 데이터 셀 중앙 정렬**. (과목/핵심개념/번호 등 나머지는 기존 정렬 유지)
- nowrap은 배치 1에서 적용됨(유지).

### A2. 오답노트 (`WrongAnswersView`)
- **사람 배지 색 통일**: 현재 `세은` 노랑(`#FEF3C7`/`#92690B`)·`수철` 파랑(`#EFF6FF`/`#1D4ED8`) → 동일 골드(`#FEF8EC`/`#92690B`)로 통일.
- **이해도 배지 3색 분리**: 현재 모름=빨강, 그 외(잘함·애매)=노랑으로 **잘함·애매가 동일**. → 잘함 초록(`#DCFCE7`/`#15803D`) / 애매 주황(`#FFEDD5`/`#C2410C`) / 모름 빨강(`#FEE2E2`/`#B91C1C`)로 분리. (`ProblemDetailView` badgeConfig와 동일 팔레트)
- **해설 박스**: 현재 `#F9FAFB` → `#F8FAFC` 배경 + `1px solid #E5E7EB` 테두리로 흰 카드와 더 뚜렷이 구분.

### A3. 등록 통일 (`JsonRegistrationView` ↔ `ConceptImportView`)
- **드롭존 크기 통일**: 패딩을 동일하게. (기준: `ConceptImportView`의 `1.75rem 1rem` 컴팩트 카드로 양쪽 통일하거나, 더 큰 쪽으로 통일 — 구현 시 동일 값 사용)
- **최대 용량 문구 통일**: 현재 문제(`최대 10MB`)·개념(`최대 2MB`) → 둘 다 동일 문구(`최대 10MB · JSON 형식만 지원`).
- **검증 버튼 스타일·라벨 통일**: 양쪽 검증 버튼을 동일 스타일로. 개념 페이지는 등록 API가 없어 "등록" 버튼은 구조상 제외(문제 페이지에만 유지) — 이는 기능 차이로 명시.

---

## 배치 3B — 레이아웃 / 시각화

### B1. 홈 캘린더 참여자별 이해도 (`DashboardView`)
- 날짜 클릭 시: `sessionsStore.sessions`에서 그 날짜(`session_date`)의 세션을 찾아 `fetchSessionDetail(id)` 조회.
- 참여자별 평균 이해도(%) 계산: 각 참여자가 참여한 문제들의 understanding을 `잘함=100 / 애매=50 / 모름=0`로 환산해 평균.
- 캘린더 상세 영역에 참여자별 미니 막대(이름 + %) 추가. 기존 지표(푼 문제 수/평균 이해도/복습 필요/참여자)는 유지.
- 세션 상세 조회 실패/해당 날짜 세션 없음 → 참여자별 섹션 생략(기존 지표만).

### B2. 학습 세션 50/50 + 차트 2개 (`SessionListView`)
- 레이아웃 `1fr 360px` → `1fr 1fr`(좌 목록 절반, 우 절반).
- 우측 세로 스택 2개 차트:
  - ① 세션별 이해도 추이 — **라인만**(복습 바 제거).
  - ② 복습 필요 추이 — **영역(area) 차트**(세션별 `reviewRequiredCount`, 날짜 오름차순).

### B3. 취약 개념 레이아웃 (`WeakConceptsView`)
- 하단 `1fr 300px` → **5열 그리드**(`repeat(5, 1fr)`)로 TOP5 카드와 열 정렬.
  - 이해도 비교 막대 차트: `gridColumn: 'span 3'`(1~3열).
  - 4열: **세은 개념별 복습 추천** 리스트(한 줄씩).
  - 5열: **수철 개념별 복습 추천** 리스트.
- 참여자별 리스트는 `concepts`를 `scoreByParticipant[name]` 낮은 순 정렬, 취약(추천) 항목 우선 노출. 참여자가 2명이 아닐 경우(1명/3명+) → 존재하는 참여자 수만큼 열 배치(방어적).

---

## 배치 3C — Force-Directed Graph 정교화 (`ProblemDetailView`)

### C1. 관계도 개선
- **연결선 가시성**: `lineStyle`을 진하고 굵게(`color: '#9CA3AF'`, `width: 1.5`, `opacity: 0.7`, `curveness: 0`) → 선이 잘 보이게.
- **float 유지**: `force.layoutAnimation`은 기본(true) 유지 — 노드가 자연스럽게 떠다니는 움직임 보존.
- **호버 강조 유지 + 부드러운 페이드**:
  - `emphasis: { focus: 'adjacency' }` 유지(호버 노드 + 연결만 강조).
  - `series.stateAnimation: { duration: 250, easing: 'cubicOut' }` 추가 → 비강조 노드가 **즉시 사라지지 않고 빠르고 자연스럽게 페이드아웃**.
  - `blur` 상태 지정: 비강조 노드/선 opacity를 부드럽게 낮춤(`blur: { itemStyle: { opacity: 0.15 }, lineStyle: { opacity: 0.06 } }`).
  - `force.friction`을 약간 높여(예 `0.6`) 노드가 커서 밑에서 과도하게 휘청여 mouseenter/leave가 빠르게 토글되는 현상 완화(float 느낌은 유지).
- **노드 선택 강조**: 노드 클릭 시 `selectedNodeId` 저장. 선택된 노드의 `symbolSize`를 키워 강조. 개념 노드 선택 시에도 연결된 문제·다른 개념은 그대로 표시되며 선택 개념만 더 크게. 문제 노드 클릭은 기존처럼 상세 패널도 연다.

---

## 제약 (전 배치 공통)
- SQLP-FE는 git push 하지 않음(로컬 전용).
- 인라인 `:style={}` 패턴 유지, Tailwind 미사용.
- 새 npm 의존성 추가 없음.
- BE 변경 없음.
- 매 태스크 완료 후 Codex(codex-rescue) 리뷰.
