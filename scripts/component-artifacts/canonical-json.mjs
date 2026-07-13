import { createHash } from "node:crypto";

function normalizeJson(value, seen) {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new TypeError("Canonical JSON cannot contain a non-finite number");
    }
    return value;
  }

  if (!value || typeof value !== "object") {
    throw new TypeError(`Canonical JSON cannot contain ${typeof value}`);
  }

  if (seen.has(value)) {
    throw new TypeError("Canonical JSON cannot contain a cycle");
  }
  seen.add(value);

  if (Array.isArray(value)) {
    const normalized = value.map((item) => normalizeJson(item, seen));
    seen.delete(value);
    return normalized;
  }

  if (Object.getPrototypeOf(value) !== Object.prototype) {
    throw new TypeError("Canonical JSON accepts only plain objects and arrays");
  }

  const normalized = Object.fromEntries(
    Object.keys(value)
      .sort(compareUtf8)
      .map((key) => [key, normalizeJson(value[key], seen)]),
  );
  seen.delete(value);
  return normalized;
}

export function compareUtf8(left, right) {
  return Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"));
}

export function canonicalJson(value) {
  return Buffer.from(
    `${JSON.stringify(normalizeJson(value, new WeakSet()), null, 2)}\n`,
    "utf8",
  );
}

export function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}
