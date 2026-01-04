'use client';

import { useFormState } from 'react-dom';
import { updatePromptMetaAction } from '../actions';

const initial: { error?: string } = {};

export default function PromptMetaForm({
  prompt
}: {
  prompt: { id: string; title: string; tags: string[] };
}) {
  const [state, action] = useFormState(updatePromptMetaAction, initial);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="id" value={prompt.id} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-zinc-700">Title</label>
          <input
            name="title"
            defaultValue={prompt.title}
            className="mt-1 w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700">Tags</label>
          <input
            name="tags"
            defaultValue={prompt.tags.join(', ')}
            className="mt-1 w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
            placeholder="comma, separated"
          />
        </div>
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button type="submit" className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800">
        Save metadata
      </button>
    </form>
  );
}
