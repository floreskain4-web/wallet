import {
  ECPairInterface,
  bitcoin,
  eccManager,
  signMessageOfDeterministicECDSA,
  tweakSigner,
  verifyMessageOfECDSA,
} from '@unisat/wallet-bitcoin'
import { isTaprootInput } from 'bitcoinjs-lib/src/psbt/bip371.js'
import { decode } from 'bs58check'
import { EventEmitter } from 'events'
import { ToSignInput } from '../types'
import { deriveContextHash, parseHexContext } from './derive-context-hash'

const type = 'Simple Key Pair'

export type SimpleKeyringAccount =
  | string
  | {
      privateKey: string
      compressed: boolean
    }

export class SimpleKeyring extends EventEmitter {
  static type = type
  type = type
  network: bitcoin.Network = bitcoin.networks.bitcoin
  wallets: ECPairInterface[] = []

  constructor(opts?: any) {
    super()
    if (opts) {
      this.deserialize(opts)
    }
  }

  async serialize(): Promise<any> {
    return this.wallets.map(wallet =>
      wallet.compressed
        ? wallet.privateKey?.toString('hex')
        : { privateKey: wallet.privateKey?.toString('hex'), compressed: false }
    )
  }

  async deserialize(opts: any) {
    const privateKeys = opts as SimpleKeyringAccount[]

    this.wallets = privateKeys.map(account => {
      const key = typeof account === 'string' ? account : account.privateKey
      const compressedOverride = typeof account === 'string' ? undefined : account.compressed
      let buf: Buffer
      let decoded: Uint8Array | undefined
      let compressed: boolean
      if (key.length === 64) {
        // privateKey
        buf = Buffer.from(key, 'hex')
        compressed = compressedOverride ?? true
      } else {
        // WIF: version (1 byte) || private key (32 bytes) || optional compression marker (0x01).
        decoded = decode(key)
        if (decoded.length === 33) {
          compressed = false
        } else if (decoded.length === 34 && decoded[33] === 0x01) {
          compressed = true
        } else {
          throw new Error('Invalid WIF private key')
        }
        buf = Buffer.from(decoded.slice(1, 33))
        compressed = compressedOverride ?? compressed
      }

      try {
        // ECPair retains this buffer while unlocked, so it must not share the
        // temporary decoding buffer that is cleared below.
        const privateKey = Buffer.from(buf)
        return eccManager.eccPair.fromPrivateKey(privateKey as any, { compressed })
      } finally {
        buf.fill(0)
        decoded?.fill(0)
      }
    })
  }

  async addAccounts(n = 1) {
    const newWallets: ECPairInterface[] = []
    for (let i = 0; i < n; i++) {
      newWallets.push(eccManager.eccPair.makeRandom())
    }
    this.wallets = this.wallets.concat(newWallets)
    const hexWallets = newWallets.map(({ publicKey }) => publicKey.toString('hex'))
    return hexWallets
  }

  async getAccounts() {
    return this.wallets.map(({ publicKey }) => publicKey.toString('hex'))
  }

  async signTransaction(psbt: bitcoin.Psbt, inputs: ToSignInput[], opts?: any) {
    inputs.forEach(input => {
      const keyPair = this._getPrivateKeyFor(input.publicKey)
      if (isTaprootInput(psbt.data.inputs[input.index] as any)) {
        let signer: bitcoin.Signer = keyPair
        let tweak = true // default to use tweaked signer
        if (typeof input.useTweakedSigner === 'boolean') {
          tweak = input.useTweakedSigner
        } else if (typeof input.disableTweakSigner === 'boolean') {
          tweak = !input.disableTweakSigner
        }

        if (tweak) {
          signer = tweakSigner(keyPair, opts)
        }
        psbt.signTaprootInput(
          input.index,
          signer,
          input.tapLeafHashToSign as any,
          input.sighashTypes
        )
      } else {
        let signer: bitcoin.Signer = keyPair
        let tweak = false // default not to use tweaked signer
        if (typeof input.useTweakedSigner === 'boolean') {
          tweak = input.useTweakedSigner
        }
        if (tweak) {
          signer = tweakSigner(keyPair, opts)
        }
        psbt.signInput(input.index, signer, input.sighashTypes)
      }
    })
    return psbt
  }

  async signMessage(publicKey: string, text: string) {
    const keyPair = this._getPrivateKeyFor(publicKey)
    return signMessageOfDeterministicECDSA(keyPair, text)
  }

  async verifyMessage(publicKey: string, text: string, sig: string) {
    return verifyMessageOfECDSA(publicKey, text, sig)
  }

  private _getPrivateKeyFor(publicKey: string) {
    if (!publicKey) {
      throw new Error('Must specify publicKey.')
    }
    const wallet = this._getWalletForAccount(publicKey)
    return wallet
  }

  async exportAccount(publicKey: string) {
    const wallet = this._getWalletForAccount(publicKey)
    return wallet.privateKey?.toString('hex')
  }

  clearSensitiveData() {
    for (const wallet of this.wallets) {
      wallet.privateKey?.fill(0)
    }
    this.wallets = []
  }

  removeAccount(publicKey: string) {
    if (!this.wallets.map(wallet => wallet.publicKey.toString('hex')).includes(publicKey)) {
      throw new Error(`PublicKey ${publicKey} not found in this keyring`)
    }

    this._getWalletForAccount(publicKey).privateKey?.fill(0)
    this.wallets = this.wallets.filter(wallet => wallet.publicKey.toString('hex') !== publicKey)
  }

  async deriveContextHash(
    publicKey: string,
    appName: string,
    canonicalNetworkName: string,
    context: string,
  ): Promise<string> {
    const wallet = this._getWalletForAccount(publicKey)
    if (!wallet.privateKey) {
      throw new Error('deriveContextHash requires access to the private key')
    }
    const contextBytes = parseHexContext(context)
    const pubkeyBytes = Uint8Array.from(Buffer.from(publicKey, 'hex'))
    const privKeyBytes = new Uint8Array(wallet.privateKey)
    try {
      return deriveContextHash(privKeyBytes, appName, canonicalNetworkName, pubkeyBytes, contextBytes)
    } finally {
      privKeyBytes.fill(0)
    }
  }

  private _getWalletForAccount(publicKey: string) {
    let wallet = this.wallets.find(wallet => wallet.publicKey.toString('hex') == publicKey)
    if (!wallet) {
      throw new Error('Simple Keyring - Unable to find matching publicKey.')
    }
    return wallet
  }
}
