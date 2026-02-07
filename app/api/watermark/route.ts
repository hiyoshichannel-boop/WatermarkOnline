import { NextResponse } from "next/server";
import sharp from "sharp";
import path from "path";
import opentype from "opentype.js";
import JSZip from "jszip";

export const runtime = "nodejs";

// ===== utils =====
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

    /* ===== MỚI ===== */

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



async function watermarkOneImage(
  imageBuffer: Buffer,
  options: any,
  font: opentype.Font
) {
  const {
    text,
    iconBuffer,
    position,
    opacity,
    color,
    repeat,
    wmScale,
  } = options;

  /* =========================
   * STEP 1: FIX CỨNG SIZE ẢNH
   * ========================= */
  const normalizedBuffer = await sharp(imageBuffer, {
    failOnError: false,
    limitInputPixels: false,
  })
    .rotate()
    .toColorspace("srgb")
    .resize({
      width: 2000,
      withoutEnlargement: true,
    })
    .toBuffer();

  /* =========================
   * STEP 2: BASE + METADATA THẬT
   * ========================= */
  let base = sharp(normalizedBuffer);
  const meta = await base.metadata();

  const imgW = meta.width || 800;
  const imgH = meta.height || 600;

  const overlays: sharp.OverlayOptions[] = [];

  /* =========================
   * TEXT WATERMARK
   * ========================= */
 // ===== TEXT WATERMARK (FULL – SAFE – POSITION OK) =====
if (text && text.trim()) {
  const safeText = text.trim();

  // 1️⃣ Font size an toàn theo kích thước ảnh ĐÃ RESIZE
  const fontSize = clamp(
    Math.floor((imgW / 14) * wmScale),
    16,
    imgW * 0.2
  );

  const fill = hexToRgba(color, opacity);
  const baseline = fontSize * 1.3;

  // 2️⃣ Tạo path chữ
  const path = font.getPath(safeText, 0, baseline, fontSize);
  const pathData = path.toPathData(1);

  // Không có path hợp lệ thì bỏ watermark text
  if (pathData.length > 10) {

    // 3️⃣ SVG có viewBox (BẮT BUỘC)
    const rawSvg = `
<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 ${imgW} ${imgH}">
  <path d="${pathData}" fill="${fill}" />
</svg>
`;

    // 4️⃣ ÉP SVG về kích thước an toàn bằng sharp
   const svgBuffer = await sharp(Buffer.from(rawSvg), { density: 300 })
  .resize({
    width: Math.floor(imgW * 0.35),
    height: Math.floor(imgH * 0.25),
    fit: "inside",
    withoutEnlargement: true,
  })
  .png()
  .trim() // 🔥 CẮT HẾT VÙNG TRANSPARENT
  .toBuffer();


    // 5️⃣ Lấy kích thước THẬT của watermark
    const wmMeta = await sharp(svgBuffer).metadata();
    const wmW = wmMeta.width || 100;
    const wmH = wmMeta.height || 50;

    // 6️⃣ TÍNH VỊ TRÍ ĐÚNG (CENTER / 4 GÓC)
    let left = 0;
    let top = 0;

    if (position === "center") {
      left = Math.round(imgW / 2 - wmW / 2);
      top = Math.round(imgH / 2 - wmH / 2);
    } else {
      const pos = getPosition(position, imgW, imgH, wmW, wmH);
      left = Math.round(pos.x);
      top = Math.round(pos.y);
    }

    // 7️⃣ CHẶN CUỐI – KHÔNG CHO VƯỢT BIÊN (AN TOÀN TUYỆT ĐỐI)
    if (
      wmW <= imgW &&
      wmH <= imgH &&
      left >= 0 &&
      top >= 0
    ) {
      overlays.push({
        input: svgBuffer,
        left,
        top,
      });
    }
  }
}


  /* =========================
   * ICON WATERMARK (CLAMP)
   * ========================= */
  if (iconBuffer) {
    const icon = await sharp(iconBuffer)
      .resize({
        width: Math.floor(imgW * 0.2),
        fit: "inside",
        withoutEnlargement: true,
      })
      .png()
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

  /* =========================
   * OUTPUT
   * ========================= */
  return await base
    .composite(overlays)
    .webp({ quality: 85 })
    .toBuffer();
}


export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const files = form.getAll("images") as File[];

    // 🔒 hard limit backend
    if (files.length === 0 || files.length > 2) {
      return NextResponse.json(
        { error: "Chỉ cho phép tối đa 2 ảnh mỗi lần" },
        { status: 400 }
      );
    }

    const text = (form.get("text") as string) || "";
    const position = (form.get("position") as string) || "center";
    const opacity = Number(form.get("opacity") || 0.4);
    const color = (form.get("color") as string) || "#ffffff";
    const repeat = form.get("repeat") === "true";
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

    const zip = new JSZip();

    for (let i = 0; i < files.length; i++) {
      const buf = Buffer.from(await files[i].arrayBuffer());

      const out = await watermarkOneImage(
        buf,
        {
          text,
          iconBuffer,
          position,
          opacity,
          color,
          repeat,
          wmScale,
        },
        font
      );

      zip.file(`watermark_${i + 1}.webp`, out);
    }

    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

    return new NextResponse(new Uint8Array(zipBuffer), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition":
          "attachment; filename=watermarked-images.zip",
      },
    });
  } catch (err: any) {
  console.error("===== WATERMARK ERROR =====");
  console.error(err);
  console.error(err?.stack);
  return NextResponse.json(
    { error: err?.message || "Server error" },
    { status: 500 }
  );
}

}
