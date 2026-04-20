import { NextResponse } from 'next/server';
import { z } from 'zod';
import { signLicenseToken } from '@/lib/licenseSigning';
import { lookupLicense } from '@/lib/licenseStore';
import { rateLimit, ipFromRequest } from '@/lib/rateLimit';

const BodySchema = z.object({
  licenseKey: z.string().trim().min(8).max(128).regex(/^[A-Za-z0-9_\-]+$/),
  hwid: z.string().trim().min(8).max(128).regex(/^[A-Za-z0-9:_\-]+$/),
});

export async function POST(request: Request) {
  try {
    const ip = ipFromRequest(request);
    const limited = rateLimit(`lic:${ip}`, 20, 0.2); // ~12 req/min burst to 20
    if (!limited.ok) {
      return NextResponse.json(
        { valid: false, message: 'rate_limited' },
        { status: 429, headers: { 'Retry-After': Math.ceil(limited.retryAfterMs / 1000).toString() } },
      );
    }

    const body = BodySchema.safeParse(await request.json().catch(() => ({})));
    if (!body.success) {
      return NextResponse.json({ valid: false, message: 'invalid_request' }, { status: 400 });
    }

    const { licenseKey, hwid } = body.data;

    // Per-key rate limit (credential stuffing mitigation).
    const perKey = rateLimit(`lic-key:${licenseKey}`, 10, 0.05); // 3/min
    if (!perKey.ok) {
      return NextResponse.json({ valid: false, message: 'rate_limited' }, { status: 429 });
    }

    const result = await lookupLicense(licenseKey, hwid);
    if (!result.ok) {
      return NextResponse.json({ valid: false, message: result.reason }, { status: 401 });
    }

    const row = result.row;

    if (row.boundHwids.length > 0 && !row.boundHwids.includes(hwid) && row.boundHwids.length >= row.seatLimit) {
      return NextResponse.json({ valid: false, message: 'seat_limit_exceeded' }, { status: 403 });
    }

    const token = await signLicenseToken({
      sub: row.id,
      licenseKey: licenseKey.slice(-4),
      hwid,
      features: row.features,
      plan: row.plan,
    });

    return NextResponse.json({
      valid: true,
      token,
      serverTime: new Date().toISOString(),
      expiresAt: row.expiresAt,
      features: row.features,
      plan: row.plan,
    });
  } catch (err) {
    console.error('license/verify error', err);
    return NextResponse.json({ valid: false, message: 'internal_error' }, { status: 500 });
  }
}
