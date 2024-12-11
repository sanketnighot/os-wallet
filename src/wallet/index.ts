import { generateMnemonic, mnemonicToSeedSync } from "bip39"

type Response<T = unknown> =
  | {
      success: true
      message: string
      data: T
    }
  | {
      success: false
      message: string
      error: Error | unknown
    }



export const generateMnemonicForUser = async (): Promise<Response<string>> => {
  try {
    const mnemonic = await generateMnemonic(256)
    return {
      data: mnemonic,
      success: true,
      message: "24-word mnemonic generated successfully",
    }
  } catch (error) {
    return {
      message: "Failed to generate mnemonic",
      success: false,
      error,
    }
  }
}

export const generateSeed = async (mnemonic: string): Promise<Response> => {
  try {
    const seed = await mnemonicToSeedSync(mnemonic)
    return {
      data: seed,
      success: true,
      message: "Seed generated successfully",
    }
  } catch (error) {
    return {
      message: "Failed to generate seed",
      success: false,
      error,
    }
  }
}

