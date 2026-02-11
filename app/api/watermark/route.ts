import { NextResponse } from "next/server";
import sharp from "sharp";
import path from "path";
import opentype from "opentype.js";

export const runtime = "nodejs";

/* =========================
 * UTILS
 * ========================= */
function hexToRgba(hex: string, opacity: number) {
  const h = hex.replace("#", "");
  const bigint = parseInt(h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r},${g},${b},${opacity})`;
}

function clamp(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), max);
}

function getPosition(
  pos: string,
  imgW: number,
  imgH: number,
  markW: number,
  markH: number
) {
  const padX = 20;
  const padTop = 20;
  const padBottom = 5;

  switch (pos) {
    case "top-left":
      return { x: padX, y: padTop };

    case "top-right":
      return { x: imgW - markW - padX, y: padTop };

    case "bottom-left":
      return { x: padX, y: imgH - markH - padBottom };

    case "bottom-right":
      return { x: imgW - markW - padX, y: imgH - markH - padBottom };

    case "top-center":
      return {
        x: imgW / 2 - markW / 2,
        y: padTop,
      };

    case "bottom-center":
      return {
        x: imgW / 2 - markW / 2,
        y: imgH - markH - padBottom,
      };

    default: // center
      return {
        x: imgW / 2 - markW / 2,
        y: imgH / 2 - markH / 2,
      };
  }
}

/* =========================
 * CORE: WATERMARK 1 IMAGE
 * ========================= */
async function watermarkOneImage(
  imageBuffer: Buffer,
  options: any,
  font: opentype.Font
) {
  const { text, iconBuffer, position, opacity, color, wmScale } = options;

  // 1️⃣ Normalize image (orientation + size)
  const normalizedBuffer = await sharp(imageBuffer, {
    failOnError: false,
    limitInputPixels: false,
  })
    .rotate()
    .toColorspace("srgb")
    //.resize({ width: 2000, withoutEnlargement: true })
    .resize({
    width: 1600,
    height: 1600,
    fit: "inside", // 👈 quan trọng
    withoutEnlargement: true,
  })
    .jpeg({ quality: 85 })
    .toBuffer();

  const base = sharp(normalizedBuffer);
  const meta = await base.metadata();

  const imgW = meta.width || 800;
  const imgH = meta.height || 600;

  const overlays: sharp.OverlayOptions[] = [];

  /* =========================
   * TEXT WATERMARK
   * ========================= */
  if (text && text.trim()) {
    const safeText = text.trim();

    const fontSize = clamp(
      Math.floor((imgW / 14) * wmScale),
      16,
      imgW * 0.2
    );

    const fill = hexToRgba(color, opacity);
    const baseline = fontSize * 1.3;

    const pathObj = font.getPath(safeText, 0, baseline, fontSize);
    const pathData = pathObj.toPathData(1);

    if (pathData.length > 10) {
      const rawSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${imgW} ${imgH}">
  <path d="${pathData}" fill="${fill}" />
</svg>`;

      const svgBuffer = await sharp(Buffer.from(rawSvg), { density: 300 })
        .resize({
          width: Math.floor(imgW * 0.35),
          height: Math.floor(imgH * 0.25),
          fit: "inside",
          withoutEnlargement: true,
        })
        .png()
        .trim()
        .toBuffer();

      const wmMeta = await sharp(svgBuffer).metadata();
      const wmW = wmMeta.width || 100;
      const wmH = wmMeta.height || 50;

      const pos = getPosition(position, imgW, imgH, wmW, wmH);

      if (wmW <= imgW && wmH <= imgH) {
        overlays.push({
          input: svgBuffer,
          left: Math.round(pos.x),
          top: Math.round(pos.y),
        });
      }
    }
  }

  /* =========================
   * ICON WATERMARK
   * ========================= */
  if (iconBuffer) {
    const icon = await sharp(iconBuffer)
      .resize({
        width: Math.floor(imgW * 0.2),
        fit: "inside",
        withoutEnlargement: true,
      })
      .png()
      .trim()
      .toBuffer();

    const iconMeta = await sharp(icon).metadata();
    const iconW = iconMeta.width || 50;
    const iconH = iconMeta.height || 50;

    const pos = getPosition(position, imgW, imgH, iconW, iconH);

    overlays.push({
      input: icon,
      left: Math.round(pos.x),
      top: Math.round(pos.y),
    });
  }

  return await base.composite(overlays).webp({ quality: 85 }).toBuffer();
}

/* =========================
 * POST HANDLER
 * ========================= */
export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const files = form.getAll("images") as File[];

    if (files.length === 0 || files.length > 2) {
      return NextResponse.json(
        { error: "Chỉ cho phép tối đa 2 ảnh" },
        { status: 400 }
      );
    }

    const text = (form.get("text") as string) || "";
    const position = (form.get("position") as string) || "center";
    const opacity = Number(form.get("opacity") || 0.4);
    const color = (form.get("color") as string) || "#ffffff";
    const wmScale = Number(form.get("wmScale") || 1);

    const iconFile = form.get("icon") as File | null;
    const iconBuffer = iconFile
      ? Buffer.from(await iconFile.arrayBuffer())
      : null;

    const fontPath = path.join(
      process.cwd(),
      "public/fonts/NotoSans-Regular.ttf"
    );
    const font = await opentype.load(fontPath);

    // =========================
    // CASE 1: 1 ẢNH → TRẢ TRỰC TIẾP
    // =========================
    if (files.length === 1) {
      const buf = Buffer.from(await files[0].arrayBuffer());

      const out = await watermarkOneImage(
        buf,
        { text, iconBuffer, position, opacity, color, wmScale },
        font
      );

      return new NextResponse(new Uint8Array(out), {
  headers: {
    "Content-Type": "image/webp",
    "Content-Disposition": 'attachment; filename="watermarked.webp"',
  },
});

    }

    // =========================
    // CASE 2: 2 ẢNH → JSON BASE64
    // =========================
    const results: { name: string; data: string }[] = [];

    for (let i = 0; i < files.length; i++) {
      const buf = Buffer.from(await files[i].arrayBuffer());

      const out = await watermarkOneImage(
        buf,
        { text, iconBuffer, position, opacity, color, wmScale },
        font
      );

      results.push({
        name: `watermark_${i + 1}.webp`,
        data: out.toString("base64"),
      });
    }

    return NextResponse.json(results);
  } catch (err: any) {
  console.error("===== WATERMARK ERROR =====");
  console.error(err);

  const message = typeof err?.message === "string"
    ? err.message
    : "Server error";

  // ⚠️ Các lỗi KHÔNG CẦN bắn 500 (đã xử lý xong)
  if (
    message.includes("body stream already read") ||
    message.includes("ReadableStream") ||
    message.includes("already read")
  ) {
    return NextResponse.json(
      { ok: true },
      { status: 200 }
    );
  }

  // ❌ Lỗi thật sự
  return NextResponse.json(
    { error: message },
    { status: 500 }
  );
}

}
