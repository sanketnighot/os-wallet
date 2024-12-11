import { Keypair } from "@solana/web3.js"
import bs58 from "bs58"
import { derivePath } from "ed25519-hd-key"
import nacl from "tweetnacl"

export function deriveSolanaWallet(
  seed: Buffer,
  derivationPath: string
): Keypair {
  const privateKey = deriveSolanaPrivateKey(seed, derivationPath);
  return Keypair.fromSecretKey(privateKey);
}

export function deriveSolanaPrivateKey(
  seed: Buffer,
  derivationPath: string
): Uint8Array {
  const derivedSeed = derivePath(derivationPath, seed.toString()).key;
  return nacl.sign.keyPair.fromSeed(derivedSeed).secretKey;
}

/**
 * Validate a Solana private key
 */
export function getSolanaWallet(privateKey: string): Keypair {
  let wallet: Keypair;
  try {
    const decodedKey = bs58.decode(privateKey);
    wallet = Keypair.fromSecretKey(decodedKey);
  } catch {
    throw new Error("Invalid Solana private key");
  }
  return wallet;
}

export const encodeSecretKey = async (
  secretKey: Uint8Array
): Promise<string> => {
  const encodedSecretKey = bs58.encode(secretKey)
  return encodedSecretKey
}

export const decodeSecretKey = async (
  encodedSecretKey: string
): Promise<Uint8Array> => {
  const decodedSecretKey = bs58.decode(encodedSecretKey)
  return decodedSecretKey
}