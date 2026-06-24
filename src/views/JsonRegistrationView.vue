<script setup lang="ts">
import { ref, computed } from "vue";
import type { CSSProperties } from "vue";
import { Upload, FileJson, CheckCircle, XCircle, Tag } from "lucide-vue-next";
import type { LearningSession, RawLearningSession, ValidationPreview } from "@/domain/types";
import { createPreview, normalizeSession } from "@/domain/validation";
import { saveSession } from "@/domain/storage";
import { validateAnalysisJson, toApiError } from "@/api";
import { useSessionsStore } from "@/stores/sessions";

const sessions = useSessionsStore();

const PLACEHOLDER_JSON = `{
  "session_date": "2026-06-12",
  "book": "SQLP 실전문제",
  "speakers": ["세은", "수철"],
  "problems": [
    {
      "problem_number": 1,
      "subject_area": "SQL 기본 및 활용",
      "concepts": ["OUTER JOIN", "NULL"],
      "solution_summary": "OUTER JOIN 조건과 NULL 처리 순서를 확인하는 문제입니다.",
      "participants": [
        {
          "name": "세은",
          "is_correct": false,
          "understanding": "애매",
          "concepts_covered": ["OUTER JOIN"],
          "concepts_missed": ["NULL"],
          "errors": ["NULL 비교 조건을 잘못 해석함"],
          "review_required": true
        },
        {
          "name": "수철",
          "is_correct": true,
          "understanding": "잘함",
          "concepts_covered": ["OUTER JOIN", "NULL"],
          "concepts_missed": [],
          "errors": [],
          "review_required": false
        }
      ]
    }
  ]
}`;

type Tab = "file" | "paste";
type ValidateStatus = null | "ok" | "error";

const activeTab = ref<Tab>("paste");
const jsonText = ref("");
const isDragging = ref(false);
const fileName = ref<string | null>(null);
const validateStatus = ref<ValidateStatus>(null);
const validationErrors = ref<string[]>([]);
const serverMessage = ref<string | null>(null);
const preview = ref<ValidationPreview | null>(null);
const validatedSession = ref<LearningSession | null>(null);
const validating = ref(false);
const registered = ref(false);
const registering = ref(false);
const registerNotice = ref<string | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);

// 등록 버튼은 검증 전에도 누를 수 있게 두고(누르면 "먼저 검증" 안내),
// 실제 저장은 handleRegister에서 검증 통과 여부로 가드한다.
// 검증/등록 진행 중이거나 이미 등록 완료된 경우에만 비활성화한다.
const registerDisabled = computed(
  () => registered.value || registering.value || validating.value
);

const resetValidation = () => {
  validateStatus.value = null;
  validationErrors.value = [];
  serverMessage.value = null;
  registerNotice.value = null;
  preview.value = null;
  validatedSession.value = null;
  registered.value = false;
};

const showError = (errors: string[]) => {
  validateStatus.value = "error";
  validationErrors.value = errors;
  serverMessage.value = null;
  registerNotice.value = null;
  preview.value = null;
  validatedSession.value = null;
  registered.value = false;
};

const handleValidate = async () => {
  if (validating.value) return;

  registerNotice.value = null;

  // 1) API 호출 전 프론트 기본 JSON 파싱 가드.
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText.value);
  } catch (error) {
    const message = error instanceof Error ? error.message : "JSON 파싱에 실패했습니다.";
    showError([`$: JSON 문법 오류입니다. ${message}`]);
    return;
  }

  // 2) 백엔드 검증 호출. (응답 스키마 미확정 → 방어적으로 해석)
  validating.value = true;
  try {
    const response = await validateAnalysisJson(parsed);

    const serverErrors = Array.isArray(response?.errors) ? response.errors : [];
    const isOk = response?.ok !== false && serverErrors.length === 0;

    if (!isOk) {
      showError(
        serverErrors.length > 0
          ? serverErrors.map((error) => `${error.path}: ${error.message}`)
          : [response?.message ?? "JSON 검증에 실패했습니다."],
      );
      return;
    }

    // 등록(saveSession)에 필요한 세션 객체 확보: 백엔드가 주면 그대로, 아니면 클라이언트에서 정규화.
    let session: LearningSession | null = response?.session ?? null;
    if (!session) {
      try {
        session = normalizeSession(parsed as RawLearningSession);
      } catch {
        session = null;
      }
    }

    validateStatus.value = "ok";
    validationErrors.value = [];
    serverMessage.value = response?.message ?? null;
    preview.value = session ? createPreview(session) : response?.preview ?? null;
    validatedSession.value = session;
    registered.value = false;
  } catch (error) {
    // API 에러(검증 실패 envelope 포함)도 화면이 깨지지 않게 처리한다.
    const apiError = toApiError(error);
    showError(
      apiError.fieldErrors.length > 0
        ? apiError.fieldErrors.map((field) => `${field.path}: ${field.message}`)
        : [apiError.message || "JSON 검증 요청에 실패했습니다."],
    );
  } finally {
    validating.value = false;
  }
};

const handleRegister = async () => {
  // 중복 제출 / 진행 중 / 이미 등록 완료 가드.
  if (registering.value || validating.value || registered.value) {
    return;
  }

  registerNotice.value = null;

  // 검증이 통과하지 않은 JSON은 저장하지 않는다. 검증 결과가 없으면 먼저 검증을 안내한다.
  const session = validatedSession.value;
  if (validateStatus.value !== "ok" || !session) {
    registerNotice.value = "먼저 ‘형식 검증하기’로 검증을 완료한 뒤 등록해주세요.";
    return;
  }

  registering.value = true;
  try {
    // 실제 세션 저장은 /api/sessions/ POST (domain saveSession → api createSession).
    const result = await saveSession(session);

    if (!result.ok) {
      showError([result.error ?? "학습 세션 저장에 실패했습니다."]);
      return;
    }

    registered.value = true;
    // 저장 성공 후 세션 목록 갱신 (선택 세션 id는 saveSession이 이미 갱신).
    await sessions.refresh();
  } finally {
    registering.value = false;
  }
};

const handleFile = (file: File) => {
  resetValidation();

  if (!file.name.toLowerCase().endsWith(".json")) {
    fileName.value = null;
    jsonText.value = "";
    showError(["$: .json 파일만 업로드할 수 있습니다."]);
    return;
  }

  fileName.value = file.name;
  const reader = new FileReader();

  reader.onload = (e) => {
    const text = typeof e.target?.result === "string" ? e.target.result : "";

    jsonText.value = text;

    if (!text.trim()) {
      showError(["$: JSON 파일 내용이 비어 있습니다."]);
    }
  };
  reader.onerror = () => {
    fileName.value = null;
    jsonText.value = "";
    showError(["$: JSON 파일을 읽지 못했습니다."]);
  };
  reader.readAsText(file);
};

const handleTabChange = (tab: Tab) => {
  activeTab.value = tab;
  jsonText.value = "";
  fileName.value = null;
  if (fileInput.value) {
    fileInput.value.value = "";
  }
  resetValidation();
};

const previewRows = computed(() => {
  if (!preview.value) return [];
  const speakers = validatedSession.value?.speakers ?? [];
  return [
    { label: "검증 상태", value: "정상" },
    { label: "학습 날짜", value: preview.value.sessionDate },
    { label: "문제집명", value: preview.value.book },
    { label: "문제 수", value: `${preview.value.problemCount}문제` },
    {
      label: "참여자 수",
      value:
        speakers.length > 0
          ? `${preview.value.participantCount}명 (${speakers.join(", ")})`
          : `${preview.value.participantCount}명`,
    },
  ];
});

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

const dropZoneStyle = computed<CSSProperties>(() => ({
  border: `2px dashed ${isDragging.value ? "#C8962A" : "#D1D5DB"}`,
  borderRadius: "10px",
  padding: "3rem 2rem",
  textAlign: "center" as const,
  cursor: "pointer",
  backgroundColor: isDragging.value ? "#FEF8EC" : "#F9FAFB",
  transition: "all 0.15s",
}));

const registerButtonStyle = computed<CSSProperties>(() => ({
  padding: "0.6875rem 1.25rem",
  border: "none",
  borderRadius: "8px",
  backgroundColor: registerDisabled.value ? "#D1D5DB" : "#C8962A",
  color: registerDisabled.value ? "#9CA3AF" : "#FFFFFF",
  fontSize: "0.875rem",
  fontWeight: 600,
  cursor: registerDisabled.value ? "not-allowed" : "pointer",
  display: "flex",
  alignItems: "center",
  gap: "0.375rem",
}));
</script>

<template>
  <div style="max-width: 860px">
    <div style="margin-bottom: 1.5rem">
      <p style="color: #6b7280; font-size: 0.875rem; line-height: 1.6">
        외부 AI에서 생성한 SQLP 풀이 분석 JSON을 업로드하거나 직접 붙여넣어 학습 기록으로 등록하세요.
      </p>
      <div
        :style="{
          marginTop: '0.75rem',
          backgroundColor: '#F1F5F9',
          borderRadius: '8px',
          padding: '0.75rem 1rem',
          fontSize: '0.8125rem',
          color: '#475569',
          borderLeft: '3px solid #C8962A',
        }"
      >
        💡 문제 이미지, 정답/해설 파일, STT 텍스트, 분석 프롬프트는 외부 AI에 먼저 입력하고, 생성된 JSON 결과만 이곳에 등록합니다.
      </div>
    </div>

    <div
      :style="{
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
        overflow: 'hidden',
      }"
    >
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

      <div style="padding: 1.5rem">
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

        <!-- Buttons -->
        <div :style="{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }">
          <button
            :disabled="validating"
            :style="{
              padding: '0.6875rem 1.25rem',
              border: '1.5px solid #C8962A',
              borderRadius: '8px',
              backgroundColor: '#FFFFFF',
              color: '#C8962A',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: validating ? 'not-allowed' : 'pointer',
              opacity: validating ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
            }"
            @click="handleValidate"
          >
            <CheckCircle :size="16" />
            {{ validating ? "검증 중..." : "형식 검증하기" }}
          </button>
          <button
            :disabled="registerDisabled"
            :style="registerButtonStyle"
            @click="handleRegister"
          >
            <Upload :size="16" />
            {{ registering ? "등록 중..." : "학습 기록 등록하기" }}
          </button>
        </div>

        <!-- Register guidance notice (e.g. validate first) -->
        <div
          v-if="registerNotice"
          :style="{
            marginTop: '1.25rem',
            backgroundColor: '#F1F5F9',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            padding: '0.875rem 1.125rem',
            color: '#475569',
            fontSize: '0.875rem',
            borderLeft: '3px solid #C8962A',
          }"
        >
          {{ registerNotice }}
        </div>

        <!-- Validation error result -->
        <div
          v-if="validateStatus === 'error'"
          :style="{
            marginTop: '1.25rem',
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: '8px',
            padding: '0.875rem 1.125rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.625rem',
            color: '#DC2626',
            fontSize: '0.875rem',
          }"
        >
          <XCircle :size="18" :style="{ flexShrink: 0, marginTop: '0.0625rem' }" />
          <div>
            <div :style="{ fontWeight: 600, marginBottom: '0.25rem' }">JSON 형식 오류</div>
            <ul :style="{ margin: 0, paddingLeft: '1.125rem' }">
              <li v-for="error in validationErrors" :key="error">{{ error }}</li>
            </ul>
          </div>
        </div>

        <!-- Validation success + preview -->
        <div
          v-if="validateStatus === 'ok' && preview && !registered"
          :style="{
            marginTop: '1.25rem',
            backgroundColor: '#F0FDF4',
            border: '1px solid #BBF7D0',
            borderRadius: '8px',
            padding: '0.875rem 1.125rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.625rem',
            color: '#15803D',
            fontSize: '0.875rem',
          }"
        >
          <CheckCircle :size="18" :style="{ flexShrink: 0, marginTop: '0.0625rem' }" />
          <div>
            <div :style="{ fontWeight: 600, marginBottom: '0.875rem' }">
              {{ serverMessage ?? "JSON 검증을 통과했습니다. 학습 기록으로 등록할 수 있어요." }}
            </div>
            <!-- Preview -->
            <div
              :style="{
                backgroundColor: '#FFFFFF',
                borderRadius: '8px',
                padding: '1rem',
                border: '1px solid #D1FAE5',
                color: '#374151',
              }"
            >
              <div
                :style="{
                  fontWeight: 600,
                  color: '#111827',
                  marginBottom: '0.75rem',
                  fontSize: '0.9375rem',
                }"
              >
                학습 기록 미리보기
              </div>
              <div
                :style="{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.5rem 1.5rem',
                }"
              >
                <div
                  v-for="(row, i) in previewRows"
                  :key="i"
                  :style="{ display: 'flex', gap: '0.5rem' }"
                >
                  <span :style="{ fontSize: '0.8125rem', color: '#6B7280', minWidth: '70px' }">{{ row.label }}</span>
                  <span :style="{ fontSize: '0.8125rem', fontWeight: 500, color: '#111827' }">{{ row.value }}</span>
                </div>
              </div>
              <div
                v-if="preview.conceptTags && preview.conceptTags.length"
                :style="{ marginTop: '0.75rem' }"
              >
                <span
                  :style="{
                    fontSize: '0.8125rem',
                    color: '#6B7280',
                    marginBottom: '0.375rem',
                    display: 'block',
                  }"
                >주요 개념 태그</span>
                <div :style="{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }">
                  <span
                    v-for="tag in preview.conceptTags"
                    :key="tag"
                    :style="{
                      backgroundColor: '#FEF3C7',
                      color: '#92690B',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      padding: '0.1875rem 0.625rem',
                      borderRadius: '999px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                    }"
                  >
                    <Tag :size="10" />
                    {{ tag }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Registered success -->
        <div
          v-if="registered"
          :style="{
            marginTop: '1.25rem',
            backgroundColor: '#FEF8EC',
            border: '1px solid #FDE68A',
            borderRadius: '8px',
            padding: '0.875rem 1.125rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
            color: '#92690B',
            fontSize: '0.875rem',
            fontWeight: 600,
          }"
        >
          ✅ 학습 기록이 성공적으로 등록되었습니다! 학습 세션 목록에서 확인하세요.
        </div>
      </div>
    </div>
  </div>
</template>
