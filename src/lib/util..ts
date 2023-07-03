import { createHash } from "crypto";

export function hashFunctionContents(func: Function): string {
  const functionString = func.toString();
  const hash = createHash("sha256").update(functionString).digest("hex");
  return hash;
}
