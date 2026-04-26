import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// We mock the supabase admin client so the store can be exercised without a
// real database. The mock implements just enough of supabase-js's chain to
// drive every code path: select-by-key, insert, update, count, maybe-single.

type Row = Record<string, any>

class FakeQuery {
  private filters: Array<(r: Row) => boolean> = []
  private orderBy: { col: string; asc: boolean } | null = null
  private limitN: number | null = null
  private headOnly = false
  private wantSelect = false
  private wantCount = false
  private updatePatch: Row | null = null
  private insertRows: Row[] | null = null
  private deleteRows = false

  constructor(private store: FakeStore, private table: string) {}

  select(_cols?: string, opts?: { count?: 'exact'; head?: boolean }) {
    this.wantSelect = true
    if (opts?.count === 'exact') this.wantCount = true
    if (opts?.head) this.headOnly = true
    return this
  }
  eq(col: string, val: unknown) {
    this.filters.push(r => r[col] === val)
    return this
  }
  is(col: string, val: unknown) {
    if (val === null) this.filters.push(r => r[col] === null || r[col] === undefined)
    else this.filters.push(r => r[col] === val)
    return this
  }
  in(col: string, vals: unknown[]) {
    this.filters.push(r => vals.includes(r[col]))
    return this
  }
  order(col: string, opts?: { ascending: boolean }) {
    this.orderBy = { col, asc: opts?.ascending ?? true }
    return this
  }
  limit(n: number) {
    this.limitN = n
    return this
  }
  insert(rows: Row | Row[]) {
    this.insertRows = Array.isArray(rows) ? rows : [rows]
    return this
  }
  update(patch: Row) {
    this.updatePatch = patch
    return this
  }
  delete() {
    this.deleteRows = true
    return this
  }

  async maybeSingle() {
    const matches = this.applyFilters()
    if (matches.length === 0) return { data: null, error: null }
    return { data: matches[0], error: null }
  }
  async single() {
    const matches = this.applyFilters()
    return { data: matches[0] ?? null, error: matches[0] ? null : { message: 'no rows' } }
  }

  // The chain is awaited directly when we want bulk results / count / write.
  then(onFulfilled: (v: any) => any, onRejected?: (e: any) => any) {
    return this.execute().then(onFulfilled, onRejected)
  }

  private async execute() {
    const matches = this.applyFilters()
    if (this.insertRows) {
      const inserted: Row[] = []
      for (const r of this.insertRows) {
        const row = { id: this.store.nextId(), ...r }
        if (this.table === 'license_devices' && row.revoked_at == null) {
          // Simulate the unique-active-binding exclusion constraint.
          const conflict = this.store.tables.license_devices.find((x: Row) =>
            x.license_id === row.license_id && x.hwid === row.hwid && x.revoked_at == null,
          )
          if (conflict) {
            return { data: null, error: { message: 'exclusion conflict' } }
          }
        }
        this.store.tables[this.table].push(row)
        inserted.push(row)
      }
      return { data: this.wantSelect ? inserted[0] : null, error: null }
    }
    if (this.updatePatch) {
      for (const r of matches) Object.assign(r, this.updatePatch)
      return { data: matches, error: null }
    }
    if (this.deleteRows) {
      this.store.tables[this.table] = this.store.tables[this.table].filter(
        (r: Row) => !matches.includes(r),
      )
      return { data: matches, error: null }
    }
    if (this.wantCount) return { data: null, count: matches.length, error: null }
    return { data: matches, error: null }
  }

  private applyFilters(): Row[] {
    let rows = this.store.tables[this.table].slice()
    for (const f of this.filters) rows = rows.filter(f)
    if (this.orderBy) {
      const { col, asc } = this.orderBy
      rows.sort((a, b) => (a[col] < b[col] ? -1 : a[col] > b[col] ? 1 : 0) * (asc ? 1 : -1))
    }
    if (this.limitN != null) rows = rows.slice(0, this.limitN)
    return rows
  }
}

class FakeStore {
  tables: Record<string, Row[]> = { licenses: [], license_devices: [] }
  private idCounter = 0
  nextId() { this.idCounter += 1; return `id_${this.idCounter}` }
  from(table: string) { return new FakeQuery(this, table) }
}

let store: FakeStore

vi.mock('@/lib/supabase', () => ({
  get supabaseAdmin() { return store },
  get supabase() { return store },
}))

beforeEach(() => {
  store = new FakeStore()
})
afterEach(() => {
  vi.clearAllMocks()
})

const { lookupLicense, resolveDevice, revokeAllDevices, revokeDevice } = await import('@/lib/licenseStore')

function seedLicense(over: Partial<Row> = {}) {
  const lic = {
    id: 'lic_1',
    key: 'KEY-1',
    status: 'active',
    plan: 'pro',
    features: ['wa_send'],
    expires_at: '2099-01-01T00:00:00Z',
    seat_limit: 1,
    ...over,
  }
  store.tables.licenses.push(lic)
  return lic
}

describe('lookupLicense', () => {
  it('returns not_found when no license matches the key', async () => {
    const r = await lookupLicense('NOPE', 'hw1')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toBe('not_found')
  })

  it('returns revoked when license.status is revoked', async () => {
    seedLicense({ status: 'revoked' })
    const r = await lookupLicense('KEY-1', 'hw1')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toBe('revoked')
  })

  it('returns expired when expires_at is in the past', async () => {
    seedLicense({ expires_at: '2000-01-01T00:00:00Z' })
    const r = await lookupLicense('KEY-1', 'hw1')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toBe('expired')
  })

  it('binds a new device on first activation', async () => {
    seedLicense()
    const r = await lookupLicense('KEY-1', 'hw1')
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.isNewDevice).toBe(true)
      expect(r.deviceId).toBeTruthy()
    }
    expect(store.tables.license_devices).toHaveLength(1)
    expect(store.tables.license_devices[0].hwid).toBe('hw1')
  })

  it('reuses the same device row on subsequent activations from the same hwid', async () => {
    seedLicense()
    const a = await lookupLicense('KEY-1', 'hw1')
    const b = await lookupLicense('KEY-1', 'hw1')
    if (a.ok && b.ok) {
      expect(b.isNewDevice).toBe(false)
      expect(b.deviceId).toBe(a.deviceId)
    }
    expect(store.tables.license_devices).toHaveLength(1)
  })

  it('refuses a second device when seat_limit is 1', async () => {
    seedLicense({ seat_limit: 1 })
    await lookupLicense('KEY-1', 'hw1')
    const second = await lookupLicense('KEY-1', 'hw2')
    expect(second.ok).toBe(false)
    if (!second.ok) expect(second.reason).toBe('seat_limit_exceeded')
  })

  it('allows multiple devices up to seat_limit', async () => {
    seedLicense({ seat_limit: 3 })
    expect((await lookupLicense('KEY-1', 'hw1')).ok).toBe(true)
    expect((await lookupLicense('KEY-1', 'hw2')).ok).toBe(true)
    expect((await lookupLicense('KEY-1', 'hw3')).ok).toBe(true)
    expect((await lookupLicense('KEY-1', 'hw4')).ok).toBe(false)
  })

  it('rejects an hwid that has a revoked device row (cannot self-rehabilitate)', async () => {
    seedLicense()
    const first = await lookupLicense('KEY-1', 'hw1')
    expect(first.ok).toBe(true)
    if (!first.ok) return

    await revokeDevice(first.deviceId)

    // Same hwid retries — must stay rejected even though seat is now free.
    const retry = await lookupLicense('KEY-1', 'hw1')
    expect(retry.ok).toBe(false)
    if (!retry.ok) expect(retry.reason).toBe('revoked')
  })

  it('lets a different hwid bind after a revoke (seat freed)', async () => {
    seedLicense({ seat_limit: 1 })
    const first = await lookupLicense('KEY-1', 'hw1')
    if (!first.ok) throw new Error('first failed')
    await revokeDevice(first.deviceId)

    const newDevice = await lookupLicense('KEY-1', 'hw2')
    expect(newDevice.ok).toBe(true)
    if (newDevice.ok) expect(newDevice.isNewDevice).toBe(true)
  })
})

describe('resolveDevice', () => {
  it('returns not_found for unknown ids', async () => {
    const r = await resolveDevice('missing', 'hw1')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toBe('not_found')
  })

  it('returns revoked for soft-deleted devices', async () => {
    seedLicense()
    const bind = await lookupLicense('KEY-1', 'hw1')
    if (!bind.ok) throw new Error('bind failed')
    await revokeDevice(bind.deviceId)
    const r = await resolveDevice(bind.deviceId, 'hw1')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toBe('revoked')
  })

  it('returns hwid_mismatch when the calling hwid does not match the bound row', async () => {
    seedLicense()
    const bind = await lookupLicense('KEY-1', 'hw1')
    if (!bind.ok) throw new Error('bind failed')
    const r = await resolveDevice(bind.deviceId, 'hw-attacker')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toBe('hwid_mismatch')
  })
})

describe('revokeAllDevices', () => {
  it('revokes every active binding for a license', async () => {
    seedLicense({ seat_limit: 5 })
    await lookupLicense('KEY-1', 'hw1')
    await lookupLicense('KEY-1', 'hw2')
    await lookupLicense('KEY-1', 'hw3')

    const r = await revokeAllDevices('lic_1')
    expect(r.revoked).toBe(3)
    expect(store.tables.license_devices.every(d => d.revoked_at != null)).toBe(true)
  })
})
