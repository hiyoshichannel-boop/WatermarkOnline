import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('image');
    const text = (formData.get('text') as string) || '© Watermark';
    const position = (formData.get('position') as string) || 'center';
    const color = (formData.get('color') as string) || '#ffffff';
    const opacity = parseFloat((formData.get('opacity') as string) || '0.7');
    const size = parseInt((formData.get('size') as string) || '48', 10);

    if (!(file instanceof File)) {
      return Response.json({ error: 'No image uploaded' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const input = sharp(buffer);
    const meta = await input.metadata();
    const width = meta.width || 800;
    const height = meta.height || 600;

    // Tính vị trí watermark
    let x = width / 2;
    let y = height / 2;
    let anchor = 'middle';
    let baseline = 'middle';
    const padding = 20;

    switch (position) {
      case 'top-left':
        x = padding;
        y = padding + size;
        anchor = 'start';
        baseline = 'hanging';
        break;
      case 'top-right':
        x = width - padding;
        y = padding + size;
        anchor = 'end';
        baseline = 'hanging';
        break;
      case 'bottom-left':
        x = padding;
        y = height - padding;
        anchor = 'start';
        baseline = 'baseline';
        break;
      case 'bottom-right':
        x = width - padding;
        y = height - padding;
        anchor = 'end';
        baseline = 'baseline';
        break;
      default:
        anchor = 'middle';
        baseline = 'middle';
    }

    const svg = `
      <svg width="${width}" height="${height}">
        <style>
          .wm {
            font-family: sans-serif;
            font-size: ${size}px;
            fill: ${color};
            fill-opacity: ${opacity};
            stroke: black;
            stroke-width: ${Math.max(1, Math.floor(size/18))};
            stroke-opacity: ${opacity};
          }
        </style>
        <text x="${x}" y="${y}" text-anchor="${anchor}" dominant-baseline="${baseline}" class="wm">${text}</text>
      </svg>
    `;

    const output = await input
      .composite([{ input: Buffer.from(svg) }])
      .png()
      .toBuffer();

    return new Response(new Uint8Array(output), {
  headers: { 'Content-Type': 'image/png' },
});

  } catch (err) {
    console.error(err);
    return Response.json({ error: 'Failed to process image' }, { status: 500 });
  }
}