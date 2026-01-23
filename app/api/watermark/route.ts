import { NextResponse } from "next/server";
import sharp from "sharp";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

function escapeXml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File;
    const text = (formData.get("text") as string) || "© Bản quyền";

    if (!file) {
      return NextResponse.json({ error: "No image" }, { status: 400 });
    }

    const imageBuffer = Buffer.from(await file.arrayBuffer());
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();

    const width = metadata.width || 800;
    const height = metadata.height || 600;
    const fontSize = Math.floor(width / 15);

    const fontPath = path.join(
      process.cwd(),
      "public/fonts/NotoSans-Regular.ttf"
    );
    const fontBase64 = fs.readFileSync(fontPath).toString("base64");

    const safeText = escapeXml(text);

    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <defs>
    <style>
      @font-face {
        font-family: 'NotoSans';
        src: url(data:font/ttf;base64,${fontBase64}) format('truetype');
      }
    </style>
  </defs>

  <text
    x="50%"
    y="50%"
    text-anchor="middle"
    dominant-baseline="middle"
    font-family="NotoSans"
    font-size="${fontSize}"
    fill="rgba(255,255,255,0.45)"
    xml:space="preserve"
  >
    <tspan>${safeText}</tspan>
  </text>
</svg>
`;

    const output = await image
      .composite([{ input: Buffer.from(svg), gravity: "center" }])
      .png()
      .toBuffer();

    return new NextResponse(new Uint8Array(output), {
      headers: { "Content-Type": "image/png" },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
