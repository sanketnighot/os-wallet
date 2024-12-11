import { generateMnemonicForUser, generateSeed } from "./wallet"
import { encryptData } from "./cryptography"
import fs from "fs"
import path from "path"
import crypto from "crypto"
import { deriveBitcoinPrivateKey } from "./wallet/bitcoinwallet"
import { deriveEthereumWallet } from "./wallet/ethereumwallet"
import { deriveSolanaWallet } from "./wallet/solanawallet"
import { Wallet } from "ethers6"

interface WalletAccount {
  path: string
  publicKey: string
  privateKey: string
  address: string
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
    // const mnemonicResponse = await generateMnemonicForUser()
    const mnemonic = "hunt immense obey lemon laugh potato eight left alley correct lift venture robust deposit absorb easy logic radio bubble box nest betray erupt discover"
    // if (!mnemonicResponse.success) throw new Error("Failed to generate mnemonic")
    // const mnemonic = mnemonicResponse.data

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

    // Generate wallets for each coin type
    for (let index = 0; index < numberOfWallets; index++) {
      // Bitcoin wallet
      const bitcoinPath = `m/84'/0'/0'/0/${index}`
      const bitcoinWallet = deriveBitcoinPrivateKey(seed, bitcoinPath)
      walletData.accounts.bitcoin?.push({
        path: bitcoinPath,
        publicKey: bitcoinWallet.publicKey,
        privateKey: bitcoinWallet.privateKey,
        address: bitcoinWallet.publicKey
      })

      // Ethereum wallet
      const ethereumPath = `m/44'/60'/0'/0/${index}`
      const ethereumWallet = deriveEthereumWallet(seed, ethereumPath) as Wallet
      walletData.accounts.ethereum?.push({
        path: ethereumPath,
        publicKey: ethereumWallet.signingKey.publicKey.slice(2), // Remove '0x' prefix
        privateKey: ethereumWallet.signingKey.privateKey.slice(2), // Remove '0x' prefix
        address: ethereumWallet.address
      })

      // Solana wallet
      const solanaPath = `m/44'/501'/0'/0'/${index}'`
      const solanaWallet = deriveSolanaWallet(seed, solanaPath)
      walletData.accounts.solana?.push({
        path: solanaPath,
        publicKey: Buffer.from(solanaWallet.secretKey.slice(32)).toString('hex'),
        privateKey: Buffer.from(solanaWallet.secretKey).toString('hex'),
        address: solanaWallet.publicKey.toBase58()
      })
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
    console.log(`Generated ${numberOfWallets} wallet(s) for each coin type:`)
    console.log(`Bitcoin addresses: ${walletData.accounts.bitcoin?.map(w => w.address).join(', ')}`)
    console.log(`Ethereum addresses: ${walletData.accounts.ethereum?.map(w => w.address).join(', ')}`)
    console.log(`Solana addresses: ${walletData.accounts.solana?.map(w => w.address).join(', ')}`)
    console.log(`Wallet data saved to ${filePath}`)

  } catch (error) {
    console.error("Error generating wallets:", error)
  }
}

// Generate wallets
generateWallets(3)
