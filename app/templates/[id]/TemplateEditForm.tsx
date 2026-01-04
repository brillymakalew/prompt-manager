'use client';

import { useFormState } from 'react-dom';
import { updateTemplateAction } from '../actions';

const initial: { error?: string } = {};

export default function TemplateEditForm({
  template
}: {
  template: {
    id: string;
    name: string;
    description: string | null;
    schemaJson: any;
    exampleJson: any;
  };
}) {
  const [state, action] = useFormState(updateTemplateAction, initial);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="id" value={template.id} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-zinc-700">Name</label>
          <input
            name="name"
            defaultValue={template.name}
            className="mt-1 w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700">Description</label>
          <input
            name="description"
            defaultValue={template.description ?? ''}
            className="mt-1 w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-zinc-700">schemaJson (optional)</label>
          <textarea
            name="schemaJson"
            defaultValue={template.schemaJson ? JSON.stringify(template.schemaJson, null, 2) : ''}
            className="mt-1 h-56 w-full rounded-md border bg-white px-3 py-2 text-xs outline-none focus:border-zinc-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700">exampleJson (optional)</label>
          <textarea
            name="exampleJson"
            defaultValue={template.exampleJson ? JSON.stringify(template.exampleJson, null, 2) : ''}
            className="mt-1 h-56 w-full rounded-md border bg-white px-3 py-2 text-xs outline-none focus:border-zinc-900"
          />
        </div>
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button type="submit" className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800">
        Save changes
      </button>
    </form>
  );
}
