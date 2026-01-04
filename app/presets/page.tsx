import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import PresetCreateForm from './PresetCreateForm';
import { deletePresetAction } from './actions';

export default async function PresetsPage() {
  const user = await requireUser();
  const [templates, presets] = await Promise.all([
    prisma.template.findMany({ where: { userId: user.id }, orderBy: { updatedAt: 'desc' } }),
    prisma.preset.findMany({ where: { userId: user.id }, include: { template: true }, orderBy: { updatedAt: 'desc' } })
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Presets</h1>
        <p className="mt-1 text-sm text-zinc-600">Presets are ready-to-use JSON instances (usually based on a template).</p>
      </div>

      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold tracking-tight">Create new preset</h2>
        <div className="mt-4">
          {templates.length > 0 ? (
            <PresetCreateForm templates={templates.map((t) => ({ id: t.id, name: t.name, exampleJson: t.exampleJson }))} />
          ) : (
            <p className="text-sm text-zinc-600">
              You need a <Link href="/templates" className="underline">template</Link> first.
            </p>
          )}
        </div>
      </div>

      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Your presets</h2>
          <p className="text-sm text-zinc-600">{presets.length} total</p>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-zinc-600">
                <th className="py-2">Name</th>
                <th className="py-2">Template</th>
                <th className="py-2">Updated</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {presets.map((p) => (
                <tr key={p.id} className="border-b last:border-b-0">
                  <td className="py-2">
                    <Link href={`/presets/${p.id}`} className="font-medium hover:underline">
                      {p.name}
                    </Link>
                  </td>
                  <td className="py-2 text-zinc-700">{p.template.name}</td>
                  <td className="py-2 text-zinc-600">{p.updatedAt.toLocaleString()}</td>
                  <td className="py-2">
                    <form action={deletePresetAction}>
                      <input type="hidden" name="id" value={p.id} />
                      <button className="rounded-md border bg-white px-2 py-1 text-xs hover:bg-zinc-50" type="submit">
                        Delete
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {presets.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-zinc-600">
                    No presets yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
