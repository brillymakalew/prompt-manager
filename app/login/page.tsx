import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import LoginForm from './LoginForm';

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect('/dashboard');

  return (
    <div className="mx-auto grid max-w-md gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Manage presets, prompts, versions, and generated images in one place.
        </p>
      </div>

      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <LoginForm />
      </div>
    </div>
  );
}
