/**
 * Export JSON Schema for use outside TypeScript: editor autocompletion for
 * YAML authors, and structured-output schemas for the AI layer.
 *
 *   npm run export-schema   ->  dist/model-guide.schema.json, dist/methodology.schema.json
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { zodToJsonSchema } from "zod-to-json-schema";
import { Example, ModelGuide, SequenceStep } from "../src/schema/model-guide";
import { Methodology } from "../src/schema/methodology";

const out = join(__dirname, "..", "dist");
mkdirSync(out, { recursive: true });
const write = (name: string, schema: unknown) =>
  writeFileSync(join(out, name), JSON.stringify(schema, null, 2));

write("model-guide.schema.json", zodToJsonSchema(ModelGuide, "ModelGuide"));
write("methodology.schema.json", zodToJsonSchema(Methodology, "Methodology"));
// Smaller schemas the AI layer returns, validated with the same rules
write("example.schema.json", zodToJsonSchema(Example, "Example"));
write("sequence-step.schema.json", zodToJsonSchema(SequenceStep, "SequenceStep"));
console.log("Wrote JSON Schemas to dist/");
