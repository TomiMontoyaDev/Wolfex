import { get } from "@vercel/blob";

/**
 * Sirve las imágenes de productos guardadas en el Blob store PRIVADO de Vercel.
 * Solo expone la carpeta products/ (nada más del store es accesible por aquí).
 * Cada archivo tiene un sufijo aleatorio, así que nunca cambia: el CDN lo guarda un año.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const pathname = path.join("/");
  if (!/^products\/[A-Za-z0-9._-]+$/.test(pathname)) return new Response("Not found", { status: 404 });

  try {
    const result = await get(pathname, { access: "private" });
    if (!result || result.statusCode !== 200) return new Response("Not found", { status: 404 });
    return new Response(result.stream, {
      headers: {
        "Content-Type": result.blob.contentType,
        "Content-Length": String(result.blob.size),
        "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("[images] no se pudo leer", pathname, error);
    return new Response("Not found", { status: 404 });
  }
}
