import { NextRequest } from 'next/server';
import { createCanvas, loadImage } from 'canvas';

export const runtime = 'nodejs'; // cần cho canvas + serverless

type Position =
  | 'center'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const file = formData.get('image') as File;
    const text = (formData.get('text') as string) || '© Watermark';
    const position = (formData.get('position') as string) as Position || 'center';
    const color = (formData.get('color') as string) || '#f35151';
    const opacity = parseFloat((formData.get('opacity') as string) || '0.5');
    const size = parseInt((formData.get('size') as string) || '48', 10);

    if (!(file instanceof File)) {
      return new Response(JSON.stringify({ error: 'No image uploaded' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Convert File → Buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    const img = await loadImage(buffer);

    // Tạo canvas cùng kích thước ảnh
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');

    // Vẽ ảnh gốc
    ctx.drawImage(img, 0, 0);

    // Set font
    ctx.font = `${size}px Arial`; // Arial / DejaVu Sans / Liberation Sans đều OK trên Linux
    ctx.fillStyle = color;
    ctx.globalAlpha = opacity;

    // Tính vị trí watermark
    let x = img.width / 2;
    let y = img.height / 2;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const padding = 20;

    switch (position) {
      case 'top-left':
        x = padding;
        y = padding + size / 2;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        break;
      case 'top-right':
        x = img.width - padding;
        y = padding + size / 2;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'top';
        break;
      case 'bottom-left':
        x = padding;
        y = img.height - padding;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        break;
      case 'bottom-right':
        x = img.width - padding;
        y = img.height - padding;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        break;
      case 'center':
      default:
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        break;
    }

    // Vẽ watermark
    ctx.fillText(text, x, y);

    // Xuất buffer PNG
    const outBuffer = canvas.toBuffer('image/png');

    return new Response(new Uint8Array(outBuffer), {
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
