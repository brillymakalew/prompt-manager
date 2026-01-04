import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import TemplateEditForm from './TemplateEditForm';

export default async function TemplateDetailPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const template = await prisma.template.findFirst({ where: { id: params.id, userId: user.id } });

  if (!template) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Template not found</h1>
        <Link href="/templates" className="underline">Back to templates</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/templates" className="text-sm text-zinc-600 hover:underline">← Templates</Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{template.name}</h1>
        {template.description && <p className="mt-1 text-sm text-zinc-600">{template.description}</p>}
      </div>

      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold tracking-tight">Edit template</h2>
        <div className="mt-4">
          <TemplateEditForm
            template={{
              id: template.id,
              name: template.name,
              description: template.description,
              schemaJson: template.schemaJson,
              exampleJson: template.exampleJson
            }}
          />
        </div>
      </div>
    </div>
  );
}
