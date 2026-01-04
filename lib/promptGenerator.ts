/*
  Deterministic prompt "compiler".
  - Converts the structured JSON into a readable positive prompt text
  - Gathers negatives from global_negative_prompt + any `avoid` arrays
*/

type AnyObj = Record<string, any>;

function isObj(v: any): v is AnyObj {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function uniqStrings(arr: string[]): string[] {
  const set = new Set<string>();
  for (const s of arr) {
    const t = String(s ?? '').trim();
    if (t) set.add(t);
  }
  return Array.from(set);
}

function toText(v: any): string {
  if (v == null) return '';
  if (Array.isArray(v)) return v.map(toText).filter(Boolean).join(', ');
  if (isObj(v)) {
    // For nested objects, flatten shallow key: value pairs
    const parts: string[] = [];
    for (const [k, val] of Object.entries(v)) {
      const t = toText(val);
      if (t) parts.push(`${k}: ${t}`);
    }
    return parts.join(', ');
  }
  return String(v).trim();
}

function sectionLine(title: string, obj: any, keys?: string[]): string {
  if (!isObj(obj)) return '';
  const parts: string[] = [];
  const entries = keys ? keys.map((k) => [k, obj[k]] as const) : Object.entries(obj);
  for (const [k, v] of entries) {
    if (k === 'avoid') continue;
    if (k === 'global_negative_prompt') continue;
    const t = toText(v);
    if (t) parts.push(t);
  }
  const body = parts.filter(Boolean).join('; ');
  return body ? `${title}: ${body}` : '';
}

export function generatePromptText(promptJson: any): { positive: string; negative: string } {
  const p = promptJson ?? {};

  const lines: string[] = [];
  const negatives: string[] = [];

  // Global negatives
  if (Array.isArray(p.global_negative_prompt)) {
    negatives.push(...p.global_negative_prompt);
  }

  // Gather avoid arrays
  for (const sectionName of Object.keys(p)) {
    const sec = p[sectionName];
    if (isObj(sec) && Array.isArray(sec.avoid)) negatives.push(...sec.avoid);
  }

  lines.push(sectionLine('Character', p.character, ['name', 'age_appearance', 'gender', 'ethnicity', 'era', 'vibe']));
  lines.push(sectionLine('Face', p.face, ['shape', 'jaw', 'eyes', 'eyebrows', 'nose', 'lips', 'distinct_features', 'expression']));
  lines.push(sectionLine('Skin', p.skin, ['tone', 'texture']));
  lines.push(sectionLine('Hair', p.hair, ['color', 'texture', 'length', 'style', 'bangs', 'part']));
  // Body may optionally include a richer "profile" object (e.g., height/build/proportions)
  // which will be flattened as key: value pairs by `toText`.
  lines.push(sectionLine('Body', p.body, ['type', 'profile', 'posture', 'movement']));
  lines.push(sectionLine('Makeup', p.makeup, ['style', 'coverage', 'base', 'eyes', 'lips']));
  lines.push(sectionLine('Clothing', p.clothing, ['style', 'silhouette', 'colors']));

  if (Array.isArray(p.accessories)) {
    lines.push(`Accessories: ${p.accessories.map(toText).filter(Boolean).join(', ')}`);
  }

  lines.push(sectionLine('Environment', p.environment, ['location', 'lighting']));
  lines.push(sectionLine('Camera', p.camera, ['angle', 'framing', 'lens', 'style']));

  const positive = lines.filter(Boolean).join('. ');
  const negative = uniqStrings(negatives).join(', ');

  return { positive, negative };
}

export function formatPromptBlock(promptJson: any): string {
  const { positive, negative } = generatePromptText(promptJson);
  const parts = [`Positive: ${positive}`];
  if (negative.trim()) parts.push(`Negative: ${negative}`);
  return parts.join('\n\n');
}
