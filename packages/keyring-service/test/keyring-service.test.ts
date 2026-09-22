import { describe, expect, it, vi } from 'vitest'

import { KeyringService } from '../src/keyring-service'

const password = 'correct horse battery staple'
const boostValue = 'secure_existing_boost_value'
const legacyBooted = JSON.stringify({
  data: 'legacy-ciphertext',
  iv: 'legacy-iv',
  salt: 'legacy-salt',
})
const legacyVault = JSON.stringify({
  data: 'legacy-vault-ciphertext',
  iv: 'legacy-vault-iv',
  salt: 'legacy-vault-salt',
})

describe('KeyringService booted KDF migration', () => {
  it('clears keyring secrets before locking', async () => {
    const service = new KeyringService()
    const clearSensitiveData = vi.fn()
    await service.init({
      storage: { get: vi.fn(), set: vi.fn() } as any,
      encryptor: { decrypt: vi.fn(), encrypt: vi.fn() },
      logger: { debug: vi.fn(), info: vi.fn(), error: vi.fn() },
      t: (key: string) => key,
    })
    service.keyrings = [{ clearSensitiveData } as any]

    await service.setLocked()

    expect(clearSensitiveData).toHaveBeenCalledTimes(1)
    expect(service.keyrings).toEqual([])
  })

  it('re-encrypts a legacy booted payload after validating the password', async () => {
    const storage = {
      get: vi.fn().mockResolvedValue({ booted: legacyBooted, vault: null, boostValue }),
      set: vi.fn().mockResolvedValue(undefined),
    }
    const encryptor = {
      decrypt: vi.fn().mockResolvedValue(boostValue),
      encrypt: vi.fn().mockResolvedValue(
        JSON.stringify({ data: 'current-ciphertext', iv: 'current-iv', salt: 'current-salt', iterations: 600000 })
      ),
    }
    const logger = { debug: vi.fn(), info: vi.fn(), error: vi.fn() }
    const service = new KeyringService()

    await service.init({ storage: storage as any, encryptor, logger, t: (key: string) => key })
    await service.submitPassword(password)

    expect(encryptor.decrypt).toHaveBeenCalledWith(password, legacyBooted)
    expect(encryptor.encrypt).toHaveBeenCalledWith(password, boostValue)
    expect(JSON.parse(service.store.getState().booted)).toMatchObject({ iterations: 600000 })
  })

  it('does not rewrite a booted payload that already declares its KDF iterations', async () => {
    const currentBooted = JSON.stringify({
      data: 'current-ciphertext',
      iv: 'current-iv',
      salt: 'current-salt',
      iterations: 600000,
    })
    const storage = {
      get: vi.fn().mockResolvedValue({ booted: currentBooted, vault: null, boostValue }),
      set: vi.fn().mockResolvedValue(undefined),
    }
    const encryptor = {
      decrypt: vi.fn().mockResolvedValue(boostValue),
      encrypt: vi.fn(),
    }
    const service = new KeyringService()

    await service.init({
      storage: storage as any,
      encryptor,
      logger: { debug: vi.fn(), info: vi.fn(), error: vi.fn() },
      t: (key: string) => key,
    })
    await service.submitPassword(password)

    expect(encryptor.encrypt).not.toHaveBeenCalled()
  })

  it('does not rewrite a legacy payload when password validation fails', async () => {
    const storage = {
      get: vi.fn().mockResolvedValue({ booted: legacyBooted, vault: null, boostValue }),
      set: vi.fn().mockResolvedValue(undefined),
    }
    const encryptor = {
      decrypt: vi.fn().mockRejectedValue(new Error('Incorrect password')),
      encrypt: vi.fn(),
    }
    const service = new KeyringService()

    await service.init({
      storage: storage as any,
      encryptor,
      logger: { debug: vi.fn(), info: vi.fn(), error: vi.fn() },
      t: (key: string) => key,
    })

    await expect(service.submitPassword(password)).rejects.toThrow('password_error')
    expect(encryptor.encrypt).not.toHaveBeenCalled()
    expect(service.store.getState().booted).toBe(legacyBooted)
  })

  it('re-encrypts a legacy vault after successfully unlocking it', async () => {
    const storage = {
      get: vi.fn().mockResolvedValue({ booted: legacyBooted, vault: legacyVault, boostValue }),
      set: vi.fn().mockResolvedValue(undefined),
    }
    const encryptor = {
      decrypt: vi.fn().mockResolvedValueOnce(boostValue).mockResolvedValueOnce([]),
      encrypt: vi
        .fn()
        .mockResolvedValueOnce(
          JSON.stringify({ data: 'current-booted', iv: 'current-iv', salt: 'current-salt', iterations: 600000 })
        )
        .mockResolvedValueOnce(
          JSON.stringify({ data: 'current-vault', iv: 'current-iv', salt: 'current-salt', iterations: 600000 })
        ),
    }
    const service = new KeyringService()

    await service.init({
      storage: storage as any,
      encryptor,
      logger: { debug: vi.fn(), info: vi.fn(), error: vi.fn() },
      t: (key: string) => key,
    })
    await service.submitPassword(password)

    expect(encryptor.decrypt).toHaveBeenCalledWith(password, legacyVault)
    expect(encryptor.encrypt).toHaveBeenLastCalledWith(password, [])
    expect(JSON.parse(service.store.getState().vault!)).toMatchObject({ iterations: 600000 })
  })
})
