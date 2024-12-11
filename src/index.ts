import { generateMnemonicForUser, generateSeed, generateKeypair } from "./wallet"
import { encryptData } from "./cryptography"
import fs from "fs"
import path from "path"
import crypto from "crypto"
import { SignKeyPair } from "tweetnacl"
import { encodeSecretKey } from "./wallet/solanawallet"

interface WalletAccount {
  path: string
  publicKey: string
  privateKey: string
}

interface CoinAccounts {
  bitcoin?: WalletAccount[]
  ethereum?: WalletAccount[]
  solana?: WalletAccount[]
}

interface WalletData {
  mnemonic: string
  encryptedMnemonic: string
  seed: string
  encryptedSeed: string
  accounts: CoinAccounts
}

const generateWallets = async (numberOfWallets: number = 1): Promise<void> => {
  try {
    // Generate mnemonic
    const mnemonicResponse = await generateMnemonicForUser()
    if (!mnemonicResponse.success) throw new Error("Failed to generate mnemonic")
    const mnemonic = mnemonicResponse.data as string

    // Encrypt mnemonic
    const encryptedMnemonicResponse = await encryptData(mnemonic)
    if (!encryptedMnemonicResponse.success || !encryptedMnemonicResponse.encryptedData) {
      throw new Error("Failed to encrypt mnemonic")
    }

    // Generate seed
    const seedResponse = await generateSeed(mnemonic)
    if (!seedResponse.success) throw new Error("Failed to generate seed")
    const seed = seedResponse.data as Buffer
    const seedHex = seed.toString("hex")

    // Encrypt seed
    const encryptedSeedResponse = await encryptData(seedHex)
    if (!encryptedSeedResponse.success || !encryptedSeedResponse.encryptedData) {
      throw new Error("Failed to encrypt seed")
    }

    const walletData: WalletData = {
      mnemonic,
      encryptedMnemonic: encryptedMnemonicResponse.encryptedData,
      seed: seedHex,
      encryptedSeed: encryptedSeedResponse.encryptedData,
      accounts: {
        bitcoin: [],
        ethereum: [],
        solana: []
      }
    }

    // Generate keypairs for each coin type and wallet index
    const coins = ["bitcoin", "ethereum", "solana"] as const
    for (const coin of coins) {
      walletData.accounts[coin] = []
      for (let index = 0; index < numberOfWallets; index++) {
        const keypairResponse = await generateKeypair(seed, coin, index)
        if (!keypairResponse.success) continue

        const keypair = keypairResponse.data as SignKeyPair
        const encodedPrivateKeyResponse = await encodeSecretKey(keypair.secretKey)
        if (!encodedPrivateKeyResponse) continue

        const account: WalletAccount = {
          path: `${coin === "bitcoin" ? "m/44'/0'" : coin === "ethereum" ? "m/44'/60'" : "m/44'/501'"}/0'/${index}'`,
          publicKey: Buffer.from(keypair.publicKey).toString("hex"),
          privateKey: encodedPrivateKeyResponse as string
        }
        walletData.accounts[coin]?.push(account)
      }
    }

    // Create wallets directory if it doesn't exist
    const walletsDir = path.join(process.cwd(), "wallets")
    if (!fs.existsSync(walletsDir)) {
      fs.mkdirSync(walletsDir)
    }

    // Generate random ID for filename
    const fileId = crypto.randomBytes(8).toString("hex")
    const filePath = path.join(walletsDir, `wallet_${fileId}_${numberOfWallets}accounts.json`)

    // Save wallet data to file
    fs.writeFileSync(filePath, JSON.stringify(walletData, null, 2))
    console.log(`${numberOfWallets} wallet(s) saved to ${filePath}`)

  } catch (error) {
    console.error("Error generating wallets:", error)
  }
}

// Example: Generate 5 wallets for each coin type
generateWallets(3)
