import "server-only"
import { createCipheriv, createDecipheriv, createHmac, randomBytes } from "node:crypto"

function encryptionKey(): Buffer {
  const value = process.env.CBT_CREDENTIAL_ENCRYPTION_KEY
  if (!value) throw new Error("CBT_CREDENTIAL_ENCRYPTION_KEY is missing")
  const key = Buffer.from(value, "base64")
  if (key.length !== 32) throw new Error("CBT_CREDENTIAL_ENCRYPTION_KEY must be 32 bytes in base64")
  return key
}

export function credentialVerifier(code: string): string {
  const pepper = process.env.CBT_CREDENTIAL_PEPPER
  if (!pepper || Buffer.byteLength(pepper, "utf8") < 32) {
    throw new Error("CBT_CREDENTIAL_PEPPER is missing or too short")
  }
  // Identical to existing /api/cbt/login derivation.
  return createHmac("sha256", pepper).update("cbt-code:v1:").update(code).digest("hex")
}

// 32 easily distinguishable characters: no 0, 1, I, or O.
// Six characters provide 32^6 = 1,073,741,824 possible codes.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
export const PERSONAL_ACCESS_CODE_LENGTH = 6

export function generatePersonalAccessCode(): string {
  const bytes = randomBytes(PERSONAL_ACCESS_CODE_LENGTH)
  return Array.from(bytes, byte => CODE_ALPHABET[byte & 31]).join("")
}

export function issueAccessCode() {
  const code = generatePersonalAccessCode()
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv)
  const ciphertext = Buffer.concat([cipher.update(code, "utf8"), cipher.final()])
  const envelope = Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString("base64")
  return { verifier: credentialVerifier(code), encryptedCode: `v1:${envelope}` }
}

export function decryptAccessCode(encryptedCode: string): string {
  if (!encryptedCode.startsWith("v1:")) throw new Error("Unknown credential envelope")
  const bytes = Buffer.from(encryptedCode.slice(3), "base64")
  if (bytes.length < 29) throw new Error("Invalid credential envelope")
  const iv = bytes.subarray(0, 12)
  const authTag = bytes.subarray(12, 28)
  const ciphertext = bytes.subarray(28)
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), iv)
  decipher.setAuthTag(authTag)
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8")
}
