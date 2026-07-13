import assert from "node:assert/strict";
import test from "node:test";

import { parseCanonicalZip } from "./test-helpers.mjs";
import { crc32, createStoredZip } from "./zip-store.mjs";

test("crc32 matches the standard reference vector", () => {
  assert.equal(crc32(Buffer.from("123456789")), 0xcbf43926);
});

test("STORE ZIP output is byte-deterministic and has canonical metadata", () => {
  const first = createStoredZip([
    { name: "z/file.txt", data: Buffer.from("z") },
    { name: "a.txt", data: Buffer.from("alpha") },
  ]);
  const second = createStoredZip([
    { name: "a.txt", data: Buffer.from("alpha") },
    { name: "z/file.txt", data: Buffer.from("z") },
  ]);
  assert.deepEqual(first, second);
  const files = parseCanonicalZip(first);
  assert.deepEqual([...files.keys()], ["a.txt", "z/file.txt"]);
  assert.equal(files.get("a.txt").toString(), "alpha");
});

test("STORE ZIP rejects traversal, collisions, reserved names, and oversize entries", () => {
  for (const name of [
    "../escape",
    "/absolute",
    "a\\b",
    "a//b",
    "CON.txt",
    "a/./b",
  ]) {
    assert.throws(
      () => createStoredZip([{ name, data: Buffer.alloc(0) }]),
      /ZIP/,
    );
  }
  assert.throws(
    () =>
      createStoredZip([
        { name: "File.ts", data: Buffer.alloc(0) },
        { name: "file.ts", data: Buffer.alloc(0) },
      ]),
    /Duplicate ZIP entry/,
  );
  assert.throws(
    () =>
      createStoredZip([
        { name: "big.bin", data: Buffer.alloc(1024 * 1024 + 1) },
      ]),
    /exceeds/,
  );
});
