import { NextResponse } from "next/server";
import sharp from "sharp";
import fs from "fs";
import path from "path";
import opentype from "opentype.js";

export const runtime = "nodejs";

// convert hex → rgba
function hexToRgba(hex: string, opacity: number) {
  const h = hex.replace("#", "");
  const bigint = parseInt(h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r},${g},${b},${opacity})`;
}

// tính vị trí watermark
function getPosition(
  pos: string,
  imgW: number,
  imgH: number,
  markW: number,
  markH: number
) {
  const padding = 20;
  switch (pos) {
    case "top-left":
      return { x: padding, y: padding + markH };
    case "top-right":
      return { x: imgW - markW - padding, y: padding + markH };
    case "bottom-left":
      return { x: padding, y: imgH - padding };
    case "bottom-right":
      return { x: imgW - markW - padding, y: imgH - padding };
    default:
      return { x: (imgW - markW) / 2, y: imgH / 2 };
  }
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();

    const file = form.get("image") as File;
    if (!file) {
      return NextResponse.json({ error: "No image" }, { status: 400 });
    }

    const text = (form.get("text") as string) || "© Bản quyền Huế";
    const position = (form.get("position") as string) || "center";
    const opacity = Number(form.get("opacity") || 0.4);
    const color = (form.get("color") as string) || "#ffffff";
    const rotate = Number(form.get("rotate") || 0);
    const scale = Number(form.get("scale") || 1);
    const repeat = form.get("repeat") === "true";

    // ===== đọc ảnh =====
    const imageBuffer = Buffer.from(await file.arrayBuffer());
    let image = sharp(imageBuffer);

    const meta = await image.metadata();
    const width = meta.width || 800;
    const height = meta.height || 600;

    // ===== load font =====
    const fontPath = path.join(
      process.cwd(),
      "public/fonts/NotoSans-Regular.ttf"
    );
    const fontBuffer = fs.readFileSync(fontPath);
    const font = opentype.parse(fontBuffer.buffer);

    const fontSize = Math.floor((width / 12) * scale);

    // 🔥 TÍNH ĐỘ DÀI CHỮ – FIX CẮT CHỮ
    const textWidth = font.getAdvanceWidth(text, fontSize);

    // tạo path tại (0,0)
    const textPath = font.getPath(text, 0, 0, fontSize);
    const pathData = textPath.toPathData(2);

    const fill = hexToRgba(color, opacity);

    // 🔥 SVG VIEWPORT ĐÚNG – KHÔNG BỊ CLIP
    const svgText = `
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="${textWidth}"
  height="${fontSize * 1.4}"
  viewBox="0 ${-fontSize} ${textWidth} ${fontSize * 1.4}"
>
  <path
    d="${pathData}"
    fill="${fill}"
    transform="rotate(${rotate})"
  />
</svg>
`;

    const overlays: sharp.OverlayOptions[] = [];

    if (repeat) {
      // ===== repeat watermark =====
      for (let y = 0; y < height; y += fontSize * 3) {
        for (let x = 0; x < width; x += textWidth + 40) {
          overlays.push({
            input: Buffer.from(svgText),
            left: x,
            top: y,
          });
        }
      }
    } else {
      // ===== single watermark =====
      const pos = getPosition(
        position,
        width,
        height,
        textWidth,
        fontSize
      );

      overlays.push({
        input: Buffer.from(svgText),
        left: Math.max(0, pos.x),
        top: Math.max(0, pos.y),
      });
    }

    const output = await image
      .composite(overlays)
      .png({ quality: 90 })
      .toBuffer();

    return new NextResponse(new Uint8Array(output), {
      headers: { "Content-Type": "image/png" },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
