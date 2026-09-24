/**
 * Reckoner decision dimensions. A guide's fitProfile scores every option of
 * every dimension from 0 (poor fit) to 3 (strong fit), in the order listed here.
 *
 * This is the single source of truth: the reckoner UI builds its questions
 * from this file, and each guide's front matter carries its own scores.
 */
export const FIT_DIMENSIONS = {
  purpose: ["misc", "model", "investigate", "argue", "design", "ssi", "reason"],
  time: ["lesson", "short", "unit", "depth"],
  ready: ["novice", "developing", "experienced"],
  concept: ["observable", "instrument", "abstract", "largescale", "value"],
  misc: ["robust", "some", "unknown"],
  ws: ["1", "2", "3", "4", "5", "6", "7", "8"],
  conf: ["low", "mod", "high"],
  res: ["lab", "limited", "none"],
  assess: ["explanation", "report", "argument", "product", "reflection"],
  lang: ["high", "moderate", "low"],
  place: ["yes", "maybe", "no"],
} as const;

export type FitDimension = keyof typeof FIT_DIMENSIONS;
export const FIT_DIMENSION_KEYS = Object.keys(FIT_DIMENSIONS) as FitDimension[];
