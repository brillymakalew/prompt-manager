'use client';

import { useFormState } from 'react-dom';
import { uploadImageAction } from '../actions';

const initial: { error?: string } = {};

export default function ImageUploadForm({
  promptId,
  versionId
}: {
  promptId: string;
  versionId: string | null;
}) {
  const [state, action] = useFormState(uploadImageAction, initial);

  return (
    <form action={action} className="space-y-3" encType="multipart/form-data">
      <input type="hidden" name="promptId" value={promptId} />
      {versionId && <input type="hidden" name="versionId" value={versionId} />}

      <div>
        <label className="block text-sm font-medium text-zinc-700">Image file</label>
        <input name="file" type="file" accept="image/*" className="mt-1 block text-sm" required />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="block text-sm font-medium text-zinc-700">Model (optional)</label>
          <input name="model" className="mt-1 w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900" placeholder="SDXL / Midjourney / etc" />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700">Seed (optional)</label>
          <input name="seed" className="mt-1 w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900" placeholder="12345" />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700">Rating (optional)</label>
          <input name="rating" type="number" min="1" max="5" className="mt-1 w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900" placeholder="1-5" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700">Notes (optional)</label>
        <textarea name="notes" className="mt-1 h-24 w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900" placeholder="lighting looks best; keep this vibe" />
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button type="submit" className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800">
        Upload image
      </button>
    </form>
  );
}
