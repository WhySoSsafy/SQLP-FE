# SQLP AI Coach React MVP Design

Date: 2026-06-12

## Goal

Build the first functional web MVP on top of the existing Figma Make React/Vite codebase.

The MVP keeps the current visual design and turns the static screens into a local, usable learning-management flow. It stores validated SQLP AI analysis JSON in `localStorage`, computes dashboard data from saved sessions, and keeps the data-access boundary ready for a later Django API replacement.

## Confirmed Scope

Included:

- Keep the current React/Vite Figma Make frontend.
- Use the existing Figma-generated UI as the design source.
- Support JSON file upload and direct JSON paste.
- Validate only the planning-document JSON schema based on `participants`.
- Save valid sessions to `localStorage`.
- Connect saved data to:
  - JSON registration
  - learning session list
  - problem understanding detail
  - home dashboard
  - weak concepts dashboard
  - wrong answers notebook
- Keep calendar and study comparison as existing static Figma screens for this MVP.
- Structure data access so `localStorage` can later be replaced with Django API calls.

Excluded:

- Vue rewrite.
- Django backend implementation.
- Mobile app implementation.
- Internal AI analysis of images, STT, or answer files.
- New visual design work beyond preserving and lightly adapting the existing Figma Make screens.
- Dedicated test framework setup.

## Architecture

The current React components remain responsible for presentation and interaction. New business logic should live in a small domain layer under a path such as `src/app/domain`.

Planned modules:

- `types`: app-level session, problem, participant, validation, and analytics types.
- `validation`: parsing and schema validation for uploaded or pasted JSON.
- `storage`: `localStorage` session persistence functions.
- `analytics`: derived metrics for dashboard, weak concepts, and wrong answers.
- `sampleData`: initial fallback data for empty-state or first-run display.

Data flow:

1. User uploads a `.json` file or pastes JSON text.
2. The app parses and validates the input.
3. Valid input is normalized into internal session data.
4. The normalized session is saved to `localStorage`.
5. Screens read saved sessions through the storage module.
6. Analytics functions compute summaries and lists from saved sessions.

The storage module is the future API boundary. Later Django integration should replace storage internals without forcing screen components to know whether data comes from `localStorage` or HTTP.

## JSON Schema

The MVP officially supports the planning-document schema only.

Top-level required shape:

```json
{
  "session_date": "2026-06-12",
  "book": "SQLP 실전문제",
  "speakers": ["세은", "수철"],
  "problems": []
}
```

Problem required shape:

```json
{
  "problem_number": 1,
  "subject_area": "SQL 기본 및 활용",
  "concepts": ["JOIN"],
  "solution_summary": "...",
  "participants": []
}
```

Participant required shape:

```json
{
  "name": "세은",
  "is_correct": true,
  "understanding": "애매",
  "concepts_covered": [],
  "concepts_missed": [],
  "errors": [],
  "review_required": true
}
```

Allowed `understanding` values:

- `잘함`
- `애매`
- `모름`

Allowed `subject_area` values:

- `데이터 모델링의 이해`
- `SQL 기본 및 활용`
- `SQL 고급 활용 및 튜닝`

## Validation Rules

The validator should report multiple errors at once when possible.

Rules:

- JSON syntax must be valid.
- `session_date`, `book`, `speakers`, and `problems` are required.
- `session_date` must use a valid `YYYY-MM-DD` date format.
- `book` must be a non-empty string.
- `speakers` must be a non-empty string array.
- `problems` must be a non-empty array.
- `problem_number` values must be unique within a session.
- `subject_area` must be one of the allowed SQLP subject areas.
- `concepts` must be a string array.
- `solution_summary` must be a non-empty string.
- `participants` must be a non-empty array.
- Each participant `name` must be included in `speakers`.
- `is_correct` and `review_required` must be booleans.
- `understanding` must be `잘함`, `애매`, or `모름`.
- `concepts_covered`, `concepts_missed`, and `errors` must be string arrays.

File validation:

- Only `.json` files are accepted.
- Empty files should show a clear error.
- File read failures should show a clear error.

## Storage Model

Use a versioned `localStorage` key:

```text
sqlp_ai_coach.sessions.v1
```

Store an array of normalized sessions.

Each saved session should include:

- generated `id`
- `session_date`
- `book`
- `speakers`
- normalized `problems`
- `created_at`

Each normalized problem should include:

- generated `id`
- `problem_number`
- `subject_area`
- `concepts`
- `solution_summary`
- `participants`

The MVP does not need to store the raw uploaded JSON after normalization.

Duplicate session handling:

- If a saved session has the same `session_date`, `book`, and problem-number set as the new upload, block the save and show a duplicate-session warning.

## Screen Behavior

### JSON Registration

The screen supports two input modes:

- JSON file upload
- JSON direct paste

On validation success, show:

- learning date
- book name
- problem count
- participant count
- primary concept tags
- success status

On validation failure, show a list of validation errors.

The "학습 기록 등록하기" action is enabled only after successful validation.

### Learning Sessions

Show saved sessions sorted by `session_date` descending, with newest first.

Each session card shows:

- learning date
- book name
- problem count
- participants
- average understanding score
- review-required problem count

Clicking a session selects that session and navigates to the problem detail screen.

### Problem Detail

If a session was selected from the session list, show that session.

If the user opens the screen directly from the menu, show the newest saved session.

The table and detail panel should render real problem and participant data from the selected session.

### Home Dashboard

Compute from saved sessions:

- this week's solved problem count
- total review-required problem count
- average understanding score
- study streak
- today's review recommendation list
- recent learning sessions

Understanding score mapping:

- `잘함`: 100
- `애매`: 60
- `모름`: 20

### Weak Concepts

Compute concept weakness from:

- `understanding` values of `애매` or `모름`
- incorrect answers
- `concepts_missed`
- `review_required`

The screen should show top weak concepts and concept-level review information using saved sessions.

### Wrong Answers

Include a problem in the wrong-answer notebook if any participant analysis has:

- `is_correct: false`
- `understanding` of `애매` or `모름`
- `review_required: true`
- non-empty `concepts_missed`
- non-empty `errors`

### Calendar and Study Comparison

Keep existing static Figma screens in this MVP. They can be connected to saved data in a later iteration.

## Error Handling

User-facing errors should be specific enough to fix the JSON.

Required cases:

- JSON parse error.
- Missing field.
- Invalid field type.
- Invalid allowed value.
- Duplicate problem number.
- Unknown participant name.
- Unsupported file extension.
- Empty file.
- File read failure.
- Duplicate session.
- `localStorage` save/load failure.

If saved data is corrupted or unreadable, the app should avoid crashing and show an empty or fallback state.

## Testing and Verification

Verification for this MVP:

- Run `npm run build`.
- Manually test valid JSON paste.
- Manually test invalid JSON paste.
- Manually test `.json` file upload.
- Verify validation preview.
- Verify session save.
- Verify session list updates.
- Verify session card click opens the matching problem-detail view.
- Verify dashboard metrics update from saved sessions.
- Verify weak concepts update from saved sessions.
- Verify wrong answers update from saved sessions.
- Refresh the browser and confirm saved sessions remain via `localStorage`.

No new test framework will be added in this MVP.

## Implementation Notes

The implementation should keep edits scoped. Existing Figma Make components should be adapted only where needed to connect real data and interactions.

Avoid introducing a global state-management library. React state plus small domain modules are enough for this MVP.

When Django API integration begins later, start by replacing the `storage` module with async API calls and adjust call sites only where async loading state is needed.
