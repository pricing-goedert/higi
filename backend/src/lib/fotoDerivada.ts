import sharp from 'sharp'

/**
 * Turns a raw ERP product photo into the one shape the app actually renders.
 *
 * Two problems this solves at once. Size: the catalog is ~800 products and the
 * ERP's originals are unbounded, so shipping them as-is blows the ~30MB
 * per-device storage budget docs/PLAN.md sets for the offline layer. Framing:
 * the product card is a fixed 16:9-ish box with `object-cover`, so a tall or
 * square source photo used to get its top and bottom cropped off — exactly the
 * part of a cleaning product you want to see.
 *
 * Emitting at the card's own aspect ratio with `contain` fixes both: the whole
 * product stays visible, letterboxed onto the card's own white, and
 * `object-cover` in the view becomes an exact fit rather than a crop.
 */

// ProdutoDetailView.vue renders the photo at `h-48 w-full` — 192px tall over a
// ~328px-wide phone column, ≈1.71:1. Doubled for 2x screens, with a little
// headroom for tablets.
export const LARGURA = 800
export const ALTURA = 468
export const CONTENT_TYPE = 'image/webp'

// Not a storage concern (the output is a few dozen KB either way) — it's a
// guard against handing sharp something absurd because an admin pasted a link
// to a print-resolution TIFF.
const TAMANHO_MAX_ORIGEM = 15 * 1024 * 1024

/** The source wasn't usable as an image — distinct from "couldn't fetch it". */
export class FotoInvalidaError extends Error {}

export async function derivarFoto(origem: Buffer): Promise<Buffer> {
  if (origem.length > TAMANHO_MAX_ORIGEM) {
    throw new FotoInvalidaError('Imagem de origem excede o tamanho máximo')
  }

  try {
    return await sharp(origem, {
      // Default is 'warning', which rejects slightly-malformed JPEGs that every
      // browser renders without complaint. ERP-sourced photos are not
      // guaranteed to be pristine and one strict decoder shouldn't be why a
      // rep sees no photo — but a genuinely corrupt file should still fail.
      failOn: 'error',
    })
      // No argument: applies whatever EXIF orientation the source declares,
      // instead of rendering phone-shot photos on their side.
      .rotate()
      .resize(LARGURA, ALTURA, {
        fit: 'contain',
        // --color-card in frontend/src/style.css, so the letterboxing is
        // invisible against the card it sits on.
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .webp({ quality: 78 })
      .toBuffer()
  } catch (erro) {
    throw new FotoInvalidaError(erro instanceof Error ? erro.message : 'Imagem de origem inválida')
  }
}
