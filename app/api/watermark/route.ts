import { NextRequest } from 'next/server';
import sharp from 'sharp';

export const runtime = 'nodejs'; // 👈 Bắt buộc để chạy được sharp trên Vercel

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
      return new Response(JSON.stringify({ error: 'No image uploaded' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
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

    const fontBase64 = 'AAAABBBBCCCC...'; // base64 font
let dy = '.35em';
const svg = `
<svg width="${width}" height="${height}">
  <defs>
    <style>
      @font-face {
        font-family: 'RobotoEmbed';
        src: url(data:font/ttf;base64,${fontBase64}) format('truetype');
      }
      .wm {
        font-family: 'RobotoEmbed';
        font-size: ${size}px;
        fill: ${color};
        fill-opacity: ${opacity};
      }
    </style>
  </defs>

  <text
    x="${x}"
    y="${y}"
    dy="${dy}"
    text-anchor="${anchor}"
    dominant-baseline="${baseline}"
    class="wm"
  >${text}</text>
</svg>
`;

    const output = await input
      .composite([{ input: Buffer.from(svg) }])
      .png()
      .toBuffer();

    return new Response(new Uint8Array(output), {
  headers: { 'Content-Type': 'image/png' },
});

  } catch (err: any) {
    console.error('Watermark error:', err);
    return new Response(JSON.stringify({ error: 'Failed to process image' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}