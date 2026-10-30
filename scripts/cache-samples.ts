// Pre-computes explanations for the sample forms in every language so the
// demo examples load instantly. Run with: npm run cache-samples
// Existing results are kept; delete a file to regenerate it.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { explainForm } from "../src/lib/explain";
import { LANGUAGES } from "../src/lib/languages";
import { SAMPLES } from "../src/lib/samples";

const OUT = "public/samples/results";
const CONCURRENCY = 4;

async function main() {
  mkdirSync(OUT, { recursive: true });
  const jobs = SAMPLES.flatMap((s) => LANGUAGES.map((l) => ({ s, l })))
    .filter(({ s, l }) => !existsSync(`${OUT}/${s.id}.${l.code}.json`));
  console.log(`${jobs.length} results to generate`);

  let failed = 0;
  const worker = async () => {
    for (let job = jobs.shift(); job; job = jobs.shift()) {
      const { s, l } = job;
      const started = Date.now();
      try {
        const bytes = new Uint8Array(readFileSync(`public${s.image}`));
        const result = await explainForm(bytes, "image/png", l);
        writeFileSync(`${OUT}/${s.id}.${l.code}.json`, JSON.stringify(result, null, 2) + "\n");
        console.log(`ok   ${s.id}.${l.code} (${result.fields.length} fields, ${Math.round((Date.now() - started) / 1000)}s)`);
      } catch (e) {
        failed++;
        console.error(`fail ${s.id}.${l.code}: ${e instanceof Error ? e.message : e}`);
      }
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  if (failed) process.exitCode = 1;
}

main();
