import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// StorageService persists to userData/app_data.enc. We mock electron's app
// to point at a fresh tmp dir per test, and provide a safeStorage stub that
// either round-trips or simulates an unavailable keychain.
let tmpDir: string
let encryptionAvailable = true

vi.mock('electron', () => ({
  app: { getPath: () => tmpDir },
  safeStorage: {
    isEncryptionAvailable: () => encryptionAvailable,
    encryptString: (s: string) => Buffer.from('ENC:' + s, 'utf-8'),
    decryptString: (b: Buffer) => {
      const t = b.toString('utf-8')
      if (!t.startsWith('ENC:')) throw new Error('not our cipher')
      return t.slice(4)
    },
  },
}))

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'ss-st-'))
  encryptionAvailable = true
})
afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true })
  vi.resetModules()
})

describe('StorageService', () => {
  it('returns empty defaults on a fresh disk', async () => {
    const { StorageService } = await import('../storage')
    const s = new StorageService()
    const d = await s.getDashboardData()
    expect(d).toEqual({ totalSent: 0, history: [] })
  })

  it('records and retrieves a campaign', async () => {
    const { StorageService } = await import('../storage')
    const s = new StorageService()
    await s.recordCampaign({
      id: 'c1', name: 'A', status: 'Completed', sent: 3, total: 3, date: '2025-01-01',
    })
    const d = await s.getDashboardData()
    expect(d?.history).toHaveLength(1)
    expect(d?.history[0]?.id).toBe('c1')
  })

  it('caps history at 50 entries', async () => {
    const { StorageService } = await import('../storage')
    const s = new StorageService()
    for (let i = 0; i < 60; i++) {
      await s.recordCampaign({
        id: `c${i}`, name: `Camp ${i}`, status: 'Completed', sent: 1, total: 1, date: '2025-01-01',
      })
    }
    const d = await s.getDashboardData()
    expect(d?.history.length).toBeLessThanOrEqual(50)
  })

  it('overwrites a campaign with the same id rather than duplicating', async () => {
    const { StorageService } = await import('../storage')
    const s = new StorageService()
    await s.recordCampaign({
      id: 'c1', name: 'A', status: 'Running', sent: 1, total: 5, date: '2025-01-01',
    })
    await s.recordCampaign({
      id: 'c1', name: 'A', status: 'Completed', sent: 5, total: 5, date: '2025-01-01',
    })
    const d = await s.getDashboardData()
    expect(d?.history).toHaveLength(1)
    expect(d?.history[0]?.status).toBe('Completed')
  })

  it('deleteCampaign removes the row and returns success', async () => {
    const { StorageService } = await import('../storage')
    const s = new StorageService()
    await s.recordCampaign({
      id: 'c1', name: 'A', status: 'Completed', sent: 1, total: 1, date: '2025-01-01',
    })
    const r = await s.deleteCampaign('c1')
    expect(r.success).toBe(true)
    const d = await s.getDashboardData()
    expect(d?.history).toHaveLength(0)
  })

  it('deleteCampaign with a missing id returns success:false', async () => {
    const { StorageService } = await import('../storage')
    const s = new StorageService()
    const r = await s.deleteCampaign('does-not-exist')
    expect(r.success).toBe(false)
  })

  it('persists totalSent across StorageService instances (encrypted at rest)', async () => {
    const { StorageService } = await import('../storage')
    const s1 = new StorageService()
    await s1.incrementTotalSent(7)
    // New instance reads from the same userData dir.
    const s2 = new StorageService()
    const d = await s2.getDashboardData()
    expect(d?.totalSent).toBe(7)
  })

  it('persists auto-responder rules across instances', async () => {
    const { StorageService } = await import('../storage')
    const s1 = new StorageService()
    await s1.setAutoResponderRules([
      { id: 'r1', keyword: 'hello', matchType: 'exact', replyText: 'hi' },
    ])
    const s2 = new StorageService()
    const rules = await s2.getAutoResponderRules()
    expect(rules).toHaveLength(1)
    expect(rules[0]?.keyword).toBe('hello')
  })

  it('writes a plaintext fallback when safeStorage is unavailable', async () => {
    encryptionAvailable = false
    const { StorageService } = await import('../storage')
    const s = new StorageService()
    await s.incrementTotalSent(1)
    // Re-read; the file should still load (just unencrypted).
    encryptionAvailable = false
    const s2 = new StorageService()
    const d = await s2.getDashboardData()
    expect(d?.totalSent).toBe(1)
  })
})
