import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import TemplateCreateForm from './TemplateCreateForm';
import { deleteTemplateAction } from './actions';

export default async function TemplatesPage() {
  const user = await requireUser();
  const templates = await prisma.template.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: 'desc' }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Templates</h1>
        <p className="mt-1 text-sm text-zinc-600">Templates define the structure (schema) and can keep an example JSON.</p>
      </div>

      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold tracking-tight">Create new template</h2>
        <div className="mt-4">
          <TemplateCreateForm />
        </div>
      </div>

      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Your templates</h2>
          <p className="text-sm text-zinc-600">{templates.length} total</p>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-zinc-600">
                <th className="py-2">Name</th>
                <th className="py-2">Updated</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((t) => (
                <tr key={t.id} className="border-b last:border-b-0">
                  <td className="py-2">
                    <Link href={`/templates/${t.id}`} className="font-medium hover:underline">
                      {t.name}
                    </Link>
                    {t.description && <div className="text-xs text-zinc-500">{t.description}</div>}
                  </td>
                  <td className="py-2 text-zinc-600">{t.updatedAt.toLocaleString()}</td>
                  <td className="py-2">
                    <form action={deleteTemplateAction}>
                      <input type="hidden" name="id" value={t.id} />
                      <button className="rounded-md border bg-white px-2 py-1 text-xs hover:bg-zinc-50" type="submit">
                        Delete
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {templates.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-zinc-600">
                    No templates yet.
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
