'use client';

import { useState } from 'react';
import { useFormState } from 'react-dom';
import { createPromptFromPresetAction } from './actions';

const initial: { error?: string } = {};

export default function PromptCreateFromPresetForm({
  presets
}: {
  presets: { id: string; name: string }[];
}) {
  const [state, action] = useFormState(createPromptFromPresetAction, initial);
  const [presetId, setPresetId] = useState(presets[0]?.id ?? '');

  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-zinc-700">Preset</label>
          <select
            name="presetId"
            value={presetId}
            onChange={(e) => setPresetId(e.target.value)}
            className="mt-1 w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
            required
          >
            {presets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700">Prompt title</label>
          <input
            name="title"
            className="mt-1 w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
            placeholder="e.g. Nadya - Jakarta cafe" 
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700">Tags (optional)</label>
        <input
          name="tags"
          className="mt-1 w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
          placeholder="cafe, jakarta, warm" 
        />
        <p className="mt-1 text-xs text-zinc-500">Comma-separated.</p>
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button type="submit" className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800">
        Create prompt
      </button>
    </form>
  );
}
