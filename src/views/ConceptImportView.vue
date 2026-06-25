<script setup lang="ts">
import { ref, computed } from "vue";
import type { CSSProperties } from "vue";
import { FileJson, CheckCircle, XCircle, Eye } from "lucide-vue-next";
import { normalizeConceptJson, hasConceptContent } from "@/domain/concept";
import ConceptSummaryContent from "@/components/ConceptSummaryContent.vue";
import type { ConceptDetail } from "@/domain/types";

type ParseStatus = "idle" | "ok" | "error";

// 너무 큰 파일에 대한 기본 방어 (개념 요약 JSON은 작다).
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

const PLACEHOLDER_JSON = `{
  "title": "옵티마이저",
  "subject": "SQLP",
  "chapter": "3과목 1장",
  "section": "1절",
  "summary": "옵티마이저는 SQL을 가장 효율적으로 실행하기 위한 실행 계획을 선택하는 핵심 구성 요소이다.",
  "easyExplanation": "여러 실행 방법 중 가장 효율적인 방법을 고르는 역할을 한다.",
  "keywords": ["옵티마이저", "실행계획", "비용 기반 최적화"],
  "sqlExamples": [
    {
      "title": "실행계획 확인 예시",
      "code": "EXPLAIN PLAN FOR SELECT * FROM EMP WHERE EMPNO = 7788;",
      "explanation": "옵티마이저가 어떤 실행 계획을 선택하는지 확인할 수 있다."
    }
  ],
  "mistakePoints": ["인덱스 스캔이 항상 Full Table Scan보다 빠르다고 오해하기 쉽다."],
  "memoryPoints": ["옵티마이저는 SQL 실행 계획을 선택한다."],
  "relatedConcepts": [{ "id": "execution-plan", "title": "실행계획" }]
}`;

const jsonText = ref("");
const status = ref<ParseStatus>("idle");
const errors = ref<string[]>([]);
const reading = ref(false);
const fileName = ref<string | null>(null);
const validatedConcept = ref<ConceptDetail | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);

const canPreview = computed(
  () => status.value === "ok" && !!validatedConcept.value && hasConceptContent(validatedConcept.value),
);

function resetValidation() {
  status.value = "idle";
  errors.value = [];
  validatedConcept.value = null;
}

function showError(messages: string[]) {
  status.value = "error";
  errors.value = messages;
  validatedConcept.value = null;
}

// 파일 업로드와 복붙이 공유하는 단일 파싱/검증 로직.
function validate() {
  if (!jsonText.value.trim()) {
    showError(["JSON 내용이 비어 있습니다."]);
    return;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText.value);
  } catch (error) {
    const message = error instanceof Error ? error.message : "JSON 파싱에 실패했습니다.";
    showError([`JSON 문법 오류입니다. ${message}`]);
    return;
  }

  // 개념 요약 스키마로 방어적 정규화 (title↔name, sqlExamples↔examples 등 모두 수용).
  const concept = normalizeConceptJson(parsed);
  if (!hasConceptContent(concept)) {
    showError([
      "개념 요약으로 표시할 데이터가 없습니다. (title/summary/keywords 등 필드를 확인하세요)",
    ]);
    return;
  }

  status.value = "ok";
  errors.value = [];
  validatedConcept.value = concept;
}

async function handleFile(file: File) {
  resetValidation();

  const isJson =
    file.name.toLowerCase().endsWith(".json") ||
    file.type === "application/json" ||
    file.type === "text/json";
  if (!isJson) {
    fileName.value = null;
    showError([".json 파일만 업로드할 수 있습니다."]);
    return;
  }

  if (file.size === 0) {
    fileName.value = null;
    showError(["빈 파일입니다."]);
    return;
  }

  if (file.size > MAX_FILE_SIZE) {
    fileName.value = null;
    showError(["파일이 너무 큽니다. (최대 2MB)"]);
    return;
  }

  fileName.value = file.name;
  reading.value = true;
  try {
    const text = await file.text();
    if (!text.trim()) {
      jsonText.value = "";
      showError(["JSON 파일 내용이 비어 있습니다."]);
      return;
    }
    // 파일 내용을 입력창에 반영 → 복붙 흐름과 동일하게 검증.
    jsonText.value = text;
    validate();
  } catch {
    showError(["JSON 파일을 읽지 못했습니다."]);
  } finally {
    reading.value = false;
  }
}

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) handleFile(file);
  // 같은 파일을 다시 선택해도 change가 발생하도록 초기화.
  input.value = "";
}

// 사용자가 입력을 수정하면 기존 검증/미리보기 결과를 무효화한다.
function onTextInput() {
  resetValidation();
}

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
</script>

<template>
  <div :style="{ width: '100%' }">
    <!-- Intro -->
    <div :style="{ marginBottom: '1.5rem' }">
      <p :style="{ color: '#6B7280', fontSize: '0.875rem', lineHeight: 1.6 }">
        외부 AI가 SQLP 교재를 개념 단위로 정리한 요약 JSON을 업로드하거나 직접 붙여넣어 개념 요약을 미리 확인하세요.
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
        💡 교재 PDF는 외부 AI로 개념 요약 JSON으로 변환한 뒤, 그 JSON만 이곳에 올리거나 붙여넣습니다. (PDF 직접 업로드 아님)
      </div>
    </div>

    <div
      :style="{
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
        padding: '1.5rem',
        marginBottom: '1.25rem',
      }"
    >
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

      <!-- Paste -->
      <label :style="{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }">
        JSON 직접 붙여넣기
      </label>
      <textarea
        v-model="jsonText"
        :placeholder="PLACEHOLDER_JSON"
        :style="{
          width: '100%',
          height: '240px',
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
        @input="onTextInput"
      />

      <!-- Action -->
      <div :style="{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }">
        <button :disabled="reading" :style="previewButtonStyle" @click="validate">
          <Eye :size="16" />
          미리보기 / 검증
        </button>
      </div>

      <!-- Error -->
      <div
        v-if="status === 'error'"
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
          <div :style="{ fontWeight: 600, marginBottom: '0.25rem' }">개념 JSON 오류</div>
          <ul :style="{ margin: 0, paddingLeft: '1.125rem' }">
            <li v-for="error in errors" :key="error">{{ error }}</li>
          </ul>
        </div>
      </div>

      <!-- OK -->
      <div
        v-else-if="status === 'ok'"
        :style="{
          marginTop: '1.25rem',
          backgroundColor: '#F0FDF4',
          border: '1px solid #BBF7D0',
          borderRadius: '8px',
          padding: '0.875rem 1.125rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.625rem',
          color: '#15803D',
          fontSize: '0.875rem',
          fontWeight: 600,
        }"
      >
        <CheckCircle :size="18" />
        올바른 개념 요약 JSON입니다. 아래에서 미리보기를 확인하세요.
      </div>
    </div>

    <!-- Preview (112번 개념 요약 페이지와 동일한 표시 구조) -->
    <div v-if="canPreview && validatedConcept">
      <div :style="{ fontSize: '0.8125rem', color: '#6B7280', fontWeight: 600, marginBottom: '0.75rem' }">
        개념 요약 미리보기
      </div>
      <ConceptSummaryContent :concept="validatedConcept" />
    </div>
  </div>
</template>
