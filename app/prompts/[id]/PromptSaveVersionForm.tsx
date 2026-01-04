'use client';

import { useState } from 'react';
import { useFormState } from 'react-dom';
import { saveNewVersionAction } from '../actions';

const initial: { error?: string } = {};

export default function PromptSaveVersionForm({
  promptId,
  currentJson
}: {
  promptId: string;
  currentJson: any;
}) {
  const [state, action] = useFormState(saveNewVersionAction, initial);

  const [jsonText, setJsonText] = useState<string>(JSON.stringify(currentJson, null, 2));
  const [instruction, setInstruction] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string>('');
  const [aiSummary, setAiSummary] = useState<string>('');

  async function applyAiEdit() {
    setAiError('');
    setAiSummary('');

    let current: unknown;
    try {
      current = JSON.parse(jsonText);
    } catch {
      setAiError('JSON tidak valid. Periksa koma / tanda kutip.');
      return;
    }
    if (!instruction.trim()) {
      setAiError('Instruksi belum diisi.');
      return;
    }

    setAiLoading(true);
    try {
      const res = await fetch('/api/ai/json-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instruction, currentJson: current })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setAiError(data?.error || 'Gagal memproses AI');
        return;
      }
      setJsonText(JSON.stringify(data.updatedJson, null, 2));
      setAiSummary(data.summary || '');
    } catch (e: any) {
      setAiError(e?.message || 'Gagal memproses AI');
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="promptId" value={promptId} />

      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="w-full">
            <label className="block text-sm font-medium text-zinc-700">AI instruction</label>
            <input
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              placeholder='contoh: "tambah profil body"'
            />
            <p className="mt-1 text-xs text-zinc-600">
              Tip: gunakan instruksi singkat, misalnya &quot;tambah profil body&quot; atau &quot;ubah hair.color jadi blonde&quot;.
            </p>
          </div>

          <button
            type="button"
            onClick={applyAiEdit}
            disabled={aiLoading}
            className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {aiLoading ? 'Memproses…' : 'Apply AI Edit'}
          </button>
        </div>

        {aiError && <p className="mt-2 text-sm text-red-600">{aiError}</p>}
        {aiSummary && (
          <p className="mt-2 text-sm text-zinc-700">
            <span className="font-medium">Ringkasan:</span> {aiSummary}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700">promptJson (editing + Save creates new version)</label>
        <textarea
          name="promptJson"
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          className="mt-1 h-[32rem] w-full rounded-md border bg-white px-3 py-2 text-xs outline-none focus:border-zinc-900"
          spellCheck={false}
          required
        />
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button type="submit" className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800">
        Save new version
      </button>
    </form>
  );
}
