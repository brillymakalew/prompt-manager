import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type FeatureCardProps = {
  title: string;
  value?: string | number;
  href: string;
  description: string;
};

function FeatureCard(props: FeatureCardProps) {
  const { title, value, href, description } = props;

  return (
    <Link href={href} className="rounded-xl border bg-white p-5 shadow-sm hover:shadow">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-zinc-900">{title}</p>
          <p className="mt-1 text-sm text-zinc-600">{description}</p>
        </div>
        {value != null && <p className="text-xl font-semibold text-zinc-900">{value}</p>}
      </div>
    </Link>
  );
}

export default async function DashboardPage() {
  const user = await requireUser();

  const [promptCount, presetCount, templateCount, imageCount] = await Promise.all([
    prisma.prompt.count({ where: { userId: user.id } }),
    prisma.preset.count({ where: { userId: user.id } }),
    prisma.template.count({ where: { userId: user.id } }),
    prisma.imageAsset.count({ where: { prompt: { userId: user.id } } })
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Landing</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Shortcut ke fitur utama (login:{' '}
          <span className="font-medium">{user.email}</span>
          ).
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
        <FeatureCard
          title="Prompts"
          value={promptCount}
          href="/prompts"
          description="Buat prompt baru, edit JSON, simpan version, dan compile ke Positive/Negative."
        />
        <FeatureCard
          title="AI JSON Editor"
          href="/ai-json"
          description='Modifikasi JSON prompt pakai instruksi natural (contoh: "tambah profil body").'
        />
        <FeatureCard
          title="Presets"
          value={presetCount}
          href="/presets"
          description="JSON reusable sebagai starting point (biasanya turunan dari template)."
        />
        <FeatureCard
          title="Templates"
          value={templateCount}
          href="/templates"
          description="Definisikan struktur prompt: example JSON + opsional JSON Schema."
        />
      </div>

      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold tracking-tight">Start here</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-zinc-700">
          <li>
            Create a{' '}
            <Link href="/templates" className="underline">
              template
            </Link>{' '}
            or use the seeded example.
          </li>
          <li>
            Create a{' '}
            <Link href="/presets" className="underline">
              preset
            </Link>{' '}
            from a template.
          </li>
          <li>
            Create a{' '}
            <Link href="/prompts" className="underline">
              prompt
            </Link>
            , edit JSON, and save a version.
          </li>
          <li>
            Opsional: gunakan{' '}
            <Link href="/ai-json" className="underline">
              AI JSON Editor
            </Link>{' '}
            untuk bantu edit JSON cepat.
          </li>
          <li>Upload generated images and rate them.</li>
        </ol>

        <p className="mt-3 text-sm text-zinc-600">
          Images attached: <span className="font-medium">{imageCount}</span>
        </p>
      </div>
    </div>
  );
}
