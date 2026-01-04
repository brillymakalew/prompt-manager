import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import PresetEditForm from './PresetEditForm';

export default async function PresetDetailPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const preset = await prisma.preset.findFirst({
    where: { id: params.id, userId: user.id },
    include: { template: true }
  });

  if (!preset) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Preset not found</h1>
        <Link href="/presets" className="underline">
          Back to presets
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/presets" className="text-sm text-zinc-600 hover:underline">
          ← Presets
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{preset.name}</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Template: <span className="font-medium">{preset.template.name}</span>
        </p>
      </div>

      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold tracking-tight">Edit preset</h2>
        <div className="mt-4">
          <PresetEditForm
            preset={{
              id: preset.id,
              name: preset.name,
              presetJson: preset.presetJson,
              lockJson: preset.lockJson
            }}
          />
        </div>
      </div>

      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold tracking-tight">Next step</h2>
        <p className="mt-2 text-sm text-zinc-700">
          Create a prompt from this preset in <Link href="/prompts" className="underline">Prompts</Link>.
        </p>
      </div>
    </div>
  );
}
