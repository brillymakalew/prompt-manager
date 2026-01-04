'use client';

import { useFormState } from 'react-dom';
import { createTemplateAction } from './actions';

const initial: { error?: string } = {};

export default function TemplateCreateForm() {
  const [state, action] = useFormState(createTemplateAction, initial);

  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-zinc-700">Name</label>
          <input name="name" className="mt-1 w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900" placeholder="e.g. Virtual Influencer v1" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700">Description (optional)</label>
          <input name="description" className="mt-1 w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900" placeholder="Short notes" />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-zinc-700">schemaJson (optional)</label>
          <textarea name="schemaJson" className="mt-1 h-40 w-full rounded-md border bg-white px-3 py-2 text-xs outline-none focus:border-zinc-900" placeholder='{ "type": "object", ... }' />
          <p className="mt-1 text-xs text-zinc-500">For MVP you can leave this empty.</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700">exampleJson (optional)</label>
          <textarea name="exampleJson" className="mt-1 h-40 w-full rounded-md border bg-white px-3 py-2 text-xs outline-none focus:border-zinc-900" placeholder='{ "character": { ... } }' />
          <p className="mt-1 text-xs text-zinc-500">Useful as a starting point when creating presets.</p>
        </div>
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button type="submit" className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800">
        Create template
      </button>
    </form>
  );
}
