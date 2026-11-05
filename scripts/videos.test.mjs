// Run: node --experimental-strip-types --test scripts/videos.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { clientIp, formatBytes, sniffMedia, uploadRateLimited, videoKey, videoType } from "../src/lib/video-rules.ts";

const bytes = (...parts) => {
  const out = [];
  for (const p of parts) typeof p === "string" ? out.push(...[...p].map((c) => c.charCodeAt(0))) : out.push(...p);
  while (out.length < 64) out.push(0);
  return Uint8Array.from(out);
};

test("first look refuses obvious non-media", () => {
  assert.equal(videoType("IMG_0001.MOV", "video/quicktime"), "video/quicktime");
  assert.equal(videoType("IMG_0001.MOV", ""), "video/quicktime");
  assert.equal(videoType("IMG_1.HEIC", ""), "image/heic");
  assert.equal(videoType("a.svg", "image/svg+xml"), null);
  assert.equal(videoType("notes.pdf", "application/pdf"), null);
  assert.equal(videoType("notes.pdf", ""), null);
});

test("the bytes decide what a file is", () => {
  assert.deepEqual(sniffMedia(bytes([0, 0, 0, 0x18], "ftypqt  ")), { type: "video/quicktime", ext: "mov" });
  assert.deepEqual(sniffMedia(bytes([0, 0, 0, 0x18], "ftypisom")), { type: "video/mp4", ext: "mp4" });
  assert.deepEqual(sniffMedia(bytes([0, 0, 0, 0x18], "ftypheic")), { type: "image/heic", ext: "heic" });
  assert.deepEqual(sniffMedia(bytes([0x1a, 0x45, 0xdf, 0xa3], "....webm")), { type: "video/webm", ext: "webm" });
  assert.deepEqual(sniffMedia(bytes([0xff, 0xd8, 0xff, 0xe0])), { type: "image/jpeg", ext: "jpg" });
  assert.deepEqual(sniffMedia(bytes([0x89], "PNG\r\n\x1a\n")), { type: "image/png", ext: "png" });
  assert.deepEqual(sniffMedia(bytes("RIFF", [0, 0, 0, 0], "WEBP")), { type: "image/webp", ext: "webp" });
  // Labelled as video, but it is a web page or a program.
  assert.equal(sniffMedia(bytes("<!doctype html><script>alert(1)</script>")), null);
  assert.equal(sniffMedia(bytes("MZ\x90\x00")), null);
  assert.equal(sniffMedia(bytes("%PDF-1.7")), null);
  assert.equal(sniffMedia(Uint8Array.from([0xff, 0xd8])), null);
});

test("keys are dated, unguessable and never carry the original name", () => {
  assert.equal(videoKey("mov", new Date("2026-11-05T12:00:00Z"), "abc123def456"), "ambassadors/2026-11/abc123def456.mov");
  assert.match(videoKey("../x"), /^ambassadors\/\d{4}-\d{2}\/[0-9a-f]{12}\.bin$/);
});

test("only the proxy's last hop counts as the address", () => {
  assert.equal(clientIp("6.6.6.6, 1.2.3.4"), "1.2.3.4");
  assert.equal(clientIp("1.2.3.4"), "1.2.3.4");
  assert.equal(clientIp(null), "");
});

test("rate limit lets an ambassador send a batch but stops floods", () => {
  const t = 1_000_000;
  for (let i = 0; i < 120; i++) assert.equal(uploadRateLimited("1.2.3.4", t + i), false);
  assert.equal(uploadRateLimited("1.2.3.4", t + 121), true);
  assert.equal(uploadRateLimited("1.2.3.4", t + 61 * 60 * 1000), false);
});

test("sizes read naturally", () => {
  assert.equal(formatBytes(150 * 1024 * 1024), "150 MB");
  assert.equal(formatBytes(1.5 * 1024 ** 3), "1.5 GB");
});
