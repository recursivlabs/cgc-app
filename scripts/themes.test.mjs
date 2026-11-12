import { test } from "node:test";
import assert from "node:assert/strict";
import { currentTheme, easternMonth, themeMonthName } from "../src/lib/themes.ts";

test("no theme before December 1 Eastern", () => {
  // 11:59 pm ET on Nov 30 is 04:59 UTC on Dec 1.
  assert.equal(currentTheme(new Date("2026-12-01T04:59:00Z")), undefined);
});

test("December theme starts at midnight Eastern on Dec 1", () => {
  assert.equal(easternMonth(new Date("2026-12-01T05:00:00Z")), "2026-12");
  assert.equal(currentTheme(new Date("2026-12-01T05:00:00Z"))?.title, "What is a Bridge Builder?");
});

test("January is the second theme", () => {
  const t = currentTheme(new Date("2027-01-15T12:00:00Z"));
  assert.equal(t?.title, "Disagreeing Without Disconnecting");
  assert.equal(themeMonthName(t), "January");
});

test("nothing after the list runs out", () => {
  assert.equal(currentTheme(new Date("2027-07-02T12:00:00Z")), undefined);
});
