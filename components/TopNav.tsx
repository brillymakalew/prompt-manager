import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import LogoutButton from './LogoutButton';

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-md px-2 py-1 text-sm text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
    >
      {label}
    </Link>
  );
}

export default async function TopNav() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="font-semibold tracking-tight">
            Prompt Manager
          </Link>

          {user && (
            <nav className="hidden items-center gap-1 sm:flex">
              <NavLink href="/prompts" label="Prompts" />
              <NavLink href="/presets" label="Presets" />
              <NavLink href="/templates" label="Templates" />
              <NavLink href="/ai-json" label="AI JSON" />
            </nav>
          )}
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="hidden text-sm text-zinc-600 sm:inline">{user.email}</span>
              <LogoutButton />
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
