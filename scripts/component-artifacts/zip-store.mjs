import { compareUtf8 } from "./canonical-json.mjs";

const MAX_ENTRY_BYTES = 1024 * 1024;
const MAX_ARCHIVE_BYTES = 10 * 1024 * 1024;
const UTF8_FLAG = 0x0800;
const STORED_METHOD = 0;
const DOS_TIME = 0;
const DOS_DATE = 0x0021;
const REGULAR_FILE_MODE = (0o100644 << 16) >>> 0;
const RESERVED_WINDOWS_NAME = /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i;

const crcTable = new Uint32Array(256);
for (let index = 0; index < crcTable.length; index += 1) {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  crcTable[index] = value >>> 0;
}

export function crc32(buffer) {
  let value = 0xffffffff;
  for (const byte of buffer) {
    value = crcTable[(value ^ byte) & 0xff] ^ (value >>> 8);
  }
  return (value ^ 0xffffffff) >>> 0;
}

function validateEntryName(name) {
  if (
    typeof name !== "string" ||
    name.length === 0 ||
    name !== name.normalize("NFC")
  ) {
    throw new Error(`Invalid ZIP entry name: ${JSON.stringify(name)}`);
  }
  if (
    !/^[A-Za-z0-9._/-]+$/.test(name) ||
    name.startsWith("/") ||
    name.endsWith("/") ||
    name.includes("\\") ||
    name.includes("//")
  ) {
    throw new Error(`Unsafe ZIP entry name: ${name}`);
  }

  for (const segment of name.split("/")) {
    if (
      segment === "." ||
      segment === ".." ||
      segment.endsWith(".") ||
      segment.endsWith(" ") ||
      RESERVED_WINDOWS_NAME.test(segment)
    ) {
      throw new Error(`Unsafe ZIP entry segment: ${name}`);
    }
  }
}

function checkedUInt32(value, label) {
  if (!Number.isSafeInteger(value) || value < 0 || value > 0xffffffff) {
    throw new Error(`${label} exceeds the ZIP32 limit`);
  }
  return value;
}

export function createStoredZip(entries) {
  if (
    !Array.isArray(entries) ||
    entries.length === 0 ||
    entries.length > 0xffff
  ) {
    throw new Error("A ZIP archive must contain between 1 and 65535 files");
  }

  const seen = new Set();
  const normalized = entries
    .map(({ name, data }) => {
      validateEntryName(name);
      const key = name.toLowerCase();
      if (seen.has(key)) {
        throw new Error(`Duplicate ZIP entry: ${name}`);
      }
      seen.add(key);

      const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
      if (buffer.length > MAX_ENTRY_BYTES) {
        throw new Error(`ZIP entry exceeds ${MAX_ENTRY_BYTES} bytes: ${name}`);
      }

      const nameBytes = Buffer.from(name, "utf8");
      if (nameBytes.length > 0xffff) {
        throw new Error(`ZIP entry name is too long: ${name}`);
      }

      return { name, nameBytes, data: buffer, crc: crc32(buffer) };
    })
    .sort((left, right) => compareUtf8(left.name, right.name));

  const finalSize = normalized.reduce(
    (sum, entry) =>
      sum +
      30 +
      entry.nameBytes.length +
      entry.data.length +
      46 +
      entry.nameBytes.length,
    22,
  );
  if (
    !Number.isSafeInteger(finalSize) ||
    finalSize > MAX_ARCHIVE_BYTES ||
    finalSize > 0xffffffff
  ) {
    throw new Error(`ZIP archive exceeds ${MAX_ARCHIVE_BYTES} bytes`);
  }

  const localParts = [];
  const centralParts = [];
  let localOffset = 0;

  for (const entry of normalized) {
    checkedUInt32(entry.data.length, `${entry.name} size`);
    checkedUInt32(localOffset, `${entry.name} offset`);

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(UTF8_FLAG, 6);
    localHeader.writeUInt16LE(STORED_METHOD, 8);
    localHeader.writeUInt16LE(DOS_TIME, 10);
    localHeader.writeUInt16LE(DOS_DATE, 12);
    localHeader.writeUInt32LE(entry.crc, 14);
    localHeader.writeUInt32LE(entry.data.length, 18);
    localHeader.writeUInt32LE(entry.data.length, 22);
    localHeader.writeUInt16LE(entry.nameBytes.length, 26);
    localHeader.writeUInt16LE(0, 28);
    localParts.push(localHeader, entry.nameBytes, entry.data);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(0x0314, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(UTF8_FLAG, 8);
    centralHeader.writeUInt16LE(STORED_METHOD, 10);
    centralHeader.writeUInt16LE(DOS_TIME, 12);
    centralHeader.writeUInt16LE(DOS_DATE, 14);
    centralHeader.writeUInt32LE(entry.crc, 16);
    centralHeader.writeUInt32LE(entry.data.length, 20);
    centralHeader.writeUInt32LE(entry.data.length, 24);
    centralHeader.writeUInt16LE(entry.nameBytes.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(REGULAR_FILE_MODE, 38);
    centralHeader.writeUInt32LE(localOffset, 42);
    centralParts.push(centralHeader, entry.nameBytes);

    localOffset +=
      localHeader.length + entry.nameBytes.length + entry.data.length;
  }

  const centralDirectory = Buffer.concat(centralParts);
  checkedUInt32(localOffset, "central directory offset");
  checkedUInt32(centralDirectory.length, "central directory size");

  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(normalized.length, 8);
  end.writeUInt16LE(normalized.length, 10);
  end.writeUInt32LE(centralDirectory.length, 12);
  end.writeUInt32LE(localOffset, 16);
  end.writeUInt16LE(0, 20);

  const archive = Buffer.concat(
    [...localParts, centralDirectory, end],
    finalSize,
  );
  if (archive.length !== finalSize) {
    throw new Error("ZIP archive size did not match its preflight calculation");
  }
  return archive;
}
