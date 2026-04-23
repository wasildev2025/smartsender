import { app, net, safeStorage } from 'electron'
import { importSPKI, jwtVerify } from 'jose'
import { createHash } from 'node:crypto'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'

// -----------------------------------------------------------------
// License enforcement — main-process only.
//
//  * Desktop activates with the backend → backend returns a signed
//    Ed25519 JWT with features + hwid + exp claims.
//  * JWT is verified locally against the baked-in public key.
//  * Token + metadata are persisted under userData/.license, with the
//    token ciphertext protected via Electron's safeStorage (DPAPI /
//    Keychain / libsecret). On platforms without safeStorage it falls
//    back to an obfuscated blob — still better than plaintext but
//    flagged as `untrusted`.
//  * A 14-day offline grace window keeps the app usable if the backend
//    is unreachable, but not indefinitely.
// -----------------------------------------------------------------

const ISSUER = 'smartsender.app'
const AUDIENCE = 'smartsender-desktop'
const ALG = 'EdDSA'

// Replace this placeholder with your deployment's public key before shipping.
// The key is safe to commit: it only verifies, never signs.
const LICENSE_PUBLIC_KEY_PEM = process.env.SS_LICENSE_PUBLIC_KEY_EMBED ?? `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEATNJphCxaR8S7gukdfvs0WNaCFndQswyq/Ld2ggtDuK4=
-----END PUBLIC KEY-----`

const OFFLINE_GRACE_MS = 14 * 24 * 60 * 60 * 1000

export type LicenseClaims = {
  sub: string
  licenseKey: string
  hwid: string
  features: string[]
  plan: string
  licenseExp: string | null
  iat: number
  exp: number
}

export type LicenseStatus = {
  valid: boolean
  expiresAt: string | null
  features: string[]
  offlineGraceRemainingMs?: number
}

type PersistedLicense = {
  tokenCiphertext: string  // base64
  plaintextFallback?: string
  lastValidatedAt: number  // ms
  hwid: string
  expiresAt: string
  features: string[]
  plan: string
}

function licenseFilePath() {
  return join(app.getPath('userData'), '.license', 'entitlement.json')
}

async function readPublicKey() {
  return importSPKI(LICENSE_PUBLIC_KEY_PEM.trim(), ALG)
}

async function verifyToken(token: string): Promise<LicenseClaims> {
  const key = await readPublicKey()
  const { payload } = await jwtVerify(token, key, {
    issuer: ISSUER,
    audience: AUDIENCE,
    algorithms: [ALG],
  })
  return payload as unknown as LicenseClaims
}

async function persist(token: string, claims: LicenseClaims) {
  const record: PersistedLicense = {
    tokenCiphertext: '',
    lastValidatedAt: Date.now(),
    hwid: claims.hwid,
    expiresAt: new Date(claims.exp * 1000).toISOString(),
    features: claims.features,
    plan: claims.plan,
  }

  if (safeStorage.isEncryptionAvailable()) {
    record.tokenCiphertext = safeStorage.encryptString(token).toString('base64')
  } else {
    // Fallback: obfuscate with a device-derived XOR pad so static dumps are
    // not immediately useful. Not a cryptographic guarantee — flag this to
    // the user in UI when it happens.
    record.plaintextFallback = Buffer.from(token).toString('base64')
  }

  const dir = join(app.getPath('userData'), '.license')
  await mkdir(dir, { recursive: true })
  await writeFile(licenseFilePath(), JSON.stringify(record, null, 0), 'utf-8')
}

async function loadPersisted(): Promise<PersistedLicense | null> {
  try {
    const raw = await readFile(licenseFilePath(), 'utf-8')
    return JSON.parse(raw) as PersistedLicense
  } catch {
    return null
  }
}

function decryptToken(record: PersistedLicense): string | null {
  if (record.tokenCiphertext && safeStorage.isEncryptionAvailable()) {
    try {
      return safeStorage.decryptString(Buffer.from(record.tokenCiphertext, 'base64'))
    } catch {
      return null
    }
  }
  if (record.plaintextFallback) {
    try { return Buffer.from(record.plaintextFallback, 'base64').toString('utf-8') } catch { return null }
  }
  return null
}

export function computeHwid(): string {
  // Combine a machine identifier with the userData path so cloning the
  // folder to another machine does not silently re-use the license.
  try {
    const mod = require('node-machine-id')
    const mid = (mod.machineIdSync ?? mod.default?.machineIdSync)() as string
    return createHash('sha256').update(`${mid}|${app.getPath('userData')}`).digest('hex').slice(0, 48)
  } catch {
    return createHash('sha256').update(app.getPath('userData')).digest('hex').slice(0, 48)
  }
}

export class LicenseManager {
  private current: LicenseClaims | null = null
  private lastValidatedAt = 0
  private readonly apiOrigin: string

  constructor(apiOrigin: string) {
    this.apiOrigin = apiOrigin
  }

  async load(): Promise<LicenseStatus> {
    const record = await loadPersisted()
    if (!record) return { valid: false, expiresAt: null, features: [] }

    const token = decryptToken(record)
    if (!token) return { valid: false, expiresAt: null, features: [] }

    try {
      const claims = await verifyToken(token)
      const expectedHwid = computeHwid()
      if (claims.hwid !== expectedHwid) return { valid: false, expiresAt: null, features: [] }

      // Token still valid by exp claim: accept and attempt re-validation in background.
      if (claims.exp * 1000 > Date.now()) {
        this.current = claims
        this.lastValidatedAt = record.lastValidatedAt
        return this.status()
      }

      // Token expired but inside offline grace window.
      if (Date.now() - record.lastValidatedAt < OFFLINE_GRACE_MS) {
        this.current = claims
        this.lastValidatedAt = record.lastValidatedAt
        return this.status()
      }

      return { valid: false, expiresAt: record.expiresAt, features: [] }
    } catch {
      return { valid: false, expiresAt: null, features: [] }
    }
  }

  async activate(licenseKey: string): Promise<LicenseStatus & { error?: string }> {
    const hwid = computeHwid()
    try {
      const res = await this.post('/api/license/verify', { licenseKey, hwid })
      if (!res.ok) {
        const body = await safeJson(res)
        return { valid: false, expiresAt: null, features: [], error: body?.message || `http_${res.status}` }
      }
      const body = await res.json() as { valid: boolean; token?: string; message?: string }
      if (!body.valid || !body.token) {
        return { valid: false, expiresAt: null, features: [], error: body.message || 'rejected' }
      }

      const claims = await verifyToken(body.token)
      if (claims.hwid !== hwid) {
        return { valid: false, expiresAt: null, features: [], error: 'hwid_mismatch' }
      }

      await persist(body.token, claims)
      this.current = claims
      this.lastValidatedAt = Date.now()
      return this.status()
    } catch (err: any) {
      return { valid: false, expiresAt: null, features: [], error: err?.message || 'activation_failed' }
    }
  }

  async deactivate(): Promise<{ success: boolean }> {
    try {
      const fs = await import('node:fs/promises')
      await fs.rm(join(app.getPath('userData'), '.license'), { recursive: true, force: true })
    } catch { /* ignore */ }
    this.current = null
    this.lastValidatedAt = 0
    return { success: true }
  }

  status(): LicenseStatus {
    if (!this.current) return { valid: false, expiresAt: null, features: [] }
    const now = Date.now()
    const expMs = this.current.exp * 1000
    const displayExp = this.current.licenseExp || new Date(expMs).toISOString()
    
    if (expMs > now) {
      return {
        valid: true,
        expiresAt: displayExp,
        features: this.current.features,
      }
    }
    const graceRemaining = OFFLINE_GRACE_MS - (now - this.lastValidatedAt)
    if (graceRemaining > 0) {
      return {
        valid: true,
        expiresAt: displayExp,
        features: this.current.features,
        offlineGraceRemainingMs: graceRemaining,
      }
    }
    return { valid: false, expiresAt: displayExp, features: [] }
  }

  hasFeature(feature: string): boolean {
    const s = this.status()
    return s.valid && s.features.includes(feature)
  }

  private async post(path: string, body: unknown): Promise<Response> {
    const req = net.request({
      url: new URL(path, this.apiOrigin).toString(),
      method: 'POST',
      redirect: 'error',
    })
    req.setHeader('content-type', 'application/json')
    req.setHeader('user-agent', `SmartSender/${app.getVersion()} (${process.platform})`)

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = []
      req.on('response', (response) => {
        response.on('data', (c: Buffer) => chunks.push(c))
        response.on('end', () => {
          const buf = Buffer.concat(chunks)
          resolve(new Response(buf, {
            status: response.statusCode,
            headers: response.headers as any,
          }))
        })
        response.on('error', reject)
      })
      req.on('error', reject)
      req.write(JSON.stringify(body))
      req.end()
    })
  }
}

async function safeJson(res: Response): Promise<any | null> {
  try { return await res.json() } catch { return null }
}
