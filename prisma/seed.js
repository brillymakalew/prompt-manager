import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const nadyaPreset = {
  character: {
    name: "Nadya",
    age_appearance: "22-24",
    gender: "female",
    ethnicity: "Chinese-Indonesian (Chindo) + Javanese (mixed heritage)",
    era: "contemporary, present day",
    vibe: "real person, approachable, warm, understated, Instagram lifestyle"
  },
  face: {
    shape: "soft oval face with a gentle V-line jaw (not sharp)",
    jaw: "slightly narrow, smooth jawline, natural proportions",
    eyes: "dark brown, almond-shaped, slightly upturned outer corners, medium size, lively and expressive",
    eyebrows: "natural medium thickness, soft arch, tidy but not overly shaped",
    nose: "straight bridge, medium width, subtle defined tip (not too sharp)",
    lips: "medium fullness, soft cupid's bow, natural rosy tone",
    distinct_features: [
      "subtle beauty mark on left cheek (small and natural)",
      "soft youthful cheeks (not overly slim)"
    ],
    expression: [
      "neutral",
      "soft smile",
      "bright happy smile",
      "playful grin",
      "calm focus",
      "gentle concern"
    ]
  },
  skin: {
    tone: "light-medium warm (kuning langsat) with golden-olive undertones",
    texture: "realistic skin texture, visible pores, slight natural imperfections, not retouched",
    avoid: [
      "plastic skin",
      "porcelain smooth skin",
      "hyper-retouched look",
      "overly pale whitening",
      "overly glossy/oily face"
    ]
  },
  hair: {
    color: "dark brown to near-black",
    texture: "straight with very slight natural wave",
    length: "mid-back (can vary to shoulder-length for casual looks)",
    style: [
      "loose with soft layers",
      "low ponytail",
      "half-up",
      "simple bun"
    ],
    bangs: "soft curtain bangs, slightly off-center part",
    part: "center or slightly off-center"
  },
  body: {
    type: "slim, healthy, lightly athletic",
    posture: "relaxed, natural stance",
    movement: "calm, casual, not model-like"
  },
  makeup: {
    style: "natural everyday makeup (clean girl, Asian street-style friendly)",
    coverage: "light to medium",
    base: "soft satin finish, natural complexion, subtle blush",
    eyes: "soft brown eyeliner, minimal mascara, no heavy eyeshadow",
    lips: "soft rose nude / natural pink tint",
    avoid: [
      "heavy contour",
      "bold eyeshadow",
      "glam makeup",
      "overlined lips",
      "extreme highlights"
    ]
  },
  clothing: {
    style: "modern urban minimalist with subtle Asian streetwear influences",
    silhouette: [
      "simple fitted top with relaxed bottoms",
      "oversized outerwear balanced with clean lines",
      "straight-leg pants"
    ],
    colors: [
      "cream",
      "white",
      "beige",
      "warm grey",
      "black (accent only)",
      "muted olive",
      "soft brown",
      "dusty rose (accent)"
    ],
    avoid: [
      "neon colors",
      "loud patterns",
      "large logos",
      "runway fashion",
      "luxury editorial styling"
    ]
  },
  accessories: [
    "small gold hoop earrings",
    "thin gold necklace",
    "simple watch",
    "small shoulder bag or tote"
  ],
  environment: {
    location: [
      "Jakarta cafe (warm wood interior)",
      "urban sidewalk (Southeast Asia city vibe)",
      "modern apartment interior (soft neutral decor)",
      "neutral city street background"
    ],
    lighting: [
      "natural daylight, soft diffused",
      "soft indoor lighting, warm tone"
    ]
  },
  camera: {
    angle: "eye-level",
    framing: [
      "close-up portrait",
      "headshot",
      "waist-up (optional)"
    ],
    lens: "85mm portrait look, shallow depth of field",
    style: "candid lifestyle photography, realistic smartphone/DSLR aesthetic"
  },
  global_negative_prompt: [
    "anime",
    "illustration",
    "cartoon",
    "doll-like",
    "plastic face",
    "airbrushed skin",
    "hyper-retouched",
    "uncanny valley",
    "overly perfect symmetry",
    "exaggerated beauty",
    "fantasy",
    "sci-fi",
    "cyberpunk",
    "dystopian",
    "cinematic apocalypse",
    "dramatic lighting",
    "hard shadows",
    "model posing",
    "runway",
    "glamour",
    "heavy makeup",
    "luxury editorial",
    "extra fingers",
    "distorted face",
    "deformed eyes",
    "bad anatomy"
  ]
};

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@local';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin12345';

  const existingUsers = await prisma.user.count();
  let admin;

  if (existingUsers === 0) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    admin = await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'Admin',
        passwordHash,
        role: 'ADMIN'
      }
    });
    console.log(`Created admin user: ${adminEmail}`);
  } else {
    admin = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (!admin) {
      console.log(`Users exist already; admin email ${adminEmail} not found. Skipping admin creation.`);
      admin = await prisma.user.findFirst();
    }
  }

  if (!admin) throw new Error('No user available to own seed data');

  const templateCount = await prisma.template.count({ where: { userId: admin.id } });
  if (templateCount === 0) {
    const template = await prisma.template.create({
      data: {
        userId: admin.id,
        name: 'Virtual Influencer Prompt (Example)',
        description: 'Example template for lifestyle virtual influencer prompt specs. You can replace schemaJson later with a real JSON Schema.',
        exampleJson: nadyaPreset,
        schemaJson: null
      }
    });

    await prisma.preset.create({
      data: {
        userId: admin.id,
        templateId: template.id,
        name: 'Nadya (Base Preset)',
        presetJson: nadyaPreset,
        lockJson: {
          character: ['ethnicity', 'gender'],
          skin: ['tone']
        }
      }
    });

    console.log('Seeded example template + preset.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
