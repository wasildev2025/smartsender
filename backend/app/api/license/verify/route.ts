import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { licenseKey } = await request.json();

    if (!licenseKey) {
      return NextResponse.json({ valid: false, message: 'License key is required' }, { status: 400 });
    }

    // TODO: Connect to Supabase to verify the license key.
    // For now, mock the verification logic.
    if (licenseKey.startsWith('VALID_')) {
      return NextResponse.json({
        valid: true,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // +30 days
        features: ['whatsapp_core', 'group_automation', 'extractors']
      });
    }

    return NextResponse.json({ valid: false, message: 'Invalid license key' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ valid: false, message: 'Internal server error' }, { status: 500 });
  }
}
