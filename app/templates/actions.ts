'use server';

import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

function parseJsonSafe(text: string): any | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return undefined;
  }
}

export async function createTemplateAction(_: any, formData: FormData) {
  const user = await requireUser();
  const name = String(formData.get('name') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim() || null;
  const schemaText = String(formData.get('schemaJson') ?? '');
  const exampleText = String(formData.get('exampleJson') ?? '');

  if (!name) return { error: 'Name is required.' };

  const schemaJson = parseJsonSafe(schemaText);
  if (schemaJson === undefined) return { error: 'schemaJson must be valid JSON (or empty).' };

  const exampleJson = parseJsonSafe(exampleText);
  if (exampleJson === undefined) return { error: 'exampleJson must be valid JSON (or empty).' };

  await prisma.template.create({
    data: { userId: user.id, name, description, schemaJson, exampleJson }
  });

  redirect('/templates');
}

export async function deleteTemplateAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get('id') ?? '');
  if (!id) return;

  await prisma.template.deleteMany({ where: { id, userId: user.id } });
  redirect('/templates');
}

export async function updateTemplateAction(_: any, formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get('id') ?? '');
  const name = String(formData.get('name') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim() || null;
  const schemaText = String(formData.get('schemaJson') ?? '');
  const exampleText = String(formData.get('exampleJson') ?? '');

  if (!id) return { error: 'Missing id.' };
  if (!name) return { error: 'Name is required.' };

  const schemaJson = parseJsonSafe(schemaText);
  if (schemaJson === undefined) return { error: 'schemaJson must be valid JSON (or empty).' };

  const exampleJson = parseJsonSafe(exampleText);
  if (exampleJson === undefined) return { error: 'exampleJson must be valid JSON (or empty).' };

  await prisma.template.updateMany({
    where: { id, userId: user.id },
    data: { name, description, schemaJson, exampleJson }
  });

  redirect(`/templates/${id}`);
}
