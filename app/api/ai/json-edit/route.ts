import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth';

const BodySchema = z.object({
  instruction: z.string().min(1).max(2000),
  currentJson: z.unknown()
});

type ResponsesApiMessage = {
  type: 'message';
  role?: string;
  content?: Array<{ type?: string; text?: string }>;
};

type ResponsesApiResponse = {
  status?: string;
  error?: any;
  output?: Array<ResponsesApiMessage | any>;
};

function extractOutputText(data: ResponsesApiResponse): string {
  if (!data?.output || !Array.isArray(data.output)) return '';

  const chunks: string[] = [];
  for (const item of data.output) {
    if (item?.type !== 'message') continue;
    if (item?.role !== 'assistant') continue;
    if (!Array.isArray(item.content)) continue;

    for (const c of item.content) {
      if (c?.type === 'output_text' && typeof c.text === 'string') {
        chunks.push(c.text);
      }
    }
  }
  return chunks.join('\n').trim();
}

async function callOpenAIJsonEdit(args: {
  apiKey: string;
  model: string;
  instruction: string;
  currentJson: unknown;
}): Promise<{ updatedJson: Record<string, any>; summary: string; changedPaths: string[] }> {
  const { apiKey, model, instruction, currentJson } = args;

  const system =
    'You are a JSON editor. Your job is to update a prompt JSON object based on the user instruction. ' +
    'Return ONLY valid JSON (no markdown). The output MUST be a JSON object with keys: ' +
    'updatedJson (object), summary (string), changedPaths (array of strings). ' +
    'Rules: preserve existing structure and values unless the instruction says to change them; ' +
    'add new keys in the most appropriate section; do not remove data unless explicitly requested; ' +
    'keep strings concise; use Indonesian for summary. ' +
    'If instruction is ambiguous, make a reasonable minimal addition (e.g., create fields with empty strings) and mention it in summary.';

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
        strict: true,
        schema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            updatedJson: { type: 'object' },
            summary: { type: 'string' },
            changedPaths: { type: 'array', items: { type: 'string' } }
          },
          required: ['updatedJson', 'summary', 'changedPaths']
        }
      }
    },
    max_output_tokens: 1200,
    input: [
      { role: 'system', content: system + ' IMPORTANT: output must be JSON.' },
      {
        role: 'user',
        content: JSON.stringify({ instruction, currentJson, conventions }, null, 2)
      }
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
  const out = extractOutputText(data);

  if (!out) {
    const status = data?.status ?? 'unknown';
    const err = data?.error ? JSON.stringify(data.error) : '';
    throw new Error(`OpenAI returned empty output. status=${status} ${err}`);
  }

  let parsed: any;
  try {
    parsed = JSON.parse(out);
  } catch (e: any) {
    const tail = out.slice(Math.max(0, out.length - 400));
    throw new Error(`Model returned invalid JSON: ${e?.message}. Tail: ${tail}`);
  }

  const updatedJson = parsed?.updatedJson;
  if (typeof updatedJson !== 'object' || updatedJson == null || Array.isArray(updatedJson)) {
    throw new Error('Model output did not include updatedJson as an object');
  }

  const summary = typeof parsed?.summary === 'string' ? parsed.summary : '';
  const changedPaths = Array.isArray(parsed?.changedPaths)
    ? parsed.changedPaths.filter((x: any) => typeof x === 'string')
    : [];

  return {
    updatedJson: updatedJson as Record<string, any>,
    summary,
    changedPaths
  };
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: 'Missing OPENAI_API_KEY in environment' },
      { status: 500 }
    );
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
    const result = await callOpenAIJsonEdit({
      apiKey,
      model,
      instruction: body.instruction,
      currentJson: body.currentJson
    });

    return NextResponse.json(
      {
        ok: true,
        updatedJson: result.updatedJson,
        summary: result.summary,
        changedPaths: result.changedPaths
      },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || 'Failed to generate JSON edit' },
      { status: 500 }
    );
  }
}
