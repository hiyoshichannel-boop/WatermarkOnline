import { NextResponse } from "next/server";
import sharp from "sharp";

export const runtime = "nodejs"; // BẮT BUỘC cho sharp

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const file = formData.get("image") as File;
    const text = (formData.get("text") as string) || "© Watermark";

    if (!file) {
      return NextResponse.json({ error: "No image" }, { status: 400 });
    }

    const imageBuffer = Buffer.from(await file.arrayBuffer());

    const image = sharp(imageBuffer);
    const metadata = await image.metadata();

    const width = metadata.width || 800;
    const height = metadata.height || 600;

    // SVG TEXT – KHÔNG CẦN FONT FILE
    const svg = `
      <svg width="${width}" height="${height}">
        <text
          x="50%"
          y="50%"
          dominant-baseline="middle"
          text-anchor="middle"
          fill="rgba(255,255,255,0.4)"
          font-size="${Math.floor(width / 15)}"
          font-family="sans-serif"
        >
          ${text}
        </text>
      </svg>
    `;

    const output = await image
      .composite([
        {
          input: Buffer.from(svg),
          gravity: "center",
        },
      ])
      .png()
      .toBuffer();

    return new NextResponse(output, {
      headers: {
        "Content-Type": "image/png",
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
