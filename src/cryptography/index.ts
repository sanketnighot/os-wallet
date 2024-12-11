import crypto from "crypto"
import 'dotenv/config'

const ITERATION_COUNT = parseInt(process.env.ITERATION_COUNT || "100000")
const KEY_LENGTH = parseInt(process.env.KEY_LENGTH || "32")
const SALT_LENGTH = parseInt(process.env.SALT_LENGTH || "16")
const IV_LENGTH = parseInt(process.env.IV_LENGTH || "16")
const walletSalt = process.env.MSG_ENCRYPTION_SALT || ""

export const encryptData = (
  data: string,
  password: string = walletSalt
): Promise<{
  success: boolean
  message: string
  encryptedData?: string
  error?: unknown
}> => {
  return new Promise((resolve) => {
    try {
      if (password === "")
        throw new Error("Error encrypting data: Values Undefined")
      const salt = crypto.randomBytes(SALT_LENGTH)
      const iv = crypto.randomBytes(IV_LENGTH)

      crypto.pbkdf2(
        password,
        salt,
        ITERATION_COUNT,
        KEY_LENGTH,
        "sha256",
        (err, key) => {
          if (err) throw err

          const cipher = crypto.createCipheriv("aes-256-cbc", key, iv)
          let encrypted = cipher.update(data, "utf8", "hex")
          encrypted += cipher.final("hex")

          // Combine salt, iv, and encrypted data
          const result = salt.toString("hex") + iv.toString("hex") + encrypted

          resolve({
            success: true,
            message: "Private Key Encrypted Successfully",
            encryptedData: result,
          })
        }
      )
    } catch (error) {
      resolve({
        success: false,
        message: "An Error Occurred while encrypting private key",
        error,
      })
    }
  })
}

export const decryptData = (
  data: string,
  password: string = walletSalt
): Promise<{
  success: boolean
  message: string
  decryptedPrivateKey?: string
  error?: unknown
}> => {
  return new Promise((resolve) => {
    try {
      if (password === "")
        throw new Error("Error decrypting data: Values Undefined")
      const salt = Buffer.from(data.slice(0, SALT_LENGTH * 2), "hex")
      const iv = Buffer.from(
        data.slice(SALT_LENGTH * 2, (SALT_LENGTH + IV_LENGTH) * 2),
        "hex"
      )
      const encrypted = data.slice((SALT_LENGTH + IV_LENGTH) * 2)

      crypto.pbkdf2(
        password,
        salt,
        ITERATION_COUNT,
        KEY_LENGTH,
        "sha256",
        (err, key) => {
          if (err) throw err

          const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv)
          let decrypted = decipher.update(encrypted, "hex", "utf8")
          decrypted += decipher.final("utf8")

          resolve({
            success: true,
            message: "Private Key Decrypted Successfully",
            decryptedPrivateKey: decrypted,
          })
        }
      )
    } catch (error) {
      resolve({
        success: false,
        message: "An Error Occurred while decrypting private key",
        error,
      })
    }
  })
}

export const hashData = (
  data: string
): Promise<{
  success: boolean
  message: string
  hashedData?: string
  error?: unknown
}> => {
  return new Promise((resolve) => {
    const hashedData = crypto.createHash("sha256").update(data).digest("hex")
    resolve({
      success: true,
      message: "Data Hashed Successfully",
      hashedData,
    })
  })
}