import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import PromptCreateFromPresetForm from './PromptCreateFromPresetForm';
import PromptCreateBlankForm from './PromptCreateBlankForm';
import { deletePromptAction } from './actions';

export default async function PromptsPage() {
  const user = await requireUser();
  const [presets, prompts] = await Promise.all([
    prisma.preset.findMany({ where: { userId: user.id }, orderBy: { updatedAt: 'desc' } }),
    prisma.prompt.findMany({ where: { userId: user.id }, orderBy: { updatedAt: 'desc' } })
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Prompts</h1>
        <p className="mt-1 text-sm text-zinc-600">Prompts are versioned. Saving changes creates a new version and updates the current one.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold tracking-tight">Create from preset</h2>
          <div className="mt-4">
            {presets.length > 0 ? (
              <PromptCreateFromPresetForm presets={presets.map((p) => ({ id: p.id, name: p.name }))} />
            ) : (
              <p className="text-sm text-zinc-600">
                You need a <Link href="/presets" className="underline">preset</Link> first.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold tracking-tight">Create blank prompt</h2>
          <div className="mt-4">
            <PromptCreateBlankForm />
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Your prompts</h2>
          <p className="text-sm text-zinc-600">{prompts.length} total</p>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-zinc-600">
                <th className="py-2">Title</th>
                <th className="py-2">Tags</th>
                <th className="py-2">Updated</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {prompts.map((p) => (
                <tr key={p.id} className="border-b last:border-b-0">
                  <td className="py-2">
                    <Link href={`/prompts/${p.id}`} className="font-medium hover:underline">
                      {p.title}
                    </Link>
                  </td>
                  <td className="py-2 text-zinc-700">{p.tags.join(', ')}</td>
                  <td className="py-2 text-zinc-600">{p.updatedAt.toLocaleString()}</td>
                  <td className="py-2">
                    <form action={deletePromptAction}>
                      <input type="hidden" name="id" value={p.id} />
                      <button className="rounded-md border bg-white px-2 py-1 text-xs hover:bg-zinc-50" type="submit">
                        Delete
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {prompts.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-zinc-600">
                    No prompts yet.
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
