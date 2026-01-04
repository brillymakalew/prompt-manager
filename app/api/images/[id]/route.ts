import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function getUploadsDir() {
  return process.env.UPLOADS_DIR || path.join(process.cwd(), 'uploads');
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const user = await requireUser();
  const image = await prisma.imageAsset.findFirst({
    where: {
      id: params.id,
      prompt: { userId: user.id }
    },
    include: { prompt: true }
  });

  if (!image) {
    return new NextResponse('Not found', { status: 404 });
  }

  const filePath = path.join(getUploadsDir(), image.storagePath);
  try {
    const data = await fs.readFile(filePath);
    return new NextResponse(data, {
      headers: {
        'Content-Type': image.mimeType,
        'Content-Length': String(image.sizeBytes),
        'Cache-Control': 'private, max-age=0'
      }
    });
  } catch {
    return new NextResponse('File missing', { status: 404 });
  }
}
