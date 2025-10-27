# Voice Intent API — `/voice/transcribe-intent`

This document explains everything needed to run, integrate, and fully understand the end‑to‑end logic of the `async def transcribe_intent(...)` endpoint in `service/main.py`. It covers installation, environment and dependencies, full API contract, AI/NLU logic, audio processing, orchestration against the banking subsystem, session management with Redis, error handling, and detailed call flows with diagrams.

---

## What this endpoint does
- Accepts a voice input (audio file) from a user or, in a continuation flow, an `otp` and/or a `beneficiary_name` tied to an existing `session_id`.
- Transcribes speech to text, detects the user’s intent using an LLM (Ollama), formats and validates entities, then orchestrates banking actions like checking balance, listing beneficiaries, recent transactions, spending insights, or money transfer.
- Manages multi‑turn dialog using Redis‑backed sessions (missing fields, OTP challenges, etc.).
- Returns a standardized response including the session, translation, interpreted `intent_data`, and `orchestrator_data` returned by the banking layer.

Key code:
- Endpoint: `service/main.py` → `transcribe_intent(...)`
- Audio: `service/audio_service.py` → `translate_with_whisper_from_upload(...)`
- NLU: `service/detect_intent.py` → `detect_intent_with_llama(...)`, `format_intent_response(...)`, `determine_action(...)`
- Sessions: `service/session_service.py` → `SessionService`, `SessionFlowProcessor`
- Orchestration: `service/orchestrator.py` → `BankingOrchestrator`
- Banking endpoints: `service/banking/core_banking_routes.py`
- Redis session store: `service/redis_client.py`

---

## Quick Start

### 1) Prerequisites
- Python 3.10+
- Redis server reachable by your app
- Ollama service running and a compatible local LLM pulled (default `llama3.2`)
- A banking API or the built‑in banking router running (exposed from this project)
- SarvamAI credentials for speech‑to‑text and text translation (see notes below)

### 2) Install dependencies
Using the project requirements file:

```bash
pip install -r requirements.txt
# Additional packages used in this feature but not listed explicitly or commonly required:
pip install redis sarvamai
```

Relevant packages used by this endpoint and its dependencies:
- Server and utilities: `fastapi`, `uvicorn`, `fastapi_versionizer`, `python-dotenv`, `pydantic`
- HTTP and async: `httpx`
- Redis client: `redis`
- Speech to text and audio helpers: `whisper-timestamped`, `openai-whisper` (for other paths), `silero-vad`
- LLM/NLU: `ollama`
- SarvamAI SDK: `sarvamai` (speech‑to‑text and text translation)

Note: The repo’s `requirements.txt` lists most, but not all, of the above. Ensure `redis` and `sarvamai` are installed as the endpoint references them.

### 3) Configure environment
Set the following variables (usually via `.env`, e.g., `service/.env`, or standard environment):

```bash
# LLM/Ollama
OLLAMA_HOST=http://localhost:11434       # or your Ollama host
OLLAMA_MODEL_NAME=llama3.2               # default per config.py
OLLAMA_TRANS_MODEL=gemma2:latest         # only used in older text translation path

# Audio/AI
OPENAI_API_KEY=...                       # used in other parts (whisper/openai)
SARVAM_API_KEY=...                       # SarvamAI key for STT and translation
MODEL_ID=small                           # whisper model id for timestamped path
MODEL_PATH=./models

# Banking service
BANK_API_BASE_URL=http://localhost:8000  # orchestrator base URL for bank API

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD=                          # optional

# DB_* potentially used by banking submodule, if applicable
DB_USER=...
DB_PASSWORD=...
DB_HOST=...
DB_PORT=...
DB_NAME=...
```

Notes:
- `service/config.py` reads most variables. `BANK_API_BASE_URL` is read directly in the orchestrator via `os.getenv`.
- The SarvamAI key must be set in the environment. Do not hard‑code it into source.

### 4) Start services
- Start Redis.
- Start Ollama and pull the model used by `OLLAMA_MODEL_NAME`:
  ```bash
  ollama pull llama3.2
  ollama serve
  ```
- Run the FastAPI app (from project root):
  ```bash
  uvicorn service.main:app --reload --host 0.0.0.0 --port 8000
  ```
- The banking API is provided by this repo’s `service/banking/core_banking_routes.py` and is included into the FastAPI app; the orchestrator calls these endpoints via HTTP.

---

## API Contract

- Method: `POST`
- Path: `/voice/transcribe-intent`
- Content-Type: `multipart/form-data`

### Request parameters (form + file)
- `audio`: file, optional in OTP follow‑ups; required for the standard/first turn
- `session_id`: string, optional (for continuing an existing session in Redis)
- `customer_id`: integer, optional (banking user id)
- `phone`: string, optional (banking lookup alternative to customer_id)
- `transaction_type`: string, optional (used for payments)
- `payment_method`: string, optional (used for payments)
- `otp`: string, optional (used in transfer OTP step)
- `beneficiary_name`: string, optional (disambiguate or set payee in follow‑ups)

Important special case in code:
- If `audio` is not provided and both `session_id` and `(otp==123456 OR beneficiary_name)` are provided, the endpoint takes the “OTP + session_id” flow using previous session state. The `123456` check is a basic demo validation; in production, use a real OTP verifier.

### Response (success)
Standardized payload created by `SessionService.format_api_response(...)`:

```json
{
  "session_id": "...",
  "translation": "<string user's request in English>",
  "intent_data": {
    "intent": "check_balance | recent_txn | transfer_money | txn_insights | list_beneficiaries | unknown",
    "entities": {
      "amount": 1500,
      "currency": "INR",
      "recipient": "Ananya",
      "timeframe": "last_week",
      "start_date": "2025-09-01",
      "end_date": "2025-09-07",
      "category": "shopping",
      "count": 5
    },
    "language": "hi-IN",
    "action": "respond | <explanatory string if more info needed>"
  },
  "orchestrator_data": {
    "success": "true | false",
    "data": { "message": "...", "payload": {} },
    "message": "..."
  }
}
```

### Response (errors)
- `400` with `{ "message": "..." }` when required inputs are missing or session invalid.
- `200` with `{ "error": "<raw LLM response>", "session_id": "...", "translation": "..." }` if LLM returned something non‑JSON that couldn’t be parsed.
- `500` with `{ "message": "...", "session_id": "..." }` on unexpected server errors.

---

## End‑to‑End Flow and Logic

The endpoint implements two top‑level modes:
- Standard flow (audio provided)
- OTP/session continuation flow (no audio, but `session_id` and `otp` or `beneficiary_name`)

### A) Standard flow (with audio)

1) Audio transcription
- Function: `translate_with_whisper_from_upload(upload: UploadFile)` in `service/audio_service.py`
- Internally writes the upload to a temp file, then calls SarvamAI STT:
  ```text
  SarvamAI STT is invoked with:
    model: saaras:v2.5
    prompt: "Voice Banking"
    file: <uploaded audio temp file>
  (The exact function call depends on your SarvamAI SDK version.)
  ```
- The calling code expects this to unpack into four variables:
  ```text
  The endpoint unpacks four return values from the STT call:
  - id
  - response (array-like; transcript expected at index 1)
  - lang (array-like; language code expected at index 1)
  - dia (unused)
  It then sets:
    translation_text = response[1]
    language = lang[1]
  ```
  This implies SarvamAI returns tuple-like values where `response[1]` is the English transcript and `lang[1]` is the language code. Adjust integration if your SDK returns a different shape.
- Legacy comment blocks show support for Whisper/whisper-timestamped models as an alternative path (URL-based audio, timestamps), but this endpoint uses the upload+SarvamAI path.

2) Intent detection (LLM via Ollama)
- Function: `detect_intent_with_llama(transcript, lang_hint)` in `service/detect_intent.py`
- Uses `ollama.Client(host=OLLAMA_HOST).generate(...)` with a strict `SYSTEM` prompt limiting intents to:
  - `check_balance`, `recent_txn`, `transfer_money`, `txn_insights`, `list_beneficiaries`, `unknown`
- Post-processing:
  - `safe_json_parse` attempts to extract a JSON block from LLM output
  - `normalize_timeframe` resolves human timeframe expressions to `{ date | start_date | end_date | timeframe }`
  - `validate_schema` enforces types/ranges and allowed values, returning a normalized structure with `confidence`
  - The endpoint sets `validated["language"] = lang_hint` to carry forward the language detected in transcription

3) Format intent for orchestration
- Function: `format_intent_response(llama_response)` → returns `intent_data` that includes `intent`, `entities`, `language`, and `action` (computed by `determine_action`).
- `determine_action` rules:
  - `check_balance`, `recent_txn`, `list_beneficiaries` → `respond`
  - `transfer_money` → `respond` if both `amount` and `recipient` present; otherwise a string asking to provide missing pieces
  - `txn_insights` → requires timeframe and either category/recipient for a meaningful filter; otherwise a guidance string

4) Branch: existing session vs new session
- If `SessionService.should_use_session_flow(session_id)` is true → “session flow”
- Else → “new session flow”

4a) Session flow: `SessionFlowProcessor.process_existing_session(...)`
- Loads session from Redis (`redis_client.session_manager`): prior `intent_data`, `translations`, `language`, and possibly `missing_field`.
- Merges updates:
  - If `otp` provided and no `missing_field`, injects it into `entities["otp"]` for the next orchestrator call.
  - If `beneficiary_name` provided, injects it into `entities["recipient"]`.
  - Else, if a `missing_field` exists, it attempts to fill it from `formatted_intent_data` (or uses the raw `translation_text`).
- Calls the orchestrator with combined banking params and updated `intent_data`.
- Updates session with `update_session_after_orchestrator_response(...)` which:
  - Appends the new translation, updates `intent_data` and `orchestrator_data`, increments `turn_count`
  - Sets or clears a `missing_field` based on the orchestrator response message (e.g., recipient disambiguation or OTP needed)
  - Stores back to Redis; if `orchestrator_data.success == "true"`, deletes the session (terminal state)
- Translates the final message back to the user’s language using `detect_intent.translate(...)` (SarvamAI text translation) and returns a standardized response.

4b) New session flow: `SessionFlowProcessor.process_new_session(...)`
- Generates a new `session_id` (UUID), prepares banking parameters from provided form fields, merges with `intent_data`, and calls the orchestrator.
- Persists a new session record with:
  - `session_id`, `customer_id`, `phone`, `transaction_type`, `payment_method`, `language`, `translations=[translation_text]`, `intent_data`, `orchestrator_data`, timestamps, `turn_count=1`
  - If the orchestrator indicates a missing field, sets `missing_field` to guide the next user turn.
- Translates the returned message to the user’s language and returns a standardized response.

### B) OTP + session continuation flow (no audio)
- If the request has no `audio`, but includes `session_id` and either a valid `otp` (demo: `123456`) or `beneficiary_name`, the endpoint:
  - Loads the session and recovers `translation_text` (uses the first translation entry) and `language` from session data
  - Uses `intent_data` stored in the session
  - Calls `process_existing_session(...)` as above

---

## Orchestration and Banking Logic

Entry point: `orchestrator.orchestrate_banking_request(...)` delegates to `BankingOrchestrator.process_intent(...)` which routes based on `intent`:

- `check_balance` → `GET {BANK_API_BASE_URL}/bank/balance`
- `recent_txn` → `GET {BANK_API_BASE_URL}/bank/search-txn` with default filters
- `txn_insights` → `GET {BANK_API_BASE_URL}/bank/search-txn` with timeframe/category/recipient filters and summarization logic
- `list_beneficiaries` → `GET {BANK_API_BASE_URL}/bank/beneficiaries`
- `transfer_money` → `POST {BANK_API_BASE_URL}/bank/pay` with JSON body including `to`, `amount`, and optional `transaction_type`, `payment_method`, `category`, plus `otp` or `recipient` on follow‑ups

The orchestrator uses `httpx.AsyncClient` and handles:
- Missing identity (both `customer_id` and `phone` absent) → returns `success=false` with a friendly message
- 4xx/5xx responses → returns structured errors; special parsing for `409` conflicts and OTP prompts (`status=otp` cases)
- Network errors → friendly “service unavailable” message

For transfers (`_handle_transfer_money`):
- Requires both `amount` and `recipient` before sending any bank request. Otherwise returns:
  ```json
  {
    "success": "false",
    "data": {"missing_field": "amount or recipient"},
    "message": "Need both recipient and amount to be transferred. Could you please repeat the statement"
  }
  ```
- When the bank returns an OTP challenge, the orchestrator relays it with `success=false`, `status=otp`, and a message to prompt the user for OTP. The session layer will mark a missing field and wait for the next turn with `otp`.

Banking API in this repo:
- Implemented in `service/banking/core_banking_routes.py` and included into the FastAPI app via `app.include_router(...)` in `main.py`.
- Endpoints expect either `customer_id` or `phone` for identity.

---

## Session Storage and Lifecycle

- Backed by Redis through `RedisSessionManager` in `service/redis_client.py`.
- Keys: `session:{session_id}` with a TTL (default 10 minutes) that is refreshed on updates.
- Session payload includes:
  - Identity hints (`customer_id`, `phone`)
  - Payment dimensions (`transaction_type`, `payment_method`)
  - `language` (from STT) and all `translations` across turns
  - Current `intent_data` and last `orchestrator_data`
  - Optional `missing_field` (e.g., `recipient`), guiding the next prompt
  - `turn_count`, `created_at`, `updated_at`
- Terminal success (e.g., successful transfer) → session is deleted.

---

## Security and Validation Notes

- OTP check in the entrypoint for the no‑audio path is a demo placeholder (`otp == 123456`). For production:
  - Validate OTP through your bank/auth service.
  - Consider rate limiting and lockout mechanisms.
- Input validation:
  - If `audio` is missing and the request is not a valid session continuation, the API returns `400`.
  - The LLM output is always validated and coerced using `validate_schema` to prevent downstream errors.
- Secrets:
  - Use `.env` and environment variables for API keys. Do not commit keys to source control.

---

## Diagrams

### High‑level architecture

```
[Mobile app]
   |
   v
[FastAPI /voice/transcribe-intent]
   |   \
   |    \--(No audio + session + otp/beneficiary)--> [SessionService/Redis] --+---> [BankingOrchestrator] --> [Bank API]
   |
   +--(Audio)--> [AudioService STT (SarvamAI)] --> transcript + lang
                        |
                        v
                  [detect_intent (Ollama)] --> intent_data
                        |
                        v
             [SessionService] (new/existing)
                        |
                        v
             [BankingOrchestrator] --> [Bank API]
                        |
                        v
                    [Response JSON]
```

### Endpoint branching

```
Start
 |
 |-- If !audio AND session_id AND (otp==123456 OR beneficiary_name)
 |       -> Load session (translations[0], language, intent_data)
 |       -> process_existing_session(...)
 |       -> JSONResponse(200)
 |
 |-- Else If !audio -> 400 ("No audio file provided")
 |
 |-- Else (audio provided)
         -> STT: id, response, lang, dia = translate_with_whisper_from_upload
         -> translation_text = response[1]
         -> language        = lang[1]
         -> intent = detect_intent_with_llama(translation_text, language)
         -> intent_data = format_intent_response(intent)
         -> If SessionService.should_use_session_flow(session_id)
               -> process_existing_session(...)
            Else
               -> process_new_session(...)
         -> JSONResponse(200)
```

### Orchestrator routing

```
intent -> handler
check_balance     -> _handle_check_balance -> GET /bank/balance
recent_txn        -> _handle_recent_transactions -> GET /bank/search-txn
txn_insights      -> _handle_txn_insights -> GET /bank/search-txn (filtered)
list_beneficiaries-> _handle_list_beneficiaries -> GET /bank/beneficiaries
transfer_money    -> _handle_transfer_money -> POST /bank/pay (+OTP if needed)
```

---

## Usage Examples

1) Standard one‑shot balance query (Hindi speech)

```bash
curl -X POST http://localhost:8000/voice/transcribe-intent \
  -F "audio=@/path/to/hindi_question.wav" \
  -F "customer_id=1234"
```

Response (example):
```json
{
  "session_id": "f7f8e5a4-...",
  "translation": "What is my balance?",
  "intent_data": { "intent": "check_balance", "entities": {}, "language": "hi-IN", "action": "respond" },
  "orchestrator_data": { "success": "true", "data": { "balance": 12000.0, "message": "Your account balance is 12,000.00." }, "message": "Your account balance is 12,000.00." }
}
```

2) Start a transfer (first turn)

```bash
curl -X POST http://localhost:8000/voice/transcribe-intent \
  -F "audio=@/path/to/transfer_request.wav" \
  -F "customer_id=1234" -F "transaction_type=IMPS" -F "payment_method=bank"
```

Response indicates OTP challenge, plus a new `session_id`:
```json
{
  "session_id": "0f3f9e3b-...",
  "intent_data": { "intent": "transfer_money", "entities": { "amount": 500, "recipient": "Ananya" }, "action": "respond" },
  "orchestrator_data": { "success": "false", "data": { "status": "otp", "detail": "Please provide OTP sent to your phone" }, "message": "Please provide OTP sent to your phone" }
}
```

3) Continue transfer with OTP (no audio)

```bash
curl -X POST http://localhost:8000/voice/transcribe-intent \
  -F "session_id=0f3f9e3b-..." \
  -F "otp=123456"
```

Response should reflect final transfer result (success or error). If successful, the session is cleaned up.

4) Disambiguate recipient by name only (no audio)

```bash
curl -X POST http://localhost:8000/voice/transcribe-intent \
  -F "session_id=0f3f9e3b-..." \
  -F "beneficiary_name=Ananya Ravi"
```

---

## Implementation Details (by module)

- `service/main.py`
  - Adds CORS for `*`
  - Mounts banking router
  - Defines `/voice/transcribe-intent` endpoint that:
    - Branches into OTP/session flow or standard audio flow
    - For standard flow: runs STT → LLM NLU → session or new session flow
    - Logs and returns JSON via `JSONResponse`

- `service/audio_service.py`
  - `translate_with_whisper_from_upload(upload_file)` writes file to temp, calls SarvamAI STT, returns SDK response expected to unpack as `(id, response, lang, dia)` in the caller; the transcript is taken from `response[1]`, language from `lang[1]`.
  - Legacy functions for URL‑based Whisper with timestamps remain available but are not used by this endpoint.

- `service/detect_intent.py`
  - Strict `SYSTEM` prompt; `safe_json_parse`, `validate_schema`, `normalize_timeframe` guardrail the LLM output
  - `format_intent_response` adds `action` via `determine_action`
  - `translate(text, lang_code)` uses SarvamAI to translate bank messages back into the user’s language

- `service/session_service.py`
  - `SessionService.should_use_session_flow(session_id)` checks Redis existence
  - `SessionFlowProcessor.process_existing_session(...)` and `process_new_session(...)` wrap all session flows
  - Session update methods add `missing_field` based on orchestrator messages (e.g., need recipient or OTP)
  - On final success, the session is deleted

- `service/orchestrator.py`
  - `BankingOrchestrator` calls the internal banking endpoints via `httpx.AsyncClient` using `BANK_API_BASE_URL`
  - Handlers perform parameter filtering, error/exception mapping, and OTP handling

- `service/banking/core_banking_routes.py`
  - Provides the bank endpoints consumed by the orchestrator: balance, pay, search transactions, beneficiaries
  - Validates/normalizes inputs and responds with JSON suitable for voice flows

- `service/redis_client.py`
  - Thin Redis wrapper for JSON sessions, TTL management, existence checks, and deletion

---


## Troubleshooting

- STT returns unexpected shapes → verify SarvamAI SDK version and return tuple. Adapt `translate_with_whisper_from_upload` to return `(id, response, lang, dia)` to match the caller’s expectations.
- LLM response not JSON → check Ollama availability, model, and the system prompt. The code safely degrades to returning the raw `response` under `error`.
- Banking calls fail → verify `BANK_API_BASE_URL` and that the FastAPI banking endpoints are mounted and reachable. Inspect server logs.
- Sessions not persisting → check Redis connectivity and credentials.

---

## Summary
The `/voice/transcribe-intent` endpoint fuses voice transcription, LLM-powered intent extraction, Redis-backed dialog state, and a banking orchestrator into a cohesive voice banking experience. Follow the environment setup, ensure Redis+Ollama+SarvamAI are reachable, and use the examples to integrate both first‑turn audio and follow‑up OTP/name turns for robust multi‑turn flows.
