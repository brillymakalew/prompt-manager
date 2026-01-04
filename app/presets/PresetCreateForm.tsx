'use client';

import { useEffect, useMemo, useState } from 'react';
import { useFormState } from 'react-dom';
import { createPresetAction } from './actions';

const initial: { error?: string } = {};

export default function PresetCreateForm({
  templates
}: {
  templates: { id: string; name: string; exampleJson: any }[];
}) {
  const [state, action] = useFormState(createPresetAction, initial);

  const defaultTemplateId = templates[0]?.id ?? '';
  const [templateId, setTemplateId] = useState(defaultTemplateId);

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === templateId),
    [templates, templateId]
  );

  const [name, setName] = useState('');
  const [presetJsonText, setPresetJsonText] = useState('');
  const [lockJsonText, setLockJsonText] = useState('');
  const [touchedPreset, setTouchedPreset] = useState(false);

  useEffect(() => {
    if (!selectedTemplate) return;
    if (!touchedPreset) {
      const example = selectedTemplate.exampleJson ?? {};
      setPresetJsonText(JSON.stringify(example, null, 2));
    }
  }, [selectedTemplate?.id]);

  useEffect(() => {
    if (!presetJsonText && selectedTemplate) {
      const example = selectedTemplate.exampleJson ?? {};
      setPresetJsonText(JSON.stringify(example, null, 2));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-zinc-700">Template</label>
          <select
            name="templateId"
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
            className="mt-1 w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
            required
          >
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700">Preset name</label>
          <input
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
            placeholder="e.g. Nadya - Casual v1"
            required
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-zinc-700">presetJson</label>
          <textarea
            name="presetJson"
            value={presetJsonText}
            onChange={(e) => {
              setTouchedPreset(true);
              setPresetJsonText(e.target.value);
            }}
            className="mt-1 h-80 w-full rounded-md border bg-white px-3 py-2 text-xs outline-none focus:border-zinc-900"
            spellCheck={false}
            required
          />
          <p className="mt-1 text-xs text-zinc-500">
            Tip: start from template exampleJson (auto-filled) then tweak values.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700">lockJson (optional)</label>
          <textarea
            name="lockJson"
            value={lockJsonText}
            onChange={(e) => setLockJsonText(e.target.value)}
            className="mt-1 h-80 w-full rounded-md border bg-white px-3 py-2 text-xs outline-none focus:border-zinc-900"
            spellCheck={false}
            placeholder='{ "character": ["gender", "ethnicity"], "skin": ["tone"] }'
          />
          <p className="mt-1 text-xs text-zinc-500">
            For future: lock specific fields so they don't change during customization.
          </p>
        </div>
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
      >
        Create preset
      </button>
    </form>
  );
}
