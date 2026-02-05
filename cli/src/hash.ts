import { createHash } from "node:crypto";
import fs from "node:fs";

export function sha256File(filepath: string) {
  const buf = fs.readFileSync(filepath);
  return createHash("sha256").update(buf).digest("hex");
}
