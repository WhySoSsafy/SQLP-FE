# SQLP UI 피드백 반영 — 설계 문서

- 작성일: 2026-06-25
- 범위: SQLP-FE (Vue 3 + TS + vue-echarts), SQLP-BE (Django 5 + DRF + JWT, group 멀티테넌트)
- 진행: 설계 확정 → 일괄 구현. 서브에이전트 드라이브, 각 테스크마다 Codex 컨펌.

## 배경

스터디 피드백 녹취(`da.md` 및 후속 녹취)를 반영한 4개 페이지 UI 개선 + 2개 백엔드 기능 추가.
이미 완료된 선행 작업(이 문서 범위 밖, 유지):
- force graph 엣지 호버 깜빡임 제거(링크 `emphasis.disabled`). 라벨 호버 분리는 ECharts 제약으로 **현 상태 유지**(변경 없음) 결정.
- 오답노트 이해도 태그 색상 구분(`understandingTone`) + 해설 박스 배경색(연파랑) + 관련/놓친/오개념 한 줄 — 완료.

---

## 백엔드 (SQLP-BE)

### B1. 댓글(Comment) API

문제별 이해도 모달에서 각 참여자 분석(`ProblemParticipant`)에 댓글을 달고 조회/삭제.

**모델** (`study/models.py`)
```python
class Comment(models.Model):
    participant = models.ForeignKey(
        ProblemParticipant, on_delete=models.CASCADE, related_name="comments"
    )
    author = models.ForeignKey(
        "accounts.User", null=True, on_delete=models.SET_NULL, related_name="comments"
    )
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]
```

**participant id 노출**: `study/services/serialize.py`의 `session_detail()`가 각 participant dict에 `"id": participant.id`를 포함하도록 추가(FE가 댓글 대상 식별).

**시리얼라이저** (`study/serializers.py`)
- `CommentInputSerializer`: `content`(CharField, allow_blank=False, trim).
- `CommentOutputSerializer`/서비스 dict: `id`, `content`, `author_id`, `author_name`(author.name 또는 탈퇴 시 "(알 수 없음)"), `created_at`(ISO `...Z`), `is_mine`(author == request.user).

**엔드포인트** (`study/urls.py`, APIView, `IsAuthenticated`, group 스코프)
- `GET  /api/participants/<int:participant_id>/comments/` — 목록(created_at 오름차순)
- `POST /api/participants/<int:participant_id>/comments/` — 작성(201, 생성된 댓글 반환)
- `DELETE /api/comments/<int:comment_id>/` — 삭제(본인 author 또는 is_staff만, 아니면 403)

**스코프/권한**: participant는 `participant.problem.session.group == request.user.group`인 것만 접근(아니면 404). 작성 시 `author=request.user`.

**마이그레이션**: `python manage.py makemigrations study && migrate`.

**OpenAPI**: 기존 관례대로 `@extend_schema` + 필요 시 `schema_serializers.py` 추가.

### B2. 개념 생성(Concept create) API

"개념 등록하기" 버튼이 실제 개념을 저장하도록.

**엔드포인트** (`concepts/urls.py`, APIView, `IsAuthenticated`)
- `POST /api/concepts/` — 검증된 개념 JSON을 `Concept`로 저장, group 스코프(`group=request.user.group`). 201 + 생성 결과.
- 입력 시리얼라이저: 기존 `Concept` 필드(name/title→name, subject, summary, frequent_question_types, confusing_points, wrong_patterns 등) 매핑. FE 개념 JSON 스키마(`normalizeConceptJson` 결과)와 정합.
- 중복(같은 group + name) 처리 정책: 동일 name 존재 시 업데이트 또는 409 — **구현 시 기존 검증 관례 따라 결정**(기본: 같은 name이면 갱신).

> 참고: FE 개념 JSON 스키마는 `src/domain/concept.ts`/`ConceptSummaryContent.vue` 기준. BE `Concept` 모델 필드와의 매핑은 구현 시 정합성 확인.

---

## 프런트엔드 (SQLP-FE)

### F1. 문제별 이해도 (`ProblemDetailView.vue`)

- 좌측 전체 문제 표 + 우측 force graph **유지**.
- 변경: 문제 번호(표의 번호 셀 또는 행) 클릭 시 화면 위 **모달 팝업** 오픈. 기존 360px 사이드 패널(`detailPanelStyle` 및 관련 마크업) **제거**.
- 모달 구성(세로):
  1. 헤더: 큰 "{problem_number}번" + `subject_area` + 닫기(X), 배경 오버레이 클릭/ESC 닫기.
  2. (개념 교재/문제 본문이 있으면) 문제 본문. *현재 데이터 모델에 문제 본문 필드 없음 → 있으면 표시, 없으면 생략(graceful).*
  3. 문제 요약 / 해설 요약. *현재 두 섹션 모두 `solution_summary`에 바인딩되어 중복(기존 버그). 구현 시: 별도 해설 필드 없으면 "문제 요약"만 표시하거나 적절히 매핑 — 구현 중 데이터 확인.*
  4. **두 참여자 분석 카드**(speakers별): 이해도 배지(`understandingTone`), 맞힌/놓친/오개념, 복습 필요.
  5. 각 분석 카드 하단 **댓글 스레드**: 목록(작성자·시간) + 입력창 + 작성 버튼 + 본인 댓글 삭제. B1 API 연동.
- 댓글 API: `src/api/comments.ts` 신설(`fetchComments(participantId)`, `createComment(participantId, content)`, `deleteComment(commentId)`), `src/api/endpoints.ts`에 경로 추가, `src/api/index.ts` export.
- participant `id`는 session detail에서 받음(B1). `fetchSessionDetail` 매핑(`src/api/sessions.ts`)에 participant `id` 추가.

### F2. 취약 개념 (`WeakConceptsView.vue`)

5열 그리드 재배치(`grid-template-columns: repeat(5, 1fr)`):
- **1열**(세로, `grid-row: 1 / span 2`): 취약 개념 TOP5 카드 5개 세로 스택. 배경 **순위 그라데이션**(탑1 진하게/강렬 → 탑5 연하게). 예: 탑1 `#FCA5A5` → 탑2 `#FDBA74` → 탑3 `#FCD34D` → 탑4 `#FDE68A` → 탑5 `#FEF3C7`(또는 단일 색조 농담). 텍스트 가독성 유지.
- **2~5열 상단**(`grid-column: 2 / span 4`, row1): "개념별 이해도 비교" 차트 풀폭.
- **하단**(row2): 세은 복습추천(`grid-column: 2 / span 2`) / 수철 복습추천(`grid-column: 4 / span 2`) 좌우 분리. 각 패널 내부는 카드 **2열 그리드**.
- 상단 필터 토글(전체/참여자) 유지. `topParticipants`(상위 2명) 사용 유지.
- 반응형: 좁은 폭에서 1열로 무너지도록 최소한의 방어(선택).

### F3. 오답노트 (`WrongAnswersView.vue`)

- 상단 필터 탭(전체/틀린/애매/모름/복습완료) **유지**.
- 카드 영역: 한 장이 좌우 풀폭 → **2열 그리드**. 왼쪽=참여자A, 오른쪽=참여자B. 각 열 상단에 참여자 이름 헤더, 그 아래 해당 참여자의 (필터 적용된) 오답 카드 세로 나열.
- 참여자 구분: `WrongAnswerItem.person` 사용. 참여자 목록은 세션 speakers/아이템에서 도출(상위 2명; 3명+는 구현 시 정책 — 기본 첫 2명, 나머지는 기존처럼 단일 열 폴백 가능).
- 해설 박스 배경(연파랑 `#EFF6FF`) 유지(완료됨).
- 복습완료 체크 버튼은 각 카드 내부 유지(2열로 좁아져 접근성 개선).

### F4. 등록 (`RegisterView.vue` / `JsonRegistrationView.vue` / `ConceptImportView.vue`)

- **textarea 높이 통일**: 양쪽 동일(260px). (현재 문제 260 / 개념 240)
- **검증 버튼 라벨 통일**: 둘 다 "미리보기 검증". (현재 문제 "형식 검증하기" / 개념 "미리보기 / 검증")
- **등록 버튼 양쪽 배치**:
  - 문제: "학습 기록 등록하기"(기존 `handleRegister` 유지).
  - 개념: "개념 등록하기" 신규 — 검증 통과(`validatedConcept`) 후 활성, 클릭 시 B2 `POST /api/concepts/` 호출. FE api: `src/api/concepts.ts`에 `createConcept(payload)` 추가 + endpoints + index export. 성공/실패 안내 UI(문제 폼의 성공/에러 패턴 재사용).

---

## 데이터 플로우 / 식별자 요약

- 댓글 대상 = `ProblemParticipant.id`(BigAutoField, 전역 유일). FE는 session detail로 problem→participants[].id 확보 후 댓글 API 호출.
- 인증: JWT(`request.user`), 모든 쿼리 group 스코프.
- 응답 시간 포맷: `created_at.isoformat().replace("+00:00","Z")`.

## 에러 처리

- 댓글 작성 빈 내용 차단(FE+BE). 삭제 권한 없으면 403.
- 개념 생성 실패(검증/중복) 시 기존 에러 envelope(`{ok:false, code, message, errors[]}`) 표시.
- 모달/패널: 데이터 없음·로딩·에러 상태 graceful.

## 테스트 전략

- BE: Comment 모델/엔드포인트 단위 테스트(작성/목록/삭제 권한/group 스코프), Concept 생성 테스트. 기존 테스트 관례 따름.
- FE: `vue-tsc --noEmit` 타입 클린, 주요 상호작용 수동 확인(모달 open/close, 댓글 CRUD, 등록).
- 각 테스크 완료 시 Codex 컨펌.

## 알려진 데이터 한계(구현 중 확인)

1. 문제 본문 필드 부재 — 모달에서 있으면 표시, 없으면 생략.
2. 문제요약/해설요약이 동일 `solution_summary` 바인딩(기존 중복 버그) — 구현 시 매핑 정리.
3. 개념 JSON 스키마 ↔ BE `Concept` 필드 매핑 정합성 — 구현 시 확인.

## 비범위(YAGNI)

- 댓글 수정(edit), 대댓글/스레드 트리, 알림.
- force graph 라벨 호버 분리(현 상태 유지 확정).
- 과목/장 단위 드릴다운 차트(미래 과제로 언급됨, 이번 제외).
