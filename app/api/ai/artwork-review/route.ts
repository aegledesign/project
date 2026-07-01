import { NextResponse } from 'next/server';
import { z } from 'zod';

export const runtime = 'nodejs';

const requestSchema = z.object({
  imageDataUrl: z.string().startsWith('data:image/').max(8_000_000),
  productName: z.string().min(1).max(120),
  productCategory: z.string().min(1).max(80),
  productColor: z.string().min(1).max(80),
  mockupView: z.string().min(1).max(40),
  printAreaLabel: z.string().min(1).max(80),
  outsidePrintArea: z.boolean(),
  selectedLayerType: z.enum(['image', 'text', 'other']),
});

const windows = new Map<string, { startedAt: number; count: number }>();
const windowMs = 60_000;
const limit = 10;

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

function outputText(response: {
  output?: Array<{ type?: string; content?: Array<{ type?: string; text?: string }> }>;
}) {
  return response.output
    ?.flatMap((item) => item.content ?? [])
    .find((item) => item.type === 'output_text')
    ?.text;
}

export async function POST(request: Request) {
  if (rateLimited(request)) {
    return NextResponse.json({ error: 'AI review limit reached. Try again in one minute.' }, { status: 429 });
  }
  const parsed = requestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid artwork review request' }, { status: 400 });
  }
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'AI review is not configured. Add OPENAI_API_KEY to the server environment.' },
      { status: 503 },
    );
  }

  const context = parsed.data;
  const prompt = [
    'Act as a senior print-production artwork reviewer.',
    'Review the supplied product design preview for legibility, contrast, composition, edge safety, likely print quality, and decoration practicality.',
    'Do not claim exact DPI because physical output dimensions are unavailable.',
    'Give short, actionable recommendations suitable for a customer using an online design studio.',
    `Product: ${context.productName}`,
    `Category: ${context.productCategory}`,
    `Color: ${context.productColor}`,
    `View: ${context.mockupView}`,
    `Print location: ${context.printAreaLabel}`,
    `Selected layer: ${context.selectedLayerType}`,
    `Local boundary check reports outside area: ${context.outsidePrintArea}`,
  ].join('\n');

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-5.4-mini',
        store: false,
        input: [{
          role: 'user',
          content: [
            { type: 'input_text', text: prompt },
            { type: 'input_image', image_url: context.imageDataUrl, detail: 'low' },
          ],
        }],
        text: {
          format: {
            type: 'json_schema',
            name: 'artwork_review',
            strict: true,
            schema: {
              type: 'object',
              additionalProperties: false,
              properties: {
                score: { type: 'integer', minimum: 0, maximum: 100 },
                summary: { type: 'string' },
                printRisks: { type: 'array', items: { type: 'string' }, maxItems: 5 },
                designSuggestions: { type: 'array', items: { type: 'string' }, maxItems: 5 },
                productionRecommendation: {
                  type: 'string',
                  enum: ['READY', 'REVIEW', 'REVISE'],
                },
              },
              required: ['score', 'summary', 'printRisks', 'designSuggestions', 'productionRecommendation'],
            },
          },
        },
        max_output_tokens: 700,
      }),
    });
    const body = await response.json();
    if (!response.ok) {
      return NextResponse.json(
        { error: body.error?.message ?? 'AI artwork review failed' },
        { status: response.status },
      );
    }
    const text = outputText(body);
    if (!text) return NextResponse.json({ error: 'AI review returned no result' }, { status: 502 });
    return NextResponse.json(JSON.parse(text));
  } catch {
    return NextResponse.json({ error: 'AI artwork review is temporarily unavailable' }, { status: 502 });
  }
}
