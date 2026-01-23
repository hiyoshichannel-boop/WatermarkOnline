import { NextResponse } from "next/server";
import sharp from "sharp";
import path from "path";
import opentype from "opentype.js";

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

export async function POST(req: Request) {
  try {
    const form = await req.formData();

    const imageFile = form.get("image") as File;
    if (!imageFile) {
      return NextResponse.json({ error: "No image" }, { status: 400 });
    }

    const text = (form.get("text") as string) || "";
    const iconFile = form.get("icon") as File | null;

    const position = (form.get("position") as string) || "center";
    const opacity = Number(form.get("opacity") || 0.4);
    const color = (form.get("color") as string) || "#ffffff";
    const repeat = form.get("repeat") === "true";

    // ===== load base image =====
    const baseBuffer = Buffer.from(await imageFile.arrayBuffer());
    const base = sharp(baseBuffer);
    const meta = await base.metadata();

    const imgW = meta.width || 800;
    const imgH = meta.height || 600;

    const overlays: sharp.OverlayOptions[] = [];

    // ================= TEXT WATERMARK =================
    if (text.trim()) {
      const fontPath = path.join(
        process.cwd(),
        "public/fonts/NotoSans-Regular.ttf"
      );
      const font = await opentype.load(fontPath);

      const fontSize = Math.floor(imgW / 12);
      const textWidth = font.getAdvanceWidth(text, fontSize);
      const textHeight = fontSize * 1.4;

      const textPath = font.getPath(text, 0, 0, fontSize);
      const pathData = textPath.toPathData(2);
      const fill = hexToRgba(color, opacity);

      const svgText = `
<svg xmlns="http://www.w3.org/2000/svg"
  width="${textWidth}"
  height="${textHeight}"
  viewBox="0 ${-fontSize} ${textWidth} ${textHeight}">
  <path d="${pathData}" fill="${fill}" />
</svg>
`;

      if (repeat) {
        for (let y = 0; y < imgH; y += textHeight * 2) {
          for (let x = 0; x < imgW; x += textWidth + 40) {
            overlays.push({
              input: Buffer.from(svgText),
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
          input: Buffer.from(svgText),
          left: Math.round(pos.x),
          top: Math.round(pos.y),
        });
      }
    }

    // ================= ICON WATERMARK =================
    if (iconFile) {
      const iconBuffer = Buffer.from(await iconFile.arrayBuffer());

      const iconSize = Math.floor(imgW / 6); // kích thước icon
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

    const output = await base
      .composite(overlays)
      .png({ quality: 90 })
      .toBuffer();

    return new NextResponse(new Uint8Array(output), {
      headers: { "Content-Type": "image/png" },
    });
  } catch (err) {
    console.error("WATERMARK API ERROR:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
