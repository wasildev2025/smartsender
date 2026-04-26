import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { generateKeyPairSync } from 'node:crypto'

// Generate a fresh keypair for the test run so we never accidentally rely on
// the production key being present in the environment. Inject the PEMs into
// process.env BEFORE importing the module under test — the module reads env
// at import time when it caches the parsed key.
const { publicKey, privateKey } = generateKeyPairSync('ed25519', {
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
})

beforeAll(() => {
  process.env.SS_LICENSE_PRIVATE_KEY = privateKey
  process.env.SS_LICENSE_PUBLIC_KEY = publicKey
})

afterEach(() => {
  vi.useRealTimers()
})

// Late import so env is set before any module-level key cache populates.
const { signLicenseToken, verifyLicenseToken } = await import('@/lib/licenseSigning')

const baseClaims = {
  sub: 'lic_123',
  licenseKey: 'TEST-ABCD-1234',
  hwid: 'a'.repeat(48),
  deviceId: 'dev_abc',
  features: ['wa_send'],
  plan: 'pro',
  licenseExp: '2030-01-01T00:00:00.000Z',
}

describe('licenseSigning', () => {
  it('round-trips claims with the expected fields', async () => {
    const token = await signLicenseToken(baseClaims)
    const verified = await verifyLicenseToken(token)

    expect(verified.sub).toBe(baseClaims.sub)
    expect(verified.licenseKey).toBe(baseClaims.licenseKey)
    expect(verified.hwid).toBe(baseClaims.hwid)
    expect(verified.deviceId).toBe(baseClaims.deviceId)
    expect(verified.features).toEqual(baseClaims.features)
    expect(verified.plan).toBe(baseClaims.plan)
    expect(verified.licenseExp).toBe(baseClaims.licenseExp)
    expect(typeof verified.exp).toBe('number')
    expect(typeof verified.iat).toBe('number')
  })

  it('sets jti to deviceId so the token is bound to a specific device row', async () => {
    const token = await signLicenseToken(baseClaims)
    const verified = await verifyLicenseToken(token) as any
    expect(verified.jti).toBe(baseClaims.deviceId)
  })

  it('rejects tokens past their exp', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-01-01T00:00:00Z'))
    const token = await signLicenseToken(baseClaims, 60) // 60s TTL
    vi.setSystemTime(new Date('2025-01-01T00:02:00Z'))   // skip 2 minutes
    await expect(verifyLicenseToken(token)).rejects.toThrow()
  })

  it('rejects tokens with the wrong issuer', async () => {
    // Hand-craft a token with a different issuer to confirm verifyLicenseToken
    // pins iss/aud. We do this by signing through the same primitive but
    // overriding via a separate jose call.
    const { SignJWT, importPKCS8 } = await import('jose')
    const key = await importPKCS8(privateKey, 'EdDSA')
    const evil = await new SignJWT({ ...baseClaims })
      .setProtectedHeader({ alg: 'EdDSA' })
      .setIssuer('attacker.example')
      .setAudience('smartsender-desktop')
      .setIssuedAt()
      .setExpirationTime(Math.floor(Date.now() / 1000) + 60)
      .sign(key)
    await expect(verifyLicenseToken(evil)).rejects.toThrow()
  })

  it('rejects tokens signed with a different key', async () => {
    const other = generateKeyPairSync('ed25519', {
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
      publicKeyEncoding: { type: 'spki', format: 'pem' },
    })
    const { SignJWT, importPKCS8 } = await import('jose')
    const key = await importPKCS8(other.privateKey, 'EdDSA')
    const evil = await new SignJWT({ ...baseClaims })
      .setProtectedHeader({ alg: 'EdDSA' })
      .setIssuer('smartsender.app')
      .setAudience('smartsender-desktop')
      .setIssuedAt()
      .setExpirationTime(Math.floor(Date.now() / 1000) + 60)
      .sign(key)
    await expect(verifyLicenseToken(evil)).rejects.toThrow()
  })
})
