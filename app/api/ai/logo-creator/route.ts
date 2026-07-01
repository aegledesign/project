import { NextResponse } from 'next/server';
import { z } from 'zod';

export const runtime = 'nodejs';

const requestSchema = z.object({
  prompt: z.string().trim().min(8).max(800),
  brandName: z.string().trim().max(100).optional(),
  style: z.enum(['MINIMAL', 'BOLD', 'VINTAGE', 'PLAYFUL', 'SPORT', 'CORPORATE']),
  colors: z.array(z.string().regex(/^#[0-9a-fA-F]{6}$/)).min(1).max(4),
});

const windows = new Map<string, { startedAt: number; count: number }>();
const windowMs = 5 * 60_000;
const limit = 3;

function rateLimited(request: Request) {
  const key = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
  const now = Date.now();
  const current = windows.get(key);
  if (!current || now - current.startedAt > windowMs) {
    windows.set(key, { startedAt: now, count: 1 });
    return false;
  }
  current.count += 1;
  return current.count > limit;
}

export async function POST(request: Request) {
  if (rateLimited(request)) {
    return NextResponse.json(
      { error: 'Logo generation limit reached. Try again in five minutes.' },
      { status: 429 },
    );
  }
  const parsed = requestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Enter a valid logo description and color palette.' }, { status: 400 });
  }
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'AI logo creation is not configured. Add OPENAI_API_KEY to the server environment.' },
      { status: 503 },
    );
  }
  const { prompt, brandName, style, colors } = parsed.data;
  const generationPrompt = [
    'Draw an original, production-ready vector-style logo mark for custom apparel printing.',
    `Creative direction: ${prompt}`,
    brandName ? `Brand text to include exactly: ${brandName}` : 'Do not include any words or letters.',
    `Visual style: ${style.toLowerCase()}.`,
    `Use only this color palette: ${colors.join(', ')}.`,
    'Use bold clean shapes, crisp edges, strong silhouette, minimal tiny detail, and no gradients.',
    'Center the complete logo with generous transparent padding.',
    'Transparent background. No mockup, shirt, wall, paper, frame, watermark, or presentation scene.',
    'Do not copy or imitate an existing trademark, sports team, mascot, or brand identity.',
  ].join('\n');

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_IMAGE_ORCHESTRATOR_MODEL || 'gpt-5',
        store: false,
        input: generationPrompt,
        tools: [{
          type: 'image_generation',
          action: 'generate',
          background: 'transparent',
          quality: 'medium',
          size: '1024x1024',
          output_format: 'png',
        }],
        tool_choice: { type: 'image_generation' },
      }),
    });
    const body = await response.json();
    if (!response.ok) {
      return NextResponse.json(
        { error: body.error?.message ?? 'AI logo generation failed' },
        { status: response.status },
      );
    }
    const result = body.output?.find(
      (item: { type?: string; result?: string }) => item.type === 'image_generation_call',
    );
    if (!result?.result) {
      return NextResponse.json({ error: 'AI logo generation returned no image' }, { status: 502 });
    }
    return NextResponse.json({
      imageDataUrl: `data:image/png;base64,${result.result}`,
      revisedPrompt: result.revised_prompt ?? generationPrompt,
    });
  } catch {
    return NextResponse.json({ error: 'AI logo generation is temporarily unavailable' }, { status: 502 });
  }
}
