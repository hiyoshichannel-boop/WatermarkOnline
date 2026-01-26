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
  const pad = 20;
  switch (pos) {
    case "top-left":
      return { x: pad, y: pad };
    case "top-right":
      return { x: imgW - markW - pad, y: pad };
    case "bottom-left":
      return { x: pad, y: imgH - markH - pad };
    case "bottom-right":
      return { x: imgW - markW - pad, y: imgH - markH - pad };
    default:
      return {
        x: (imgW - markW) / 2,
        y: (imgH - markH) / 2,
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

  let base = sharp(imageBuffer);

  // ⚡ giới hạn size cho mobile
  const metaRaw = await base.metadata();
  if (metaRaw.width && metaRaw.width > 2000) {
    base = base.resize({ width: 2000, withoutEnlargement: true });
  }

  const meta = await base.metadata();
  const imgW = meta.width || 800;
  const imgH = meta.height || 600;

  const overlays: sharp.OverlayOptions[] = [];

  // ===== TEXT =====
  if (text) {
    const fontSize = clamp(
      Math.floor((imgW / 12) * wmScale),
      14,
      imgW / 2
    );

    const textWidth = font.getAdvanceWidth(text, fontSize);
    const textHeight = fontSize * 1.4;

    const pathData = font
      .getPath(text, 0, 0, fontSize)
      .toPathData(2);

    const fill = hexToRgba(color, opacity);

    const svg = `
<svg xmlns="http://www.w3.org/2000/svg"
  width="${textWidth}" height="${textHeight}"
  viewBox="0 ${-fontSize} ${textWidth} ${textHeight}">
  <path d="${pathData}" fill="${fill}" />
</svg>
`;

    if (repeat) {
      for (let y = 0; y < imgH; y += textHeight * 2) {
        for (let x = 0; x < imgW; x += textWidth + 40) {
          overlays.push({
            input: Buffer.from(svg),
            left: Math.round(x),
            top: Math.round(y),
          });
        }
      }
    } else {
      const pos = getPosition(
        position,
        imgW,
        imgH,
        textWidth,
        textHeight
      );
      overlays.push({
        input: Buffer.from(svg),
        left: Math.round(pos.x),
        top: Math.round(pos.y),
      });
    }
  }

  // ===== ICON =====
  if (iconBuffer) {
    const iconSize = clamp(
      Math.floor((imgW / 6) * wmScale),
      24,
      imgW / 2
    );

    const icon = await sharp(iconBuffer)
      .resize({ width: iconSize })
      .png()
      .composite([
        {
          input: Buffer.from(
            `<svg width="${iconSize}" height="${iconSize}">
              <rect width="100%" height="100%" fill="rgba(255,255,255,${opacity})"/>
            </svg>`
          ),
          blend: "dest-in",
        },
      ])
      .toBuffer();

    if (repeat) {
      for (let y = 0; y < imgH; y += iconSize * 1.8) {
        for (let x = 0; x < imgW; x += iconSize * 1.8) {
          overlays.push({
            input: icon,
            left: Math.round(x),
            top: Math.round(y),
          });
        }
      }
    } else {
      const pos = getPosition(
        position,
        imgW,
        imgH,
        iconSize,
        iconSize
      );
      overlays.push({
        input: icon,
        left: Math.round(pos.x),
        top: Math.round(pos.y),
      });
    }
  }

  return base.composite(overlays).webp({ quality: 85 }).toBuffer();
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const files = form.getAll("images") as File[];

    if (!files.length) {
      return NextResponse.json({ error: "No images" }, { status: 400 });
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

      const out = await watermarkOneImage(buf, {
        text,
        iconBuffer,
        position,
        opacity,
        color,
        repeat,
        wmScale,
      }, font);

      zip.file(`watermark_${i + 1}.webp`, out);
    }

    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

    return new NextResponse(new Uint8Array(zipBuffer), {

      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": "attachment; filename=watermarked-images.zip",
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
