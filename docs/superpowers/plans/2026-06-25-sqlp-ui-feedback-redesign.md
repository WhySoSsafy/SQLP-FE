# SQLP UI 피드백 반영 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 스터디 피드백을 반영해 4개 FE 페이지를 개선하고, 댓글·개념 생성 백엔드 2개를 추가한다.

**Architecture:** BE는 Django 5 + DRF + JWT(그룹 멀티테넌트), APIView + 서비스 함수 패턴. FE는 Vue 3 `<script setup>` + 인라인 스타일 + vue-echarts. 댓글은 `ProblemParticipant`에 FK로 붙고 participant.id로 식별. 각 테스크는 독립 검증(BE: Django test, FE: `vue-tsc --noEmit` + 수동) 후 Codex 컨펌.

**Tech Stack:** Django 5.0.6, DRF 3.15.1, simplejwt, SQLite/Postgres / Vue 3, TypeScript, vue-echarts(echarts 5.5), Vite.

## Global Constraints

- BE: 모든 쿼리는 `request.user.group` 스코프. 권한 `IsAuthenticated`. 뷰는 APIView. 시간 응답은 `dt.isoformat().replace("+00:00", "Z")`.
- BE 에러 envelope: `{"ok": false, "code", "message", "errors": [{path, message}]}` (기존 `common/exceptions.py` 사용).
- FE: 인라인 스타일 객체는 `CSSProperties` 호환. 색상 토큰 — gold `#C8962A`, 이해도색은 `understandingTone` 사용. API 호출은 `apiClient`(`src/api/`) 통해서.
- FE 검증: `npx vue-tsc --noEmit` 0 에러(기존 line 603 onGraphClick 에러는 Task 5에서 함께 정리).
- 커밋은 사용자가 요청할 때만. (이 플랜의 "Commit" 스텝은 사용자 승인 시 수행; 미승인 시 스킵하고 다음 테스크로.)
- 각 테스크 완료 시 Codex 컨펌(`codex:codex-rescue`)으로 검토.

---

### Task 1: BE — Comment 모델 + participant id 노출 + 마이그레이션

**Files:**
- Modify: `SQLP-BE/study/models.py` (Comment 모델 추가)
- Modify: `SQLP-BE/study/services/serialize.py` (`session_detail`의 participant dict에 `id` 추가)
- Test: `SQLP-BE/study/tests/test_comment_model.py` (또는 기존 테스트 위치 관례 따름)
- Create(자동): `SQLP-BE/study/migrations/000X_comment.py`

**Interfaces:**
- Produces: `study.models.Comment(participant FK, author FK, content, created_at)`; `session_detail()` participant dict에 `"id": int`.

- [ ] **Step 1: 모델 추가**

`study/models.py` 끝에:
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

- [ ] **Step 2: session_detail에 participant id 노출**

`study/services/serialize.py`의 participant 직렬화 dict에 `"id": participant.id` 추가(다른 participant 필드와 같은 dict).

- [ ] **Step 3: 마이그레이션 생성/적용**

Run: `cd SQLP-BE && python manage.py makemigrations study && python manage.py migrate`
Expected: `Create model Comment` 마이그레이션 생성, migrate OK.

- [ ] **Step 4: 모델 테스트 작성 및 실행**

```python
# study/tests/test_comment_model.py
import pytest
from django.contrib.auth import get_user_model
# ...팩토리/픽스처는 기존 테스트 관례 따름...

@pytest.mark.django_db
def test_comment_belongs_to_participant_and_author(participant_fixture, user_fixture):
    from study.models import Comment
    c = Comment.objects.create(participant=participant_fixture, author=user_fixture, content="확인했어요")
    assert c.participant.comments.count() == 1
    assert c.content == "확인했어요"
    assert c.created_at is not None
```
Run: `cd SQLP-BE && python manage.py test study` (또는 pytest). Expected: PASS.

- [ ] **Step 5: Codex 컨펌 → (승인 시) Commit**

```bash
git add SQLP-BE/study/models.py SQLP-BE/study/services/serialize.py SQLP-BE/study/migrations SQLP-BE/study/tests
git commit -m "feat(be): add Comment model and expose participant id"
```

---

### Task 2: BE — Comment 시리얼라이저 + 엔드포인트(목록/작성/삭제)

**Files:**
- Modify: `SQLP-BE/study/serializers.py` (CommentInput/Output)
- Modify: `SQLP-BE/study/views.py` (ParticipantCommentsView, CommentDetailView)
- Modify: `SQLP-BE/study/urls.py` (라우트 2개)
- Test: `SQLP-BE/study/tests/test_comment_api.py`

**Interfaces:**
- Consumes: `study.models.Comment` (Task 1).
- Produces: HTTP API
  - `GET  /api/participants/<int:participant_id>/comments/` → `[{id, content, author_id, author_name, created_at, is_mine}]`
  - `POST /api/participants/<int:participant_id>/comments/` body `{content}` → 201 생성 댓글
  - `DELETE /api/comments/<int:comment_id>/` → `{ok: true}` (author 또는 staff만)

- [ ] **Step 1: 시리얼라이저**

`study/serializers.py`:
```python
class CommentInputSerializer(serializers.Serializer):
    content = serializers.CharField(allow_blank=False, trim_whitespace=True)

class CommentOutputSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    content = serializers.CharField()
    author_id = serializers.IntegerField(allow_null=True)
    author_name = serializers.CharField()
    created_at = serializers.CharField()
    is_mine = serializers.BooleanField()
```

- [ ] **Step 2: 직렬화 헬퍼 + 뷰**

`study/views.py` (group 스코프, 404 가드):
```python
def _comment_dict(c, user):
    return {
        "id": c.id,
        "content": c.content,
        "author_id": c.author_id,
        "author_name": c.author.name if c.author else "(알 수 없음)",
        "created_at": c.created_at.isoformat().replace("+00:00", "Z"),
        "is_mine": c.author_id == user.id,
    }

class ParticipantCommentsView(APIView):
    permission_classes = [IsAuthenticated]

    def _participant(self, request, participant_id):
        return get_object_or_404(
            ProblemParticipant.objects.filter(problem__session__group=request.user.group),
            id=participant_id,
        )

    def get(self, request, participant_id):
        p = self._participant(request, participant_id)
        return Response([_comment_dict(c, request.user) for c in p.comments.select_related("author")])

    def post(self, request, participant_id):
        p = self._participant(request, participant_id)
        s = CommentInputSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        c = Comment.objects.create(participant=p, author=request.user, content=s.validated_data["content"])
        return Response(_comment_dict(c, request.user), status=status.HTTP_201_CREATED)

class CommentDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, comment_id):
        c = get_object_or_404(
            Comment.objects.filter(participant__problem__session__group=request.user.group),
            id=comment_id,
        )
        if c.author_id != request.user.id and not request.user.is_staff:
            return Response({"ok": False, "message": "본인 댓글만 삭제할 수 있습니다."}, status=403)
        c.delete()
        return Response({"ok": True})
```
(import: `from .models import ProblemParticipant, Comment`, `from .serializers import CommentInputSerializer`, `from rest_framework import status`, `get_object_or_404`.)

- [ ] **Step 3: URL 등록**

`study/urls.py`:
```python
path("participants/<int:participant_id>/comments/", ParticipantCommentsView.as_view()),
path("comments/<int:comment_id>/", CommentDetailView.as_view()),
```

- [ ] **Step 4: API 테스트(실패→통과)**

```python
# study/tests/test_comment_api.py
@pytest.mark.django_db
def test_create_list_delete_comment(auth_client, participant_fixture, user_fixture):
    url = f"/api/participants/{participant_fixture.id}/comments/"
    r = auth_client.post(url, {"content": "좋은 분석"}, format="json")
    assert r.status_code == 201
    cid = r.data["id"]
    assert auth_client.get(url).data[0]["content"] == "좋은 분석"
    assert auth_client.delete(f"/api/comments/{cid}/").status_code == 200

@pytest.mark.django_db
def test_cannot_delete_others_comment(auth_client, other_users_comment):
    r = auth_client.delete(f"/api/comments/{other_users_comment.id}/")
    assert r.status_code == 403

@pytest.mark.django_db
def test_comment_blank_rejected(auth_client, participant_fixture):
    r = auth_client.post(f"/api/participants/{participant_fixture.id}/comments/", {"content": "  "}, format="json")
    assert r.status_code == 400
```
Run: `cd SQLP-BE && python manage.py test study`. Expected: FAIL→(구현 후)PASS.

- [ ] **Step 5: Codex 컨펌 → (승인 시) Commit**

```bash
git add SQLP-BE/study
git commit -m "feat(be): comment list/create/delete endpoints"
```

---

### Task 3: BE — 개념 생성 API (`POST /api/concepts/`)

**Files:**
- Modify: `SQLP-BE/concepts/serializers.py` (ConceptCreateSerializer; 없으면 생성)
- Modify: `SQLP-BE/concepts/views.py` (ConceptCreateView 또는 기존 리스트뷰에 post 추가)
- Modify: `SQLP-BE/concepts/urls.py`
- Test: `SQLP-BE/concepts/tests/test_concept_create.py`

**Interfaces:**
- Produces: `POST /api/concepts/` body=개념 JSON → 201 `{id, name, ...}` (group 스코프, `group=request.user.group`).

- [ ] **Step 1: 입력 시리얼라이저**

`concepts/serializers.py` — `Concept` 모델 필드 매핑(name/subject/summary/frequent_question_types/confusing_points/wrong_patterns). FE 개념 JSON 키(`title`→name 등) 매핑은 뷰 또는 시리얼라이저 `to_internal_value`에서 처리. 기존 `Concept` 필드 기준 ModelSerializer 우선, 추가 alias만 보정.

- [ ] **Step 2: 뷰 + URL**

`concepts/views.py`:
```python
class ConceptCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        s = ConceptCreateSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        concept = s.save(group=request.user.group)  # 동일 name 존재 시 갱신 정책은 save에서
        return Response(ConceptCreateSerializer(concept).data, status=status.HTTP_201_CREATED)
```
`concepts/urls.py`에 `path("concepts/", ConceptCreateView.as_view())` 추가(기존 detail 라우트와 충돌 없게 정렬).

- [ ] **Step 3: 테스트(실패→통과)**

```python
@pytest.mark.django_db
def test_create_concept(auth_client):
    payload = {"title": "옵티마이저", "subject": "SQLP", "summary": "실행계획 선택"}
    r = auth_client.post("/api/concepts/", payload, format="json")
    assert r.status_code == 201
    from concepts.models import Concept
    assert Concept.objects.filter(name="옵티마이저").exists()
```
Run: `cd SQLP-BE && python manage.py test concepts`. Expected: FAIL→PASS.

- [ ] **Step 4: Codex 컨펌 → (승인 시) Commit**

```bash
git add SQLP-BE/concepts
git commit -m "feat(be): concept create endpoint"
```

---

### Task 4: FE — API 레이어(댓글/개념생성/participant id 매핑)

**Files:**
- Create: `SQLP-FE/src/api/comments.ts`
- Modify: `SQLP-FE/src/api/concepts.ts` (createConcept 추가)
- Modify: `SQLP-FE/src/api/endpoints.ts` (경로 상수)
- Modify: `SQLP-FE/src/api/index.ts` (export)
- Modify: `SQLP-FE/src/api/sessions.ts` (participant 매핑에 `id` 추가)
- Modify: `SQLP-FE/src/domain/types.ts` (Comment 타입, Participant에 `id?`)

**Interfaces:**
- Consumes: Task 2/3 엔드포인트.
- Produces:
  - `fetchComments(participantId: number): Promise<Comment[]>`
  - `createComment(participantId: number, content: string): Promise<Comment>`
  - `deleteComment(commentId: number): Promise<void>`
  - `createConcept(payload: unknown): Promise<unknown>`
  - `interface Comment { id:number; content:string; author_id:number|null; author_name:string; created_at:string; is_mine:boolean }`

- [ ] **Step 1: 타입 + endpoints**

`src/domain/types.ts`: `Comment` 인터페이스 추가; Participant 타입에 `id?: number` 추가.
`src/api/endpoints.ts`:
```ts
export const PARTICIPANT_COMMENTS_ENDPOINT = (pid: number | string) => `/api/participants/${pid}/comments/`;
export const COMMENT_DETAIL_ENDPOINT = (id: number | string) => `/api/comments/${id}/`;
export const CONCEPT_CREATE_ENDPOINT = "/api/concepts/";
```

- [ ] **Step 2: comments.ts + concepts.createConcept**

```ts
// src/api/comments.ts
import { apiClient } from "./client"; // 기존 클라이언트 경로 확인
import { PARTICIPANT_COMMENTS_ENDPOINT, COMMENT_DETAIL_ENDPOINT } from "./endpoints";
import type { Comment } from "@/domain/types";

export function fetchComments(pid: number): Promise<Comment[]> {
  return apiClient.get<Comment[]>(PARTICIPANT_COMMENTS_ENDPOINT(pid));
}
export function createComment(pid: number, content: string): Promise<Comment> {
  return apiClient.post<Comment>(PARTICIPANT_COMMENTS_ENDPOINT(pid), { content });
}
export function deleteComment(id: number): Promise<void> {
  return apiClient.delete<void>(COMMENT_DETAIL_ENDPOINT(id));
}
```
`src/api/concepts.ts`에 `export function createConcept(payload: unknown) { return apiClient.post(CONCEPT_CREATE_ENDPOINT, payload); }` 추가.
(실제 `apiClient` 메서드 시그니처는 기존 파일에서 확인 후 정합.)

- [ ] **Step 3: index export + session participant id 매핑**

`src/api/index.ts`에 comments 함수 + createConcept export. `src/api/sessions.ts`의 participant 매핑(약 line 50-60)에서 `id: pt.id` 추가.

- [ ] **Step 4: 타입체크**

Run: `cd SQLP-FE && npx vue-tsc --noEmit`. Expected: 신규 코드 에러 없음.

- [ ] **Step 5: Codex 컨펌 → (승인 시) Commit**

```bash
git add SQLP-FE/src/api SQLP-FE/src/domain/types.ts
git commit -m "feat(fe): comments/concept api layer + participant id"
```

---

### Task 5: FE — 문제별 이해도 모달 팝업 + 댓글 (F1)

**Files:**
- Modify: `SQLP-FE/src/views/ProblemDetailView.vue`

**Interfaces:**
- Consumes: Task 4 `fetchComments/createComment/deleteComment`, participant `id`.

- [ ] **Step 1: 사이드 패널 → 모달 전환**

기존 `detailPanelStyle` 사이드 패널 마크업 제거. 문제 표의 번호 클릭(또는 행 클릭) 시 `selected` 설정. `selected`가 있으면 화면 위 모달 오버레이 표시: 반투명 배경(`position:fixed; inset:0; background:rgba(0,0,0,0.4)`) + 중앙 카드(`max-width: 720px; max-height: 90vh; overflow:auto`). 배경 클릭/ESC/X 버튼으로 `selected=null`.

- [ ] **Step 2: 모달 본문**

큰 `{{ selected.problem_number }}번` + `subject_area`; 문제 본문(필드 있으면); 문제요약(`solution_summary`); 해설요약(별도 필드 없으면 생략 또는 동일값 1회만); 두 참여자 분석 카드(`understandingTone` 배지, 맞힌/놓친/오개념, 복습필요) — 기존 participant 섹션 마크업 재사용.

- [ ] **Step 3: 댓글 스레드(참여자 분석별)**

각 participant 카드 하단: `comments[participant.id]` 목록(author_name·created_at·내용, is_mine이면 삭제 버튼) + textarea/입력 + "댓글 작성". `selected` 변경 시 각 participant.id로 `fetchComments` 로드. 작성=`createComment` 후 목록 갱신, 삭제=`deleteComment` 후 갱신. 빈 내용 비활성.

- [ ] **Step 4: 기존 타입 에러 정리**

`@click="onGraphClick"` 핸들러 시그니처를 ECharts 타입과 정합(예: `params: any` 또는 `import type { ECElementEvent }` 사용해 `params.data` 옵셔널 처리). `vue-tsc --noEmit` 0 에러 목표.

- [ ] **Step 5: 타입체크 + 수동 확인**

Run: `cd SQLP-FE && npx vue-tsc --noEmit`. Expected: 0 에러. 수동: 문제 클릭→모달, 댓글 작성/삭제 동작.

- [ ] **Step 6: Codex 컨펌 → (승인 시) Commit**

```bash
git add SQLP-FE/src/views/ProblemDetailView.vue
git commit -m "feat(fe): problem detail modal with comments"
```

---

### Task 6: FE — 취약 개념 5열 재배치 + 그라데이션 (F2)

**Files:**
- Modify: `SQLP-FE/src/views/WeakConceptsView.vue`

- [ ] **Step 1: 그리드 컨테이너**

TOP5 섹션과 차트/추천 섹션을 하나의 `display:grid; gridTemplateColumns: repeat(5,1fr); gap` 컨테이너로 통합. 좁은 폭 폴백(선택): `@media`/최소 방어.

- [ ] **Step 2: TOP5 세로 + 그라데이션**

TOP5 카드 컨테이너: `gridColumn:'1'; gridRow:'1 / span 2'; display:flex; flexDirection:'column'; gap`. 각 카드 배경 = 순위 그라데이션 함수:
```ts
const RANK_BG = ["#FCA5A5", "#FDBA74", "#FCD34D", "#FDE68A", "#FEF3C7"]; // 탑1→탑5
const rankBg = (i: number) => RANK_BG[i] ?? "#FEF3C7";
```
카드 배경에 `rankBg(i)` 적용(텍스트 가독 위해 진한 글자색 유지). 순위 배지 유지.

- [ ] **Step 3: 차트 풀폭 + 추천 좌우 분리**

차트 패널: `gridColumn:'2 / span 4'; gridRow:'1'`. 세은 복습추천: `gridColumn:'2 / span 2'; gridRow:'2'`, 수철: `gridColumn:'4 / span 2'; gridRow:'2'`. 각 추천 패널 내부 카드 목록을 `display:grid; gridTemplateColumns:'1fr 1fr'`(2열).

- [ ] **Step 4: 타입체크 + 수동**

Run: `cd SQLP-FE && npx vue-tsc --noEmit`. Expected: 0 에러. 수동: 레이아웃·그라데이션·풀폭 차트 확인.

- [ ] **Step 5: Codex 컨펌 → (승인 시) Commit**

```bash
git add SQLP-FE/src/views/WeakConceptsView.vue
git commit -m "feat(fe): weak-concepts vertical top5 + gradient + full-width chart"
```

---

### Task 7: FE — 오답노트 사용자별 2열 (F3)

**Files:**
- Modify: `SQLP-FE/src/views/WrongAnswersView.vue`

- [ ] **Step 1: 참여자 분리 computed**

`filtered`를 참여자별로 그룹화. 참여자 목록 = 아이템 `person` distinct(상위 2명). `byPerson = computed(() => persons.map(p => ({ person: p, items: filtered.value.filter(i => i.person === p) })))`. 3명+ 폴백: 첫 2명만 2열, 또는 단순화해 처음 2명.

- [ ] **Step 2: 2열 마크업**

카드 컨테이너를 `display:grid; gridTemplateColumns:'1fr 1fr'; gap` 2열로. 각 열: 상단 참여자 이름 헤더 + 그 아래 해당 person 카드 세로 나열(기존 카드 마크업 재사용). 빈 열은 "해당 오답 없음" 표시.

- [ ] **Step 3: 타입체크 + 수동**

Run: `cd SQLP-FE && npx vue-tsc --noEmit`. Expected: 0 에러. 수동: 좌우 분리·필터 동작·체크 동작.

- [ ] **Step 4: Codex 컨펌 → (승인 시) Commit**

```bash
git add SQLP-FE/src/views/WrongAnswersView.vue
git commit -m "feat(fe): wrong-answers split by participant into two columns"
```

---

### Task 8: FE — 등록 폼 통일 + 개념 등록하기 (F4)

**Files:**
- Modify: `SQLP-FE/src/views/JsonRegistrationView.vue`
- Modify: `SQLP-FE/src/views/ConceptImportView.vue`

**Interfaces:**
- Consumes: Task 4 `createConcept`.

- [ ] **Step 1: textarea 높이 통일**

양쪽 textarea `height:'260px'`로 통일(개념 240→260).

- [ ] **Step 2: 검증 버튼 라벨 통일**

문제 버튼 "형식 검증하기"→"미리보기 검증"(검증 중 "검증 중..." 유지). 개념 버튼 "미리보기 / 검증"→"미리보기 검증".

- [ ] **Step 3: 개념 등록하기 버튼**

ConceptImportView에 등록 버튼 추가(문제 폼 버튼 스타일 재사용). 활성 조건 = `canPreview`(검증 통과). 클릭 핸들러:
```ts
async function registerConcept() {
  if (!validatedConcept.value) return;
  registering.value = true;
  try {
    await createConcept(validatedConcept.value);
    registered.value = true;
  } catch (e) { /* 에러 envelope 표시 (문제 폼 패턴 재사용) */ }
  finally { registering.value = false; }
}
```
성공/에러 안내 UI 추가(문제 폼의 성공/에러 박스 패턴 재사용). 상태 ref(`registering`, `registered`) 추가.

- [ ] **Step 4: 타입체크 + 수동**

Run: `cd SQLP-FE && npx vue-tsc --noEmit`. Expected: 0 에러. 수동: 두 폼 높이 동일·라벨 통일·개념 등록 동작.

- [ ] **Step 5: Codex 컨펌 → (승인 시) Commit**

```bash
git add SQLP-FE/src/views/JsonRegistrationView.vue SQLP-FE/src/views/ConceptImportView.vue
git commit -m "feat(fe): unify register forms + concept register button"
```

---

## Self-Review (작성자 점검 결과)

- **스펙 커버리지**: B1→Task1·2, B2→Task3, F1→Task4·5, F2→Task6, F3→Task7, F4→Task4·8. 전 항목 매핑됨.
- **플레이스홀더**: BE 일부 픽스처/시리얼라이저 매핑은 "기존 관례 따름"으로 표기 — 코드베이스 의존 부분이라 구현 시 확정(허용). 그 외 구체 코드 제공.
- **타입 일관성**: `Comment` 형태(id/content/author_id/author_name/created_at/is_mine)가 BE Task2 `_comment_dict`와 FE Task4 인터페이스 일치. participant `id`가 Task1(노출)→Task4(매핑)→Task5(사용) 일관.
- **의존 순서**: 1→2→3(BE), 4(API)는 2·3 후, 5는 4 후, 6/7/8은 독립(6·7은 4 불필요, 8은 4 필요).
