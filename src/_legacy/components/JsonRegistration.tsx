import { useState, useRef } from "react";
import { Upload, FileJson, CheckCircle, XCircle, Tag } from "lucide-react";
import type { LearningSession, ValidationPreview } from "../domain/types";
import { parseAndValidateSession } from "../domain/validation";
import { saveSession } from "../domain/storage";

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

interface Props {
  onSessionsChanged: () => void;
}

export default function JsonRegistration({ onSessionsChanged }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("paste");
  const [jsonText, setJsonText] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [validateStatus, setValidateStatus] = useState<ValidateStatus>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [preview, setPreview] = useState<ValidationPreview | null>(null);
  const [validatedSession, setValidatedSession] = useState<LearningSession | null>(null);
  const [registered, setRegistered] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const registerDisabled = validateStatus !== "ok" || !validatedSession || registered;

  const resetValidation = () => {
    setValidateStatus(null);
    setValidationErrors([]);
    setPreview(null);
    setValidatedSession(null);
    setRegistered(false);
  };

  const showError = (errors: string[]) => {
    setValidateStatus("error");
    setValidationErrors(errors);
    setPreview(null);
    setValidatedSession(null);
    setRegistered(false);
  };

  const handleValidate = () => {
    const result = parseAndValidateSession(jsonText);

    if (!result.ok) {
      showError(result.errors.map((error) => `${error.path}: ${error.message}`));
      return;
    }

    setValidateStatus("ok");
    setValidationErrors([]);
    setPreview(result.preview ?? null);
    setValidatedSession(result.session ?? null);
    setRegistered(false);
  };

  const handleRegister = () => {
    if (registerDisabled) {
      return;
    }

    const result = saveSession(validatedSession);

    if (!result.ok) {
      showError([result.error ?? "학습 세션 저장에 실패했습니다."]);
      return;
    }

    setRegistered(true);
    onSessionsChanged();
  };

  const handleFile = (file: File) => {
    resetValidation();

    if (!file.name.toLowerCase().endsWith(".json")) {
      setFileName(null);
      setJsonText("");
      showError(["$: .json 파일만 업로드할 수 있습니다."]);
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (e) => {
      const text = typeof e.target?.result === "string" ? e.target.result : "";

      setJsonText(text);

      if (!text.trim()) {
        showError(["$: JSON 파일 내용이 비어 있습니다."]);
      }
    };
    reader.onerror = () => {
      setFileName(null);
      setJsonText("");
      showError(["$: JSON 파일을 읽지 못했습니다."]);
    };
    reader.readAsText(file);
  };

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setJsonText("");
    setFileName(null);
    if (fileRef.current) {
      fileRef.current.value = "";
    }
    resetValidation();
  };

  return (
    <div style={{ maxWidth: "860px" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <p style={{ color: "#6B7280", fontSize: "0.875rem", lineHeight: 1.6 }}>
          외부 AI에서 생성한 SQLP 풀이 분석 JSON을 업로드하거나 직접 붙여넣어 학습 기록으로 등록하세요.
        </p>
        <div
          style={{
            marginTop: "0.75rem",
            backgroundColor: "#F1F5F9",
            borderRadius: "8px",
            padding: "0.75rem 1rem",
            fontSize: "0.8125rem",
            color: "#475569",
            borderLeft: "3px solid #C8962A",
          }}
        >
          💡 문제 이미지, 정답/해설 파일, STT 텍스트, 분석 프롬프트는 외부 AI에 먼저 입력하고, 생성된 JSON 결과만 이곳에 등록합니다.
        </div>
      </div>

      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "12px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
          overflow: "hidden",
        }}
      >
        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid #E5E7EB" }}>
          {(["file", "paste"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              style={{
                padding: "0.875rem 1.5rem",
                fontSize: "0.875rem",
                fontWeight: activeTab === tab ? 600 : 400,
                color: activeTab === tab ? "#C8962A" : "#6B7280",
                backgroundColor: "transparent",
                border: "none",
                cursor: "pointer",
                borderBottom: activeTab === tab ? "2px solid #C8962A" : "2px solid transparent",
                marginBottom: "-1px",
              }}
            >
              {tab === "file" ? "📁  JSON 파일 업로드" : "✏️  JSON 직접 붙여넣기"}
            </button>
          ))}
        </div>

        <div style={{ padding: "1.5rem" }}>
          {activeTab === "file" ? (
            <div>
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const file = e.dataTransfer.files[0];
                  if (file) handleFile(file);
                }}
                onClick={() => fileRef.current?.click()}
                style={{
                  border: `2px dashed ${isDragging ? "#C8962A" : "#D1D5DB"}`,
                  borderRadius: "10px",
                  padding: "3rem 2rem",
                  textAlign: "center",
                  cursor: "pointer",
                  backgroundColor: isDragging ? "#FEF8EC" : "#F9FAFB",
                  transition: "all 0.15s",
                }}
              >
                <FileJson size={40} color={isDragging ? "#C8962A" : "#9CA3AF"} style={{ margin: "0 auto 0.75rem" }} />
                <div style={{ fontWeight: 500, color: "#374151", marginBottom: "0.375rem" }}>
                  {fileName ? fileName : ".json 파일을 여기에 끌어오거나 클릭해서 업로드하세요"}
                </div>
                <div style={{ fontSize: "0.8125rem", color: "#9CA3AF" }}>
                  {fileName ? "파일이 선택되었습니다." : "최대 10MB · JSON 형식만 지원"}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".json"
                  style={{ display: "none" }}
                  onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
                />
              </div>
            </div>
          ) : (
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, color: "#374151", marginBottom: "0.5rem" }}>
                JSON 텍스트 붙여넣기
              </label>
              <textarea
                value={jsonText}
                onChange={(e) => {
                  setJsonText(e.target.value);
                  resetValidation();
                }}
                placeholder={PLACEHOLDER_JSON}
                style={{
                  width: "100%",
                  height: "260px",
                  padding: "0.875rem",
                  border: "1px solid #E5E7EB",
                  borderRadius: "8px",
                  fontSize: "0.8125rem",
                  fontFamily: "monospace",
                  resize: "vertical",
                  outline: "none",
                  color: "#374151",
                  backgroundColor: "#FAFAFA",
                  boxSizing: "border-box",
                }}
              />
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem" }}>
            <button
              onClick={handleValidate}
              style={{
                padding: "0.6875rem 1.25rem",
                border: "1.5px solid #C8962A",
                borderRadius: "8px",
                backgroundColor: "#FFFFFF",
                color: "#C8962A",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.375rem",
              }}
            >
              <CheckCircle size={16} />
              형식 검증하기
            </button>
            <button
              onClick={handleRegister}
              disabled={registerDisabled}
              style={{
                padding: "0.6875rem 1.25rem",
                border: "none",
                borderRadius: "8px",
                backgroundColor: registerDisabled ? "#D1D5DB" : "#C8962A",
                color: registerDisabled ? "#9CA3AF" : "#FFFFFF",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: registerDisabled ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.375rem",
              }}
            >
              <Upload size={16} />
              학습 기록 등록하기
            </button>
          </div>

          {/* Validation Result */}
          {validateStatus === "error" && (
            <div
              style={{
                marginTop: "1.25rem",
                backgroundColor: "#FEF2F2",
                border: "1px solid #FECACA",
                borderRadius: "8px",
                padding: "0.875rem 1.125rem",
                display: "flex",
                alignItems: "flex-start",
                gap: "0.625rem",
                color: "#DC2626",
                fontSize: "0.875rem",
              }}
            >
              <XCircle size={18} style={{ flexShrink: 0, marginTop: "0.0625rem" }} />
              <div>
                <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>JSON 형식 오류</div>
                <ul style={{ margin: 0, paddingLeft: "1.125rem" }}>
                  {validationErrors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {validateStatus === "ok" && preview && validatedSession && !registered && (
            <div
              style={{
                marginTop: "1.25rem",
                backgroundColor: "#F0FDF4",
                border: "1px solid #BBF7D0",
                borderRadius: "8px",
                padding: "0.875rem 1.125rem",
                display: "flex",
                alignItems: "flex-start",
                gap: "0.625rem",
                color: "#15803D",
                fontSize: "0.875rem",
              }}
            >
              <CheckCircle size={18} style={{ flexShrink: 0, marginTop: "0.0625rem" }} />
              <div>
                <div style={{ fontWeight: 600, marginBottom: "0.875rem" }}>
                  JSON 형식이 올바릅니다. 학습 기록으로 등록할 수 있어요.
                </div>
                {/* Preview */}
                <div
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: "8px",
                    padding: "1rem",
                    border: "1px solid #D1FAE5",
                    color: "#374151",
                  }}
                >
                  <div style={{ fontWeight: 600, color: "#111827", marginBottom: "0.75rem", fontSize: "0.9375rem" }}>
                    학습 기록 미리보기
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem 1.5rem" }}>
                    {[
                      { label: "검증 상태", value: "정상" },
                      { label: "학습 날짜", value: preview.sessionDate },
                      { label: "문제집명", value: preview.book },
                      { label: "문제 수", value: `${preview.problemCount}문제` },
                      { label: "참여자 수", value: `${preview.participantCount}명 (${validatedSession.speakers.join(", ")})` },
                    ].map((row, i) => (
                      <div key={i} style={{ display: "flex", gap: "0.5rem" }}>
                        <span style={{ fontSize: "0.8125rem", color: "#6B7280", minWidth: "70px" }}>{row.label}</span>
                        <span style={{ fontSize: "0.8125rem", fontWeight: 500, color: "#111827" }}>{row.value}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: "0.75rem" }}>
                    <span style={{ fontSize: "0.8125rem", color: "#6B7280", marginBottom: "0.375rem", display: "block" }}>주요 개념 태그</span>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
                      {preview.conceptTags.map((tag) => (
                        <span
                          key={tag}
                          style={{
                            backgroundColor: "#FEF3C7",
                            color: "#92690B",
                            fontSize: "0.75rem",
                            fontWeight: 500,
                            padding: "0.1875rem 0.625rem",
                            borderRadius: "999px",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.25rem",
                          }}
                        >
                          <Tag size={10} />
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {registered && (
            <div
              style={{
                marginTop: "1.25rem",
                backgroundColor: "#FEF8EC",
                border: "1px solid #FDE68A",
                borderRadius: "8px",
                padding: "0.875rem 1.125rem",
                display: "flex",
                alignItems: "center",
                gap: "0.625rem",
                color: "#92690B",
                fontSize: "0.875rem",
                fontWeight: 600,
              }}
            >
              ✅ 학습 기록이 성공적으로 등록되었습니다! 학습 세션 목록에서 확인하세요.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
