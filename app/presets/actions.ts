'use server';

import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

function parseJson(text: string): any {
  const trimmed = text.trim();
  if (!trimmed) return null;
  return JSON.parse(trimmed);
}

export async function createPresetAction(_: any, formData: FormData) {
  const user = await requireUser();
  const templateId = String(formData.get('templateId') ?? '').trim();
  const name = String(formData.get('name') ?? '').trim();
  const presetText = String(formData.get('presetJson') ?? '');
  const lockText = String(formData.get('lockJson') ?? '');

  if (!templateId) return { error: 'Template is required.' };
  if (!name) return { error: 'Name is required.' };

  let presetJson: any;
  let lockJson: any = null;
  try {
    presetJson = parseJson(presetText);
    if (!presetJson) return { error: 'presetJson is required (must be valid JSON).' };
  } catch {
    return { error: 'presetJson must be valid JSON.' };
  }

  try {
    lockJson = lockText.trim() ? parseJson(lockText) : null;
  } catch {
    return { error: 'lockJson must be valid JSON (or empty).' };
  }

  // Ensure template belongs to user
  const template = await prisma.template.findFirst({ where: { id: templateId, userId: user.id } });
  if (!template) return { error: 'Template not found.' };

  const preset = await prisma.preset.create({
    data: { userId: user.id, templateId, name, presetJson, lockJson }
  });

  redirect(`/presets/${preset.id}`);
}

export async function deletePresetAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get('id') ?? '');
  if (!id) return;
  await prisma.preset.deleteMany({ where: { id, userId: user.id } });
  redirect('/presets');
}

export async function updatePresetAction(_: any, formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get('id') ?? '');
  const name = String(formData.get('name') ?? '').trim();
  const presetText = String(formData.get('presetJson') ?? '');
  const lockText = String(formData.get('lockJson') ?? '');

  if (!id) return { error: 'Missing id.' };
  if (!name) return { error: 'Name is required.' };

  let presetJson: any;
  let lockJson: any = null;
  try {
    presetJson = parseJson(presetText);
    if (!presetJson) return { error: 'presetJson is required (must be valid JSON).' };
  } catch {
    return { error: 'presetJson must be valid JSON.' };
  }

  try {
    lockJson = lockText.trim() ? parseJson(lockText) : null;
  } catch {
    return { error: 'lockJson must be valid JSON (or empty).' };
  }

  await prisma.preset.updateMany({ where: { id, userId: user.id }, data: { name, presetJson, lockJson } });
  redirect(`/presets/${id}`);
}
