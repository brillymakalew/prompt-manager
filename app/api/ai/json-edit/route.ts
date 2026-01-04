import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth';

const BodySchema = z.object({
  instruction: z.string().min(1).max(2000),
  currentJson: z.unknown()
});

type PatchOp = {
  op: 'add' | 'replace' | 'remove';
  path: string;       // JSON Pointer, e.g. "/body/profile/height"
  valueText: string;  // required by schema; for remove use "null"
};

type ResponsesApiMessage = {
  type: 'message';
  role?: string;
  content?: Array<{ type?: string; text?: string }>;
};

type ResponsesApiResponse = {
  status?: string;
  error?: any;
  output?: Array<ResponsesApiMessage | any>;
  output_text?: string;
};

function extractOutputText(data: ResponsesApiResponse): string {
  if (typeof data?.output_text === 'string' && data.output_text.trim()) return data.output_text.trim();
  if (!Array.isArray(data?.output)) return '';

  const chunks: string[] = [];
  for (const item of data.output) {
    if (item?.type !== 'message') continue;
    if (item?.role !== 'assistant') continue;
    if (!Array.isArray(item.content)) continue;

    for (const c of item.content) {
      if (c?.type === 'output_text' && typeof c.text === 'string') chunks.push(c.text);
    }
  }
  return chunks.join('\n').trim();
}

function deepClone<T>(v: T): T {
  // @ts-ignore
  if (typeof structuredClone === 'function') return structuredClone(v);
  return JSON.parse(JSON.stringify(v));
}

function decodeJsonPointerSegment(seg: string): string {
  return seg.replace(/~1/g, '/').replace(/~0/g, '~');
}

function splitJsonPointer(pointer: string): string[] {
  if (!pointer || pointer === '/') return [];
  if (!pointer.startsWith('/')) throw new Error(`Invalid JSON pointer (must start with "/"): ${pointer}`);
  return pointer
    .split('/')
    .slice(1)
    .map(decodeJsonPointerSegment);
}

function isArrayIndex(seg: string): boolean {
  return seg === '-' || /^[0-9]+$/.test(seg);
}

function ensureContainer(nextSeg: string): any {
  return isArrayIndex(nextSeg) ? [] : {};
}

function applyOps(currentJson: unknown, ops: PatchOp[]): any {
  const root = deepClone(currentJson);

  for (const op of ops) {
    const segments = splitJsonPointer(op.path);

    if (segments.length === 0) {
      if (op.op === 'remove') throw new Error('Refusing to remove root object');
      const val = JSON.parse(op.valueText);
      return val;
    }

    let cursor: any = root;
    for (let i = 0; i < segments.length - 1; i++) {
      const key = segments[i];
      const nextKey = segments[i + 1];

      if (Array.isArray(cursor)) {
        if (!/^[0-9]+$/.test(key)) throw new Error(`Array segment must be numeric, got "${key}" in ${op.path}`);
        const idx = Number(key);
        if (cursor[idx] == null) cursor[idx] = ensureContainer(nextKey);
        cursor = cursor[idx];
      } else {
        if (cursor[key] == null || typeof cursor[key] !== 'object') {
          cursor[key] = ensureContainer(nextKey);
        }
        cursor = cursor[key];
      }
    }

    const last = segments[segments.length - 1];

    if (op.op === 'remove') {
      if (Array.isArray(cursor)) {
        if (!/^[0-9]+$/.test(last)) throw new Error(`Array remove index must be numeric, got "${last}" in ${op.path}`);
        const idx = Number(last);
        cursor.splice(idx, 1);
      } else {
        delete cursor[last];
      }
      continue;
    }

    const value = JSON.parse(op.valueText);

    if (Array.isArray(cursor)) {
      if (last === '-') {
        cursor.push(value);
      } else {
        if (!/^[0-9]+$/.test(last)) throw new Error(`Array index must be numeric or "-", got "${last}" in ${op.path}`);
        const idx = Number(last);
        if (op.op === 'add') cursor.splice(idx, 0, value);
        else cursor[idx] = value; // replace
      }
    } else {
      cursor[last] = value;
    }
  }

  return root;
}

async function callOpenAIPatchOps(args: {
  apiKey: string;
  model: string;
  instruction: string;
  currentJson: unknown;
}): Promise<{ ops: PatchOp[]; summary: string; changedPaths: string[] }> {
  const { apiKey, model, instruction, currentJson } = args;

  const system =
    'You are a JSON editor that outputs JSON Patch-like operations.\n' +
    'Given instruction and currentJson, produce ONLY a JSON object with keys:\n' +
    '- ops: array of operations\n' +
    '- summary: string (Indonesian)\n' +
    '- changedPaths: array of strings (dot paths)\n' +
    'Each operation MUST include:\n' +
    '- op: "add" | "replace" | "remove"\n' +
    '- path: JSON Pointer (e.g. "/body/profile/height")\n' +
    '- valueText: string (MUST be valid JSON text representing the value; for remove use "null")\n' +
    'Rules:\n' +
    '- Keep ops minimal.\n' +
    '- Preserve everything else.\n' +
    '- Do NOT output the full updated JSON.\n';

  const conventions = {
    knownSections: [
      'character',
      'face',
      'skin',
      'hair',
      'body',
      'makeup',
      'clothing',
      'accessories',
      'environment',
      'camera',
      'global_negative_prompt'
    ],
    commonAdditions: {
      bodyProfileTemplate: {
        height: '',
        build: '',
        proportions: '',
        notes: ''
      }
    }
  };

  const payload = {
    model,
    reasoning: { effort: 'low' as const },
    text: {
      format: {
        type: 'json_schema' as const,
        name: 'json_patch_ops_v1',
        strict: true,
        schema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            ops: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  op: { type: 'string', enum: ['add', 'replace', 'remove'] },
                  path: { type: 'string' },
                  valueText: { type: 'string' }
                },
                // ✅ required MUST include all keys present in properties
                required: ['op', 'path', 'valueText']
              }
            },
            summary: { type: 'string' },
            changedPaths: { type: 'array', items: { type: 'string' } }
          },
          required: ['ops', 'summary', 'changedPaths']
        }
      }
    },
    max_output_tokens: 700,
    input: [
      { role: 'system', content: system },
      { role: 'user', content: JSON.stringify({ instruction, currentJson, conventions }, null, 2) }
    ]
  };

  const res = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI API error (${res.status}): ${text}`);
  }

  const data = (await res.json()) as ResponsesApiResponse;
  if (data?.status && data.status !== 'completed') {
    const err = data?.error ? JSON.stringify(data.error) : '';
    throw new Error(`OpenAI response not completed. status=${data.status} ${err}`);
  }

  const out = extractOutputText(data);
  if (!out) throw new Error('OpenAI returned empty output');

  let parsed: any;
  try {
    parsed = JSON.parse(out);
  } catch (e: any) {
    const tail = out.slice(Math.max(0, out.length - 500));
    throw new Error(`Model returned invalid JSON: ${e?.message}. Tail: ${tail}`);
  }

  const opsRaw = Array.isArray(parsed?.ops) ? parsed.ops : [];
  const ops: PatchOp[] = opsRaw
    .map((o: any) => ({
      op: o?.op,
      path: o?.path,
      valueText: typeof o?.valueText === 'string' ? o.valueText : 'null'
    }))
    .filter((o: any) => (o.op === 'add' || o.op === 'replace' || o.op === 'remove') && typeof o.path === 'string');

  const summary = typeof parsed?.summary === 'string' ? parsed.summary : '';
  const changedPaths = Array.isArray(parsed?.changedPaths)
    ? parsed.changedPaths.filter((x: any) => typeof x === 'string')
    : [];

  return { ops, summary, changedPaths };
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: 'Missing OPENAI_API_KEY in environment' }, { status: 500 });
  }

  const model = process.env.OPENAI_MODEL || 'gpt-5';

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: 'Invalid request body', details: e?.message },
      { status: 400 }
    );
  }

  try {
    const { ops, summary, changedPaths } = await callOpenAIPatchOps({
      apiKey,
      model,
      instruction: body.instruction,
      currentJson: body.currentJson
    });

    const updatedJson = applyOps(body.currentJson, ops);

    if (typeof updatedJson !== 'object' || updatedJson == null || Array.isArray(updatedJson)) {
      return NextResponse.json({ ok: false, error: 'Patch produced non-object JSON', ops }, { status: 502 });
    }

    const derivedPaths =
      changedPaths.length > 0
        ? changedPaths
        : ops.map((o) =>
            o.path
              .replace(/^\//, '')
              .split('/')
              .filter(Boolean)
              .map((s) => decodeJsonPointerSegment(s))
              .join('.')
          );

    return NextResponse.json(
      { ok: true, updatedJson, summary, changedPaths: derivedPaths },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Failed to generate JSON edit' }, { status: 500 });
  }
}
