import { NextRequest } from 'next/server';
import { createCanvas, loadImage, registerFont } from 'canvas';

// Chạy Node.js runtime
export const runtime = 'nodejs';

// 🔹 Register font Unicode
registerFont('public/fonts/NotoSans-Regular.ttf', { family: 'NotoSans' });

type Position =
  | 'center'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

export async function POST(req: NextRequest) {
  try {
    // Lấy formData
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

    // File → Buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    const img = await loadImage(buffer);

    // Tạo canvas cùng kích thước ảnh
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');

    // Vẽ ảnh gốc
    ctx.drawImage(img, 0, 0);

    // Cài đặt font
    ctx.font = `${size}px NotoSans`; // Unicode / tiếng Việt
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

    // Fix TypeScript: Buffer → Uint8Array
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

// 🔹 Optional: trả về 405 nếu GET request
export async function GET() {
  return new Response(JSON.stringify({ error: 'Method GET not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' },
  });
}
