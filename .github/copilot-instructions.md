# Copilot / Agent Guidance — Prompt Manager 🧭

Summary
- This is a small Next.js 14 (App Router) + TypeScript app that stores structured prompt JSON, compiles it to plain prompt text, and stores generated images. DB: PostgreSQL via Prisma. UI: Tailwind.

Quick start (dev)
- Docker (recommended): `docker compose up --build` → opens on http://localhost:3000 (runs `npm run db:init` and `npm run dev`).
- Local: create Postgres, copy env (README suggests `cp .env.example .env`; if missing, create a `.env` with the keys below), then:
  - `npm install`
  - `npm run db:init` (runs `prisma generate`, `prisma db push`, `node prisma/seed.js`)
  - `npm run dev`

Important env vars
- `DATABASE_URL`, `SESSION_SECRET` — required
- `UPLOADS_DIR` — local uploads directory (default `./uploads`). See `app/prompts/actions.ts` and `app/api/images/[id]/route.ts` for usage.
- `ADMIN_EMAIL`, `ADMIN_PASSWORD` — used by seed script to create a default admin.
- `OPENAI_API_KEY` (required for AI features) and `OPENAI_MODEL` (default `gpt-5`). Refer to `app/api/ai/json-edit/route.ts` and `app/ai-json/AiJsonEditor.tsx`.

Authentication / sessions
- Session cookie: `pm_session` (see `lib/auth.ts`). Sessions are stored hashed (SHA256) in DB; TTL = 30 days.
- Most write operations are protected with `requireUser()` or `getCurrentUser()`.

Key conventions & patterns
- Next.js App Router; pages and API route handlers live under `app/`.
- Server-only mutating code uses server actions (`'use server'`) and FormData for forms (`app/prompts/actions.ts`).
- Client components explicitly use `'use client'` (see `app/ai-json/AiJsonEditor.tsx`).
- Prompt JSON shape is flexible but common sections: `character`, `face`, `hair`, `body`, `makeup`, `clothing`, `environment`, `camera`, `global_negative_prompt`, and `avoid` arrays. See `prisma/seed.js` for a canonical example preset (`nadyaPreset`).
- Deterministic compiler: `lib/promptGenerator.ts` → `formatPromptBlock(promptJson)` returns a stable "Positive / Negative" block used as `generatedText` in `PromptVersion`.

AI integration specifics (JSON editor)
- The AI JSON editor is a thin client (see `app/ai-json/AiJsonEditor.tsx`) that POSTs to `/api/ai/json-edit`.
- The route `app/api/ai/json-edit/route.ts` calls OpenAI Responses API. The model is instructed with a system message requiring a JSON-only response containing exactly:
  - `updatedJson` (object), `summary` (string, Indonesian preferred), `changedPaths` (array of strings).
- The route expects plain JSON in `data.output_text` and `JSON.parse`'s it. If you're changing the model prompt/format, preserve this return shape and error handling.
- The API requires a logged-in user (server checks `getCurrentUser()`), and will error if `OPENAI_API_KEY` is missing.

Storage & uploads
- Images are saved to `UPLOADS_DIR` with generated filenames and recorded in `ImageAsset.storagePath` in the DB. See `app/prompts/actions.ts` (upload action) and `app/api/images/[id]/route.ts` (serve file).
- `.gitignore` excludes `uploads` by default.

DB & migrations
- `npm run db:init` is the easiest local start (generate client, push schema, seed).
- For migrations: `npm run db:migrate` (uses `prisma migrate deploy`) and `npm run db:studio` to inspect data.

Developer tips & pitfalls
- If AI features misbehave, check `OPENAI_API_KEY` and model outputs — the route relies on `output_text` being parseable JSON.
- When editing server routes or seed data, re-run `npm run db:push` or appropriate migration steps and re-seed if needed.
- Auth flow uses cookie + server-side session store — to debug session issues, inspect `pm_session` and `session` table.

Files to look at for examples
- AI editor: `app/ai-json/AiJsonEditor.tsx`, `app/api/ai/json-edit/route.ts`
- Uploads: `app/prompts/actions.ts`, `app/api/images/[id]/route.ts`
- Prompt compile: `lib/promptGenerator.ts`
- DB shape + seed: `prisma/schema.prisma`, `prisma/seed.js`
- Auth: `lib/auth.ts`

If anything above is unclear or you want the guidance to include more examples (e.g., sample prompts, common PR checklist, or unit test strategy), tell me which areas to expand and I’ll iterate. ✅
