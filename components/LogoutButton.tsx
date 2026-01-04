import { logout } from '@/lib/auth';
import { redirect } from 'next/navigation';

async function logoutAction() {
  'use server';
  await logout();
  redirect('/login');
}

export default function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="rounded-md border bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
      >
        Log out
      </button>
    </form>
  );
}
