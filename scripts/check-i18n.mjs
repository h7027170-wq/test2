// Checks that ar.json and fr.json have exactly the same keys and {placeholders} as en.json (the reference).
import { readFileSync } from "node:fs";

const load = (l) => JSON.parse(readFileSync(new URL(`../messages/${l}.json`, import.meta.url), "utf8"));
const flat = (o, p = "") => Object.entries(o).flatMap(([k, v]) => (v && typeof v === "object" ? flat(v, `${p}${k}.`) : [[`${p}${k}`, String(v)]]));
const vars = (s) => (s.match(/\{\w+\}/g) ?? []).sort().join(",");

const en = new Map(flat(load("en")));
let problems = 0;
for (const locale of ["ar", "fr"]) {
  const other = new Map(flat(load(locale)));
  for (const [k, v] of en) {
    if (!other.has(k)) (problems++, console.error(`${locale}: missing ${k}`));
    else if (vars(other.get(k)) !== vars(v)) (problems++, console.error(`${locale}: placeholders differ in ${k}`));
    else if (v && other.get(k) === v && locale === "ar" && /[a-z]{4,}/i.test(v)) console.warn(`${locale}: possibly untranslated ${k}`);
  }
  for (const k of other.keys()) if (!en.has(k)) (problems++, console.error(`${locale}: extra key ${k}`));
}
if (problems) process.exit(1);
console.log("i18n: ar and fr match en.");
