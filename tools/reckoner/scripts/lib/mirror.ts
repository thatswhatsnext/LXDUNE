/**
 * Make dest an exact copy of src: add and update changed files, and delete
 * files in dest that the build no longer produces (for example a guide that
 * was unpublished). With check: true, nothing is written and the differences
 * are only reported.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";

export interface MirrorResult { added: string[]; updated: string[]; removed: string[] }

const walk = (dir: string): string[] =>
  existsSync(dir)
    ? readdirSync(dir).flatMap((f) => {
        const p = join(dir, f);
        return statSync(p).isDirectory() ? walk(p) : [p];
      })
    : [];

export function mirror(src: string, dest: string, check = false): MirrorResult {
  const srcFiles = walk(src).map((p) => relative(src, p)).filter((f) => !f.endsWith(".DS_Store")).sort();
  const destFiles = walk(dest).map((p) => relative(dest, p)).filter((f) => !f.endsWith(".DS_Store")).sort();
  const res: MirrorResult = { added: [], updated: [], removed: [] };

  for (const f of srcFiles) {
    const to = join(dest, f);
    if (!existsSync(to)) res.added.push(f);
    else if (!readFileSync(to).equals(readFileSync(join(src, f)))) res.updated.push(f);
    else continue;
    if (!check) {
      mkdirSync(dirname(to), { recursive: true });
      copyFileSync(join(src, f), to);
    }
  }
  for (const f of destFiles.filter((f) => !srcFiles.includes(f))) {
    res.removed.push(f);
    if (!check) rmSync(join(dest, f));
  }
  if (!check) {
    // Tidy directories left empty by removals.
    for (const d of new Set(res.removed.map((f) => dirname(join(dest, f))))) {
      if (existsSync(d) && readdirSync(d).length === 0) rmSync(d, { recursive: true });
    }
  }
  return res;
}
