'use client';

import { useMemo, useState } from 'react';

function prettyJson(v: unknown): string {
  return JSON.stringify(v, null, 2);
}

export default function AiJsonEditor() {
  const starter = useMemo(
    () =>
      prettyJson({
        character: { name: 'Nadya', vibe: 'real person, approachable' },
        body: { type: 'slim, healthy, lightly athletic', posture: 'relaxed', movement: 'calm' }
      }),
    []
  );

  const [jsonText, setJsonText] = useState<string>(starter);
  const [instruction, setInstruction] = useState<string>('tambah profil body');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [summary, setSummary] = useState<string>('');
  const [changedPaths, setChangedPaths] = useState<string[]>([]);

  async function onApply() {
    setError('');
    setSummary('');
    setChangedPaths([]);

    let currentJson: unknown;
    try {
      currentJson = JSON.parse(jsonText);
    } catch {
      setError('JSON tidak valid. Periksa koma / tanda kutip.');
      return;
    }

    if (!instruction.trim()) {
      setError('Instruksi belum diisi.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/ai/json-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instruction, currentJson })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data?.error || 'Gagal memproses AI');
        return;
      }

      setJsonText(prettyJson(data.updatedJson));
      setSummary(data.summary || '');
      setChangedPaths(Array.isArray(data.changedPaths) ? data.changedPaths : []);
    } catch (e: any) {
      setError(e?.message || 'Gagal memproses AI');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">JSON</label>
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            rows={18}
            className="w-full rounded-md border bg-white px-3 py-2 font-mono text-xs text-zinc-900"
          />
        </div>

        <div className="space-y-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">Instruksi</label>
            <input
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder='contoh: "tambah profil body"'
            />
            <button
              type="button"
              onClick={onApply}
              disabled={loading}
              className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              {loading ? 'Memproses…' : 'Apply AI Edit'}
            </button>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          {(summary || changedPaths.length > 0) && (
            <div className="rounded-lg border bg-zinc-50 p-3">
              {summary && (
                <p className="text-sm text-zinc-800">
                  <span className="font-medium">Ringkasan:</span> {summary}
                </p>
              )}
              {changedPaths.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-medium text-zinc-700">Changed paths</p>
                  <ul className="mt-1 list-disc pl-5 text-xs text-zinc-700">
                    {changedPaths.slice(0, 12).map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <p className="text-xs text-zinc-600">
            Catatan: butuh <span className="font-mono">OPENAI_API_KEY</span> di environment.
          </p>
        </div>
      </div>
    </div>
  );
}
