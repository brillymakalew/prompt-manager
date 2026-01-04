'use client';

import { useFormState } from 'react-dom';
import { updatePresetAction } from '../actions';

const initial: { error?: string } = {};

export default function PresetEditForm({
  preset
}: {
  preset: {
    id: string;
    name: string;
    presetJson: any;
    lockJson: any;
  };
}) {
  const [state, action] = useFormState(updatePresetAction, initial);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="id" value={preset.id} />
      <div>
        <label className="block text-sm font-medium text-zinc-700">Name</label>
        <input
          name="name"
          defaultValue={preset.name}
          className="mt-1 w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
          required
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-zinc-700">presetJson</label>
          <textarea
            name="presetJson"
            defaultValue={JSON.stringify(preset.presetJson, null, 2)}
            className="mt-1 h-96 w-full rounded-md border bg-white px-3 py-2 text-xs outline-none focus:border-zinc-900"
            spellCheck={false}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700">lockJson (optional)</label>
          <textarea
            name="lockJson"
            defaultValue={preset.lockJson ? JSON.stringify(preset.lockJson, null, 2) : ''}
            className="mt-1 h-96 w-full rounded-md border bg-white px-3 py-2 text-xs outline-none focus:border-zinc-900"
            spellCheck={false}
          />
          <p className="mt-1 text-xs text-zinc-500">Future feature: enforce locked fields when customizing.</p>
        </div>
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button type="submit" className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800">
        Save changes
      </button>
    </form>
  );
}
