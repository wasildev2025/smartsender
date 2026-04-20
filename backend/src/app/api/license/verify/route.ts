import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { licenseKey } = await request.json();

    if (!licenseKey) {
      return NextResponse.json(
        { valid: false, message: 'License key is required' },
        { status: 400 }
      );
    }

    // Query the licenses table
    const { data, error } = await supabase
      .from('licenses')
      .select('*')
      .eq('key', licenseKey)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { valid: false, message: 'Invalid license key' },
        { status: 404 }
      );
    }

    // Check status
    if (data.status !== 'active') {
      return NextResponse.json(
        { valid: false, message: `License is ${data.status}` },
        { status: 403 }
      );
    }

    // Check expiration
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return NextResponse.json(
        { valid: false, message: 'License has expired' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      valid: true,
      message: 'License is valid',
      expires_at: data.expires_at
    });

  } catch (error: any) {
    console.error('License verification error:', error);
    return NextResponse.json(
      { valid: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
