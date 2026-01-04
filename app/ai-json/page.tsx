import { requireUser } from '@/lib/auth';
import AiJsonEditor from './AiJsonEditor';

export default async function AiJsonPage() {
  await requireUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">AI JSON Editor</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Ubah JSON prompt lewat instruksi natural (contoh: &quot;tambah profil body&quot;, &quot;ubah hair.color jadi blonde&quot;).
        </p>
      </div>

      <AiJsonEditor />
    </div>
  );
}
