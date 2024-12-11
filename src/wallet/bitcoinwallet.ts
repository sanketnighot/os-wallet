import { BIP32Factory } from "bip32"
import * as ecc from "tiny-secp256k1"
import { payments, networks, initEccLib } from "bitcoinjs-lib"

const bip32 = BIP32Factory(ecc)
initEccLib(ecc)

interface BitcoinWallet {
  privateKey: string
  publicKey: string
  wif: string
}

export function deriveBitcoinWallet(
  seed: Buffer,
  derivationPath: string
): BitcoinWallet {
  const wallet = deriveBitcoinPrivateKey(seed, derivationPath);
  const node = bip32.fromPrivateKey(
    Buffer.from(wallet.toString(), 'hex'),
    Buffer.alloc(32)
  );
  
  return {
    privateKey: wallet.privateKey,
    publicKey: wallet.publicKey,
    wif: node.toWIF()
  };
}

export function deriveBitcoinPrivateKey(
  seed: Buffer,
  derivationPath: string
): {privateKey: string, publicKey: string} {
  const root = bip32.fromSeed(seed);
  const child = root.derivePath(derivationPath);
  if (!child.privateKey) {
    throw new Error("Could not derive private key");
  }
  const publicKey = getAddress(child, networks.bitcoin)
  if (!publicKey) {
    throw new Error("Could not derive public key");
  }
  return {privateKey: (Buffer.from(child.privateKey)).toString(), publicKey: publicKey};
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

function getAddress(node: any, network: any): string | undefined {
  return payments.p2tr({ pubkey: Buffer.from(node.publicKey.slice(1, 33)), network }).address
}