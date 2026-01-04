# Prompt Manager (MVP)

This app helps you:
- Save **Templates** (schema + example JSON)
- Save **Presets** (opinionated reusable JSON)
- Create **Prompts** from presets or from scratch (with **versioning**)
- Deterministically **compile** structured JSON → ready-to-paste **positive/negative prompt text**
- Upload & attach **generated images** to a prompt (with metadata)
- Edit prompt JSON faster with **AI JSON Editor** (natural language → JSON updates)

## Tech
- Next.js 14 (App Router) + TypeScript
- TailwindCSS
- PostgreSQL
- Prisma
- Simple session auth (email/password, server-side sessions)

---

## Run with Docker (recommended)

1) From this folder:

```bash
docker compose up --build
```

2) Open:
- http://localhost:3000

Default admin (change via env):
- email: `admin@local`
- password: `admin123`

AI feature env:
- `OPENAI_API_KEY` (required)
- `OPENAI_MODEL` (default: `gpt-5`)

---

## Run locally (no Docker)

1) Create a Postgres DB (example using Docker):

```bash
docker run --name pm-db -e POSTGRES_USER=pm -e POSTGRES_PASSWORD=pm -e POSTGRES_DB=pm -p 5432:5432 -d postgres:16
```

2) Copy env:

```bash
cp .env.example .env
```

3) Install + init DB + seed admin:

```bash
npm install
npm run db:init
```

4) Run dev server:

```bash
npm run dev
```

---

## Notes / Next features to add
- Customization UI (form generator) from `schemaJson` (JSON Schema) + lock rules
- "Prompt builder" UX: toggle fields, quick chips, presets merging
- Search, tagging, collections
- Image gallery filters, ratings, compare A/B
- Export prompt versions as Markdown/JSON, import/export packs
- S3/R2 storage option for images
- Multi-user org/workspace mode + RBAC (admin manages users)
