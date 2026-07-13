import assert from "node:assert/strict";
import test from "node:test";

import { canonicalJson, sha256 } from "./canonical-json.mjs";

test("canonicalJson sorts object keys and writes one LF-terminated document", () => {
  const first = canonicalJson({
    z: 1,
    nested: { beta: true, alpha: null },
    a: [2, 1],
  });
  const second = canonicalJson({
    a: [2, 1],
    nested: { alpha: null, beta: true },
    z: 1,
  });
  assert.deepEqual(first, second);
  assert.equal(first.at(-1), 10);
  assert.equal(first.includes(13), false);
  assert.match(sha256(first), /^[0-9a-f]{64}$/);
});

test("canonicalJson rejects values JSON would silently discard", () => {
  assert.throws(
    () => canonicalJson({ missing: undefined }),
    /cannot contain undefined/,
  );
  assert.throws(() => canonicalJson({ invalid: Number.NaN }), /non-finite/);
  assert.throws(() => canonicalJson({ date: new Date(0) }), /plain objects/);
  const cyclic = {};
  cyclic.self = cyclic;
  assert.throws(() => canonicalJson(cyclic), /cycle/);
});
