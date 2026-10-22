// Run: node --experimental-strip-types --test scripts/spam.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { botReason, isGibberish, looksRandom } from "../src/lib/spam.ts";

const BOT = ["Alkqbmoh Bgsquz", "vLxoHCWkPhZswWxebaLi", "RmjzLLMgjoxkQcahkgDP", "FJStmlYkasRgtxDtLlZb"];

test("the real spam is gibberish", () => {
  assert.equal(isGibberish(BOT), true);
});

test("real names and campuses pass", () => {
  for (const w of [
    "McDonald", "O'Brien", "Szczepanski", "DeShawn", "LaToya", "MacArthur", "McKenzie-Smith",
    "UCLA", "TEDxUCSD", "StudentsForDialogue", "NYUStern", "USCAnnenberg", "UCSanDiego",
    "MITMediaLab", "OpenAIResearch",
  ]) {
    assert.equal(looksRandom(w), false, w);
  }
  assert.equal(isGibberish(["Maya O'Brien", "NYUStern", "USCAnnenberg", "Kraków"]), false);
});

test("bot signals", () => {
  const human = ["Maya Lopez", "UCLA", "Los Angeles", "Hi"];
  assert.equal(botReason({ honeypot: "x", elapsedMs: 9000, fields: human }), "honeypot");
  assert.equal(botReason({ honeypot: "", elapsedMs: null, fields: human }), "no-timer");
  assert.equal(botReason({ honeypot: "", elapsedMs: 900, fields: human }), "too-fast");
  assert.equal(botReason({ honeypot: "", elapsedMs: 20000, fields: BOT }), "gibberish");
  assert.equal(botReason({ honeypot: "", elapsedMs: 20000, fields: human }), null);
});
