import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import PromptMetaForm from './PromptMetaForm';
import PromptSaveVersionForm from './PromptSaveVersionForm';
import ImageUploadForm from './ImageUploadForm';

export default async function PromptDetailPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const prompt = await prisma.prompt.findFirst({
    where: { id: params.id, userId: user.id },
    include: {
      versions: { orderBy: { versionNo: 'desc' } },
      images: { orderBy: { createdAt: 'desc' } }
    }
  });

  if (!prompt) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Prompt not found</h1>
        <Link href="/prompts" className="underline">Back to prompts</Link>
      </div>
    );
  }

  const currentVersion = prompt.currentVersionId
    ? await prisma.promptVersion.findFirst({ where: { id: prompt.currentVersionId, promptId: prompt.id } })
    : prompt.versions[0] ?? null;

  const currentJson = currentVersion?.promptJson ?? {};
  const generatedText = currentVersion?.generatedText ?? '';

  return (
    <div className="space-y-6">
      <div>
        <Link href="/prompts" className="text-sm text-zinc-600 hover:underline">← Prompts</Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{prompt.title}</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Current version: <span className="font-medium">v{currentVersion?.versionNo ?? '-'}</span>
        </p>
      </div>

      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold tracking-tight">Metadata</h2>
        <div className="mt-4">
          <PromptMetaForm prompt={{ id: prompt.id, title: prompt.title, tags: prompt.tags }} />
        </div>
      </div>

      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold tracking-tight">Generated prompt text</h2>
        <p className="mt-2 text-sm text-zinc-600">Deterministic rendering from the JSON. Copy/paste into your image model.</p>
        <pre className="mt-4 whitespace-pre-wrap rounded-lg border bg-zinc-50 p-4 text-xs leading-relaxed">{generatedText}</pre>
      </div>

      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold tracking-tight">Edit JSON → Save new version</h2>
        <div className="mt-4">
          <PromptSaveVersionForm promptId={prompt.id} currentJson={currentJson} />
        </div>
      </div>

      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold tracking-tight">Versions</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-zinc-600">
                <th className="py-2">Version</th>
                <th className="py-2">Created</th>
                <th className="py-2">Notes</th>
              </tr>
            </thead>
            <tbody>
              {prompt.versions.map((v) => (
                <tr key={v.id} className="border-b last:border-b-0">
                  <td className="py-2 font-medium">v{v.versionNo}{v.id === currentVersion?.id ? ' (current)' : ''}</td>
                  <td className="py-2 text-zinc-600">{v.createdAt.toLocaleString()}</td>
                  <td className="py-2 text-zinc-700">{v.notes ?? ''}</td>
                </tr>
              ))}
              {prompt.versions.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-zinc-600">No versions.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold tracking-tight">Images</h2>
        <p className="mt-2 text-sm text-zinc-600">Upload images generated from this prompt version (or any version).</p>
        <div className="mt-4">
          <ImageUploadForm promptId={prompt.id} versionId={currentVersion?.id ?? null} />
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {prompt.images.map((img) => (
            <div key={img.id} className="overflow-hidden rounded-xl border bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/api/images/${img.id}`} alt={img.originalName} className="h-56 w-full object-cover" />
              <div className="space-y-1 p-3 text-sm">
                <p className="font-medium line-clamp-1">{img.originalName}</p>
                <p className="text-xs text-zinc-600">{(img.sizeBytes / 1024).toFixed(1)} KB • {img.createdAt.toLocaleString()}</p>
                <p className="text-xs text-zinc-600">Model: {img.model ?? '-'} • Seed: {img.seed ?? '-'}</p>
                {img.rating && <p className="text-xs text-zinc-600">Rating: {img.rating}/5</p>}
                {img.notes && <p className="text-xs text-zinc-700">{img.notes}</p>}
              </div>
            </div>
          ))}
          {prompt.images.length === 0 && <p className="text-sm text-zinc-600">No images uploaded yet.</p>}
        </div>
      </div>
    </div>
  );
}
