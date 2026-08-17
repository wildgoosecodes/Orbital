// Compares two strings without exiting early on the first mismatched byte,
// so a wrong guess can't be timed byte-by-byte. Folds the length difference
// into the result too, rather than short-circuiting on unequal lengths.
export function timingSafeEqualString(a: string, b: string): boolean {
  const bytesA = new TextEncoder().encode(a);
  const bytesB = new TextEncoder().encode(b);
  const maxLen = Math.max(bytesA.length, bytesB.length);
  let diff = bytesA.length ^ bytesB.length;
  for (let i = 0; i < maxLen; i++) {
    diff |= (bytesA[i] ?? 0) ^ (bytesB[i] ?? 0);
  }
  return diff === 0;
}
