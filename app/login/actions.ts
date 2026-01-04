'use server';

import { createSession, setSessionCookie, verifyPassword } from '@/lib/auth';
import { redirect } from 'next/navigation';

export type LoginState = { error?: string };

export async function loginAction(prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!email || !password) return { error: 'Email and password are required.' };

  const user = await verifyPassword(email, password);
  if (!user) return { error: 'Invalid credentials.' };

  const token = await createSession(user.id);
  setSessionCookie(token);

  redirect('/dashboard');
}
