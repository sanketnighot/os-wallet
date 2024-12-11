import { BIP32Factory } from "bip32"
import * as ecc from "tiny-secp256k1"

const bip32 = BIP32Factory(ecc)

interface BitcoinWallet {
  privateKey: string
  publicKey: string
  wif: string
}

export function deriveBitcoinWallet(
  seed: Buffer,
  derivationPath: string
): BitcoinWallet {
  const privateKey = deriveBitcoinPrivateKey(seed, derivationPath);
  const node = bip32.fromPrivateKey(
    Buffer.from(privateKey.toString('hex'), 'hex'),
    Buffer.alloc(32)
  );
  
  return {
    privateKey: privateKey.toString('hex'),
    publicKey: node.publicKey.toString(),
    wif: node.toWIF()
  };
}

export function deriveBitcoinPrivateKey(
  seed: Buffer,
  derivationPath: string
): Buffer {
  const root = bip32.fromSeed(seed);
  const child = root.derivePath(derivationPath);
  if (!child.privateKey) {
    throw new Error("Could not derive private key");
  }
  return Buffer.from(child.privateKey);
}

/**
 * Validate a Bitcoin private key
 */
export function getBitcoinWallet(privateKey: string): BitcoinWallet {
  try {
    const keyBuffer = Buffer.from(privateKey, 'hex');
    const node = bip32.fromPrivateKey(keyBuffer, Buffer.alloc(32));
    return {
      privateKey: privateKey,
      publicKey: node.publicKey.toString(),
      wif: node.toWIF()
    };
  } catch {
    throw new Error("Invalid Bitcoin private key");
  }
} 