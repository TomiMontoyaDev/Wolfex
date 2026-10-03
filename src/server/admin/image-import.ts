import "server-only";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import sharp from "sharp";

const MAX_DOWNLOAD_BYTES = 15 * 1024 * 1024;
const MAX_REDIRECTS = 3;
const TARGET_SIDE = 1600;
/** Por debajo de esto la foto se verá borrosa en las tarjetas de la tienda (≈400 px a 2x). */
export const MIN_SHARP_SIDE = 800;

export class ImageImportError extends Error {}

/** Bloquea direcciones internas para que el importador no pueda usarse contra la red del servidor (SSRF). */
function isPrivateAddress(ip: string) {
  if (ip.startsWith("::ffff:")) ip = ip.slice(7);
  if (isIP(ip) === 4) {
    const [a, b] = ip.split(".").map(Number);
    return a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
  }
  const v6 = ip.toLowerCase();
  return v6 === "::" || v6 === "::1" || v6.startsWith("fc") || v6.startsWith("fd") || v6.startsWith("fe80");
}

async function assertPublicUrl(raw: string) {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new ImageImportError("El link no es válido.");
  }
  if (url.protocol !== "https:") throw new ImageImportError("El link debe empezar por https://");
  const addresses = await lookup(url.hostname, { all: true }).catch(() => []);
  if (!addresses.length) throw new ImageImportError("No se pudo encontrar ese sitio web.");
  if (addresses.some((entry) => isPrivateAddress(entry.address))) throw new ImageImportError("Ese link no está permitido.");
  return url;
}

async function download(raw: string) {
  let url = await assertPublicUrl(raw);
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const response = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(15_000),
      headers: { Accept: "image/avif,image/webp,image/png,image/jpeg,image/*;q=0.8", "User-Agent": "Mozilla/5.0 (compatible; WOLFEX-ImageImporter/1.0)" },
    }).catch((error: Error) => {
      throw new ImageImportError(error.name === "TimeoutError" ? "El sitio tardó demasiado en responder." : "No se pudo descargar la imagen.");
    });

    if (response.status >= 300 && response.status < 400 && response.headers.get("location")) {
      url = await assertPublicUrl(new URL(response.headers.get("location")!, url).toString());
      continue;
    }
    if (!response.ok || !response.body) throw new ImageImportError(`El sitio respondió ${response.status}: puede que no permita descargar la imagen.`);
    const type = response.headers.get("content-type") ?? "";
    if (!type.startsWith("image/")) throw new ImageImportError("Ese link no es una imagen. Abre la imagen, clic derecho → “Copiar dirección de la imagen”.");
    if (Number(response.headers.get("content-length") ?? 0) > MAX_DOWNLOAD_BYTES) throw new ImageImportError("La imagen pesa más de 15 MB.");

    const chunks: Uint8Array[] = [];
    let size = 0;
    for await (const chunk of response.body as unknown as AsyncIterable<Uint8Array>) {
      size += chunk.byteLength;
      if (size > MAX_DOWNLOAD_BYTES) throw new ImageImportError("La imagen pesa más de 15 MB.");
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }
  throw new ImageImportError("Demasiadas redirecciones.");
}

/**
 * Descarga una imagen de un link y la deja lista para la tienda: orientación corregida,
 * máx. 1600 px por lado (sin agrandar las pequeñas) y WebP de alta calidad.
 */
export async function importImageFromUrl(raw: string) {
  const input = await download(raw);
  try {
    const image = sharp(input, { limitInputPixels: 60_000_000, animated: false });
    const meta = await image.metadata();
    const { data, info } = await image
      .rotate()
      .resize({ width: TARGET_SIDE, height: TARGET_SIDE, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 88, effort: 5 })
      .toBuffer({ resolveWithObject: true });
    const original = { width: meta.width ?? info.width, height: meta.height ?? info.height };
    return {
      file: new File([new Uint8Array(data)], "importada.webp", { type: "image/webp" }),
      original,
      lowResolution: Math.max(original.width, original.height) < MIN_SHARP_SIDE,
    };
  } catch {
    throw new ImageImportError("No se pudo leer la imagen (formato no soportado o archivo dañado).");
  }
}
