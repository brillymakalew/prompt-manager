'use client';

import { useFormState } from 'react-dom';
import { createBlankPromptAction } from './actions';

const initial: { error?: string } = {};

export default function PromptCreateBlankForm() {
  const [state, action] = useFormState(createBlankPromptAction, initial);

  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-zinc-700">Prompt title</label>
          <input name="title" className="mt-1 w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700">Tags (optional)</label>
          <input name="tags" className="mt-1 w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900" placeholder="comma, separated" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700">promptJson</label>
        <textarea
          name="promptJson"
          className="mt-1 h-64 w-full rounded-md border bg-white px-3 py-2 text-xs outline-none focus:border-zinc-900"
          spellCheck={false}
          placeholder='{
  "character": {
    "name": "Nadya"
  }
}'
          required
        />
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button type="submit" className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800">
        Create prompt
      </button>
    </form>
  );
}
