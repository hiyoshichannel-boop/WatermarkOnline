import { createCanvas, loadImage, registerFont } from 'canvas';
import path from 'path';
import { fileURLToPath } from 'url';

export const runtime = 'nodejs';

// Fix __dirname trong ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load font Unicode
registerFont(path.join(__dirname, '../../../public/fonts/NotoSans-Regular.ttf'), {
  family: 'NotoSans',
});

type Position = 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const imageFile = formData.get('image');
    const text = (formData.get('text') as string) || '© Watermark';
    const position = (formData.get('position') as string) as Position || 'center';
    const color = (formData.get('color') as string) || '#f35151';
    const opacity = parseFloat((formData.get('opacity') as string) || '0.5');
    const size = parseInt((formData.get('size') as string) || '48', 10);

    if (!imageFile || !(imageFile instanceof Blob)) {
      return new Response(JSON.stringify({ error: 'No image uploaded' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Convert Blob sang Buffer
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Load ảnh
    const img = await loadImage(buffer);

    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');

    // Vẽ ảnh gốc
    ctx.drawImage(img, 0, 0);

    // Cài đặt font + opacity
    ctx.font = `${size}px NotoSans`;
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

// Bắt GET trả 405
export async function GET() {
  return new Response(JSON.stringify({ error: 'Method GET not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' },
  });
}
