import nacl from "tweetnacl"
import { generateMnemonic, mnemonicToSeedSync } from "bip39"
import { derivePath } from "ed25519-hd-key"

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

const coinDerivePath = {
  bitcoin: "m/44'/0",
  ethereum: "m/44'/60",
  solana: "m/44'/501",
} as const

type CoinType = keyof typeof coinDerivePath

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

export const generateKeypair = async (
  seed: Buffer,
  coin: CoinType,
  index: number
): Promise<Response> => {
  try {
    const path = `${coinDerivePath[coin]}'/0'/${index}'`
    const derivedSeed = derivePath(path, seed.toString()).key
    const keypair = nacl.sign.keyPair.fromSeed(derivedSeed)
    return {
      data: keypair,
      success: true,
      message: "Keypair generated successfully",
    }
  } catch (error) {
    return {
      message: "Failed to generate keypair",
      success: false,
      error,
    }
  }
}


