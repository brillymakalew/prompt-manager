import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth';

const BodySchema = z.object({
  instruction: z.string().min(1).max(2000),
  currentJson: z.unknown()
});

type OpenAIResponse = {
  output_text?: string;
  status?: string;
  error?: any;
};

async function callOpenAIJsonEdit(args: {
  apiKey: string;
  model: string;
  instruction: string;
  currentJson: unknown;
}) {
  const { apiKey, model, instruction, currentJson } = args;

  const system =
    'You are a JSON editor. Your job is to update a prompt JSON object based on the user instruction. ' +
    'Return ONLY valid JSON (no markdown). The output MUST be a JSON object with keys: ' +
    'updatedJson (object), summary (string), changedPaths (array of strings). ' +
    'Rules: preserve existing structure and values unless the instruction says to change them; ' +
    'add new keys in the most appropriate section; do not remove data unless explicitly requested; ' +
    'keep strings concise; use Indonesian for summary. ' +
    'If instruction is ambiguous, make a reasonable minimal addition (e.g., create fields with empty strings) and mention it in summary.';

  // Helpful conventions for this app's prompt schema.
  // We intentionally keep this lightweight: the model can adapt to whatever shape it sees.
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
    reasoning: { effort: 'low' },
    // JSON mode: ensure valid JSON output.
    text: { format: { type: 'json_object' } },
    max_output_tokens: 1200,
    input: [
      { role: 'system', content: system + ' IMPORTANT: output must be JSON.' },
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

  const data = (await res.json()) as OpenAIResponse;
  const out = data.output_text ?? '';
  if (!out.trim()) throw new Error('OpenAI returned empty output_text');
  return out;
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
    return NextResponse.json({ ok: false, error: 'Invalid request body', details: e?.message }, { status: 400 });
  }

  try {
    const raw = await callOpenAIJsonEdit({
      apiKey,
      model,
      instruction: body.instruction,
      currentJson: body.currentJson
    });

    const parsed = JSON.parse(raw);
    const updatedJson = parsed?.updatedJson;
    if (typeof updatedJson !== 'object' || updatedJson == null || Array.isArray(updatedJson)) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Model output did not include updatedJson as an object',
          raw
        },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        updatedJson,
        summary: typeof parsed?.summary === 'string' ? parsed.summary : '',
        changedPaths: Array.isArray(parsed?.changedPaths) ? parsed.changedPaths : []
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
