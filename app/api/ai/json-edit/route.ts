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
  // some SDKs/variants might include this; harmless as fallback
  output_text?: string;
};

function extractOutputText(data: ResponsesApiResponse): string {
  // Fallback if some runtime includes output_text
  if (typeof data?.output_text === 'string' && data.output_text.trim()) {
    return data.output_text.trim();
  }

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
    'You are a JSON editor. Update a prompt JSON object based on the user instruction.\n' +
    'Return ONLY valid JSON (no markdown, no commentary).\n' +
    'Your output MUST be an object with keys:\n' +
    '- updatedJsonText: string (this must be a JSON string of the UPDATED object)\n' +
    '- summary: string (Indonesian)\n' +
    '- changedPaths: array of strings (dot-paths like "body.profile.height")\n' +
    'Rules:\n' +
    '- Preserve existing structure/values unless instruction asks to change.\n' +
    '- Add new keys in the most appropriate section.\n' +
    '- Do not remove data unless explicitly requested.\n' +
    '- Keep strings concise.\n' +
    '- If instruction is ambiguous, do minimal addition and mention it in summary.\n';

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
      // Example: "tambah profil body" -> add body.profile
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
        name: 'json_edit_result_v1',
        strict: true,
        schema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            updatedJsonText: { type: 'string' },
            summary: { type: 'string' },
            changedPaths: { type: 'array', items: { type: 'string' } }
          },
          required: ['updatedJsonText', 'summary', 'changedPaths']
        }
      }
    },
    max_output_tokens: 1200,
    input: [
      { role: 'system', content: system },
      {
        role: 'user',
        content: JSON.stringify(
          {
            instruction,
            currentJson,
            conventions
          },
          null,
          2
        )
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

  // Parse the model output JSON (outer object)
  let parsed: any;
  try {
    parsed = JSON.parse(out);
  } catch (e: any) {
    const tail = out.slice(Math.max(0, out.length - 500));
    throw new Error(`Model returned invalid JSON: ${e?.message}. Tail: ${tail}`);
  }

  const updatedJsonText = parsed?.updatedJsonText;
  if (typeof updatedJsonText !== 'string' || !updatedJsonText.trim()) {
    throw new Error('Model output did not include updatedJsonText as a non-empty string');
  }

  // Parse updatedJsonText into object
  let updatedJson: any;
  try {
    updatedJson = JSON.parse(updatedJsonText);
  } catch (e: any) {
    const tail = updatedJsonText.slice(Math.max(0, updatedJsonText.length - 500));
    throw new Error(`updatedJsonText is not valid JSON: ${e?.message}. Tail: ${tail}`);
  }

  if (typeof updatedJson !== 'object' || updatedJson == null || Array.isArray(updatedJson)) {
    throw new Error('updatedJsonText did not parse into a JSON object');
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
