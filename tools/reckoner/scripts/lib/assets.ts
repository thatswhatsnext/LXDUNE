/**
 * The approved Field Guide artwork in assets/field-guide: lesson illustrations and brand marks.
 *
 * assets.json says which image belongs to which lesson and where it shows (on the lesson's first item, or
 * only after a named item is answered). Loading checks every file against its SHA-256 and its stated
 * width and height, so a swapped or re-exported image fails the build instead of reaching students.
 *
 * Images reach a page in one of two ways:
 *   link    copied into <outDir>/img/ and linked by relative path with a content hash (site builds)
 *   embed   inlined as a data URI, so a single file works offline (single-file and review builds)
 */
import { createHash } from "node:crypto";
import { copyFileSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";

// Not from build.ts: build.ts imports this file, so PKG_ROOT is not defined yet when this module loads.
export const ASSET_DIR = join(__dirname, "..", "..", "assets", "field-guide");

export interface LessonImage {
  id: string;
  lesson: string;
  placement: "opening" | "after-attempt";
  /** after-attempt only: the item whose answer reveals the picture. */
  afterItem?: string;
  file: string;
  width: number;
  height: number;
  alt: string;
  sha256: string;
  /** Real text shown under the picture, for quantities the picture must not carry as pixels. */
  labels?: string[];
}
interface AssetFile { id: string; file: string; sha256: string; deployed?: boolean }
export interface Assets { lessons: LessonImage[]; brand: AssetFile[]; reference: AssetFile[]; dir: string }

/** Width and height from a WebP header: lossless (VP8L), lossy (VP8) or extended (VP8X). */
export function webpSize(b: Buffer): { width: number; height: number } | null {
  if (b.toString("ascii", 0, 4) !== "RIFF" || b.toString("ascii", 8, 12) !== "WEBP") return null;
  const chunk = b.toString("ascii", 12, 16);
  if (chunk === "VP8L") {
    const bits = b.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  if (chunk === "VP8X") return { width: b.readUIntLE(24, 3) + 1, height: b.readUIntLE(27, 3) + 1 };
  if (chunk === "VP8 ") return { width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff };
  return null;
}

const sha = (b: Buffer) => createHash("sha256").update(b).digest("hex");

/** Load assets.json and check every file. Throws one Error listing every problem. */
export function loadAssets(dir = ASSET_DIR): Assets {
  const a = JSON.parse(readFileSync(join(dir, "assets.json"), "utf8"));
  const errors: string[] = [];
  const check = (f: AssetFile) => {
    let b: Buffer;
    try { b = readFileSync(join(dir, f.file)); } catch { return errors.push(`${f.file}: file not found`); }
    if (sha(b) !== f.sha256) errors.push(`${f.file}: SHA-256 does not match assets.json`);
    return b;
  };
  const seen = new Set<string>();
  for (const l of a.lessons as LessonImage[]) {
    if (seen.has(l.lesson)) errors.push(`assets.json: lesson ${l.lesson} has more than one image`);
    seen.add(l.lesson);
    if (!["opening", "after-attempt"].includes(l.placement)) errors.push(`${l.id}: unknown placement "${l.placement}"`);
    if ((l.placement === "after-attempt") !== !!l.afterItem) errors.push(`${l.id}: an after-attempt image needs afterItem, and only it`);
    if (!l.alt || !l.alt.trim()) errors.push(`${l.id}: no alt text`);
    const b = check(l);
    if (b instanceof Buffer) {
      const s = webpSize(b);
      if (!s) errors.push(`${l.file}: not a WebP file`);
      else if (s.width !== l.width || s.height !== l.height) errors.push(`${l.file}: is ${s.width}×${s.height}, assets.json says ${l.width}×${l.height}`);
    }
  }
  [...a.brand, ...a.reference].forEach(check);
  if (errors.length) throw new Error(`Field Guide assets: ${errors.length} problem(s)\n  ${errors.join("\n  ")}`);
  return { lessons: a.lessons, brand: a.brand, reference: a.reference, dir };
}

/** The image a page uses: a URL or data URI, plus what the markup needs. */
export interface PageImage { src: string; width: number; height: number; alt: string; labels?: string[] }

/**
 * Makes PageImages for one output. In link mode the img/ folder under outDir is emptied first, so an image
 * no longer used does not linger, and each used image is copied there once.
 */
export function imageSource(assets: Assets, mode: "link" | "embed", outDir?: string) {
  if (mode === "link") {
    if (!outDir) throw new Error("imageSource: link mode needs an outDir");
    rmSync(join(outDir, "img"), { recursive: true, force: true });
  }
  return (l: LessonImage): PageImage => {
    const b = readFileSync(join(assets.dir, l.file));
    let src: string;
    if (mode === "embed") src = `data:image/webp;base64,${b.toString("base64")}`;
    else {
      const name = `${l.id}.webp`;
      mkdirSync(join(outDir!, "img"), { recursive: true });
      copyFileSync(join(assets.dir, l.file), join(outDir!, "img", name));
      src = `img/${name}?v=${l.sha256.slice(0, 12)}`;
    }
    return { src, width: l.width, height: l.height, alt: l.alt, ...(l.labels ? { labels: l.labels } : {}) };
  };
}

const escAttr = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

/** <img> markup for a template, full frame at its intrinsic ratio. The game builds the same markup in game.js. */
export function imgTag(p: PageImage, extra = "") {
  const labels = p.labels?.length ? `<p class="plate-labels">${p.labels.map((t) => `<span>${escAttr(t)}</span>`).join("")}</p>` : "";
  return `<img class="plate" src="${escAttr(p.src)}" width="${p.width}" height="${p.height}" alt="${escAttr(p.alt)}" decoding="async"${extra}>${labels}`;
}

/** The favicon as an inline data URI, so every build, including single files, has it without another request. */
export const faviconLink = (assets: Assets) => {
  const f = assets.brand.find((b) => b.id === "favicon")!;
  const svg = readFileSync(join(assets.dir, f.file), "utf8").trim();
  return `<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,${encodeURIComponent(svg)}">`;
};
