'use client';

import { useFormState } from 'react-dom';
import type { LoginState } from './actions';
import { loginAction } from './actions';

const initialState: LoginState = {};

export default function LoginForm() {
  const [state, action] = useFormState(loginAction, initialState);

  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-zinc-700">Email</label>
        <input
          name="email"
          type="email"
          autoComplete="email"
          className="mt-1 w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
          placeholder="admin@local"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700">Password</label>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          className="mt-1 w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
          placeholder="your password"
          required
        />
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        className="w-full rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
      >
        Sign in
      </button>

      <p className="text-xs text-zinc-500">
        First run: use seeded admin (default <span className="font-mono">admin@local</span> /{' '}
        <span className="font-mono">admin12345</span>) or set <span className="font-mono">ADMIN_EMAIL</span> /{' '}
        <span className="font-mono">ADMIN_PASSWORD</span> in <span className="font-mono">.env</span> before
        seeding.
      </p>
    </form>
  );
}
