// Run: node --experimental-strip-types --test scripts/videos.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { formatBytes, uploadRateLimited, videoKey, videoType } from "../src/lib/video-rules.ts";

test("phone videos and photos are accepted, other files are not", () => {
  assert.equal(videoType("IMG_1.HEIC", ""), "image/heic");
  assert.equal(videoType("a.jpg", "image/jpeg"), "image/jpeg");
  assert.equal(videoType("a.svg", "image/svg+xml"), null);
  assert.equal(videoType("IMG_0001.MOV", "video/quicktime"), "video/quicktime");
  assert.equal(videoType("clip.mp4", "video/mp4"), "video/mp4");
  assert.equal(videoType("IMG_0001.MOV", ""), "video/quicktime");
  assert.equal(videoType("clip.webm", "application/octet-stream"), "video/webm");
  assert.equal(videoType("page.html", "text/html"), null);
  assert.equal(videoType("page.mp4", "text/html"), null);
  assert.equal(videoType("notes.pdf", ""), null);
  assert.equal(videoType("x.svg", ""), null);
  assert.equal(videoType("x.mp4", "video/<script>"), null);
});

test("keys are safe, dated and unguessable", () => {
  const k = videoKey("My Clip (1).MOV", new Date("2026-11-05T12:00:00Z"), "abc123def456");
  assert.equal(k, "ambassadors/2026-11/abc123def456-my-clip-1-.mov");
  assert.match(videoKey("../../etc/passwd"), /^ambassadors\/\d{4}-\d{2}\/[0-9a-f]{12}-etc-passwd$/);
  assert.match(videoKey("😀"), /-video$/);
});

test("rate limit lets an ambassador send a batch but stops floods", () => {
  const t = 1_000_000;
  for (let i = 0; i < 40; i++) assert.equal(uploadRateLimited("1.2.3.4", t + i), false);
  assert.equal(uploadRateLimited("1.2.3.4", t + 41), true);
  assert.equal(uploadRateLimited("1.2.3.4", t + 61 * 60 * 1000), false);
});

test("sizes read naturally", () => {
  assert.equal(formatBytes(150 * 1024 * 1024), "150 MB");
  assert.equal(formatBytes(1.5 * 1024 ** 3), "1.5 GB");
});
