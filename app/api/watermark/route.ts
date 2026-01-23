import { NextResponse } from "next/server";
import sharp from "sharp";
import fs from "fs";
import path from "path";
import opentype from "opentype.js";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File;
    const text = (formData.get("text") as string) || "© Bản quyền Huế";

    if (!file) {
      return NextResponse.json({ error: "No image" }, { status: 400 });
    }

    const imageBuffer = Buffer.from(await file.arrayBuffer());
    const image = sharp(imageBuffer);
    const meta = await image.metadata();

    const width = meta.width || 800;
    const height = meta.height || 600;
    const fontSize = Math.floor(width / 15);

    // 👉 LOAD FONT
    const fontPath = path.join(
      process.cwd(),
      "public/fonts/NotoSans-Regular.ttf"
    );
    const fontBuffer = fs.readFileSync(fontPath);
    const font = opentype.parse(fontBuffer.buffer);

    // 👉 TEXT → PATH (QUAN TRỌNG NHẤT)
    const pathData = font
      .getPath(text, 0, 0, fontSize)
      .toPathData(2);

    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <g transform="translate(${width / 2}, ${height / 2})">
    <path
      d="${pathData}"
      fill="rgba(255,255,255,0.45)"
      transform="translate(${-width / 4}, ${fontSize / 2})"
    />
  </g>
</svg>
`;

    const output = await image
      .composite([{ input: Buffer.from(svg) }])
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
