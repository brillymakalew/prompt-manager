'use server';

import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatPromptBlock } from '@/lib/promptGenerator';
import { redirect } from 'next/navigation';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs/promises';

function parseJson(text: string): any {
  return JSON.parse(text);
}

function safeTags(text: string): string[] {
  return text
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function createPromptFromPresetAction(_: any, formData: FormData) {
  const user = await requireUser();
  const presetId = String(formData.get('presetId') ?? '').trim();
  const title = String(formData.get('title') ?? '').trim();
  const tagsText = String(formData.get('tags') ?? '');
  const tags = safeTags(tagsText);

  if (!presetId) return { error: 'Preset is required.' };
  if (!title) return { error: 'Title is required.' };

  const preset = await prisma.preset.findFirst({ where: { id: presetId, userId: user.id } });
  if (!preset) return { error: 'Preset not found.' };

  const promptJson = preset.presetJson;
  const generatedText = formatPromptBlock(promptJson);

  const created = await prisma.prompt.create({
    data: {
      userId: user.id,
      title,
      tags,
      versions: {
        create: {
          versionNo: 1,
          promptJson,
          generatedText
        }
      }
    },
    include: { versions: { orderBy: { versionNo: 'desc' }, take: 1 } }
  });

  const v = created.versions[0];
  await prisma.prompt.update({ where: { id: created.id }, data: { currentVersionId: v.id } });

  redirect(`/prompts/${created.id}`);
}

export async function createBlankPromptAction(_: any, formData: FormData) {
  const user = await requireUser();
  const title = String(formData.get('title') ?? '').trim();
  const tagsText = String(formData.get('tags') ?? '');
  const tags = safeTags(tagsText);
  const jsonText = String(formData.get('promptJson') ?? '').trim();

  if (!title) return { error: 'Title is required.' };
  if (!jsonText) return { error: 'promptJson is required.' };

  let promptJson: any;
  try {
    promptJson = parseJson(jsonText);
  } catch {
    return { error: 'promptJson must be valid JSON.' };
  }

  const generatedText = formatPromptBlock(promptJson);

  const created = await prisma.prompt.create({
    data: {
      userId: user.id,
      title,
      tags,
      versions: {
        create: {
          versionNo: 1,
          promptJson,
          generatedText
        }
      }
    },
    include: { versions: { orderBy: { versionNo: 'desc' }, take: 1 } }
  });

  const v = created.versions[0];
  await prisma.prompt.update({ where: { id: created.id }, data: { currentVersionId: v.id } });

  redirect(`/prompts/${created.id}`);
}

export async function deletePromptAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get('id') ?? '').trim();
  if (!id) return;

  await prisma.prompt.deleteMany({ where: { id, userId: user.id } });
  redirect('/prompts');
}

export async function updatePromptMetaAction(_: any, formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get('id') ?? '').trim();
  const title = String(formData.get('title') ?? '').trim();
  const tagsText = String(formData.get('tags') ?? '');
  const tags = safeTags(tagsText);

  if (!id) return { error: 'Missing id.' };
  if (!title) return { error: 'Title is required.' };

  await prisma.prompt.updateMany({ where: { id, userId: user.id }, data: { title, tags } });
  redirect(`/prompts/${id}`);
}

export async function saveNewVersionAction(_: any, formData: FormData) {
  const user = await requireUser();
  const promptId = String(formData.get('promptId') ?? '').trim();
  const jsonText = String(formData.get('promptJson') ?? '').trim();

  if (!promptId) return { error: 'Missing promptId.' };
  if (!jsonText) return { error: 'promptJson is required.' };

  let promptJson: any;
  try {
    promptJson = parseJson(jsonText);
  } catch {
    return { error: 'promptJson must be valid JSON.' };
  }

  const prompt = await prisma.prompt.findFirst({ where: { id: promptId, userId: user.id }, include: { versions: true } });
  if (!prompt) return { error: 'Prompt not found.' };

  const nextVersion = (prompt.versions.reduce((m, v) => Math.max(m, v.versionNo), 0) || 0) + 1;
  const generatedText = formatPromptBlock(promptJson);

  const v = await prisma.promptVersion.create({
    data: {
      promptId,
      versionNo: nextVersion,
      promptJson,
      generatedText
    }
  });

  await prisma.prompt.update({ where: { id: promptId }, data: { currentVersionId: v.id } });

  redirect(`/prompts/${promptId}`);
}

function getUploadsDir() {
  return process.env.UPLOADS_DIR || path.join(process.cwd(), 'uploads');
}

export async function uploadImageAction(_: any, formData: FormData) {
  const user = await requireUser();
  const promptId = String(formData.get('promptId') ?? '').trim();
  const versionId = String(formData.get('versionId') ?? '').trim() || null;
  const model = String(formData.get('model') ?? '').trim() || null;
  const seed = String(formData.get('seed') ?? '').trim() || null;
  const notes = String(formData.get('notes') ?? '').trim() || null;
  const ratingRaw = String(formData.get('rating') ?? '').trim();
  const rating = ratingRaw ? Number(ratingRaw) : null;

  const file = formData.get('file');
  if (!(file instanceof File)) return { error: 'File is required.' };
  if (!promptId) return { error: 'Missing promptId.' };

  const prompt = await prisma.prompt.findFirst({ where: { id: promptId, userId: user.id } });
  if (!prompt) return { error: 'Prompt not found.' };

  const bytes = Buffer.from(await file.arrayBuffer());
  const ext = (file.name.split('.').pop() || 'bin').toLowerCase();
  const id = crypto.randomBytes(16).toString('hex');
  const filename = `${id}.${ext}`;
  const uploadDir = getUploadsDir();
  await fs.mkdir(uploadDir, { recursive: true });
  const filePath = path.join(uploadDir, filename);
  await fs.writeFile(filePath, bytes);

  await prisma.imageAsset.create({
    data: {
      promptId,
      promptVersionId: versionId,
      storagePath: filename,
      originalName: file.name,
      mimeType: file.type || 'application/octet-stream',
      sizeBytes: bytes.length,
      model,
      seed,
      rating: Number.isFinite(rating as number) ? (rating as number) : null,
      notes
    }
  });

  redirect(`/prompts/${promptId}`);
}
