import { describe, expect, it, vi } from 'vitest'

vi.mock('@babylonlabs-io/babylon-proto-ts', () => ({ incentivequery: {} }))

import { CosmosKeyring } from '../src/cosmos/CosmosKeyring'

describe('CosmosKeyring', () => {
  it('zeros cached signer and transaction bytes on destroy', () => {
    const privateKey = new Uint8Array(32).fill(1)
    const bodyBytes = new Uint8Array([1, 2, 3])
    const authInfoBytes = new Uint8Array([4, 5, 6])
    const keyring = new CosmosKeyring({
      key: {} as any,
      signer: { privkey: privateKey } as any,
      client: {} as any,
      provider: {} as any,
      chainId: 'test-chain',
    })
    Object.assign(keyring as any, {
      _signDoc_bodyBytes: bodyBytes,
      _signDoc_authInfoBytes: authInfoBytes,
    })

    keyring.destroy()

    expect([...privateKey]).toEqual(new Array(32).fill(0))
    expect([...bodyBytes]).toEqual(new Array(3).fill(0))
    expect([...authInfoBytes]).toEqual(new Array(3).fill(0))
  })
})
