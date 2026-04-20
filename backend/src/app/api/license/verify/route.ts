import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  try {
    const { licenseKey, machineId } = await request.json();

    if (!licenseKey || !machineId) {
      return NextResponse.json(
        { valid: false, message: 'License key and Machine ID are required' },
        { status: 400 }
      );
    }

    // Use Admin client to handle binding and bypass RLS
    const supabase = await createAdminClient();

    // Query the licenses table
    const { data: license, error } = await supabase
      .from('licenses')
      .select('*')
      .eq('key', licenseKey)
      .single();

    if (error || !license) {
      return NextResponse.json(
        { valid: false, message: 'Invalid license key' },
        { status: 404 }
      );
    }

    // Check status
    if (license.status !== 'active') {
      return NextResponse.json(
        { valid: false, message: `License is ${license.status}` },
        { status: 403 }
      );
    }

    // Check expiration
    if (license.expires_at && new Date(license.expires_at) < new Date()) {
      return NextResponse.json(
        { valid: false, message: 'License has expired' },
        { status: 403 }
      );
    }

    // --- MACHINE BINDING LOGIC ---
    if (!license.machine_id) {
      // First time use: Bind current machine ID
      const { error: bindError } = await supabase
        .from('licenses')
        .update({ machine_id: machineId })
        .eq('id', license.id);

      if (bindError) {
        console.error('HWID Bind Error:', bindError.message);
        return NextResponse.json(
          { valid: false, message: 'Failed to bind device to license' },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        valid: true,
        message: 'License activated and locked to this device.',
        expires_at: license.expires_at
      });
    }

    // Subsequent use: Validate machine ID
    if (license.machine_id !== machineId) {
      return NextResponse.json(
        { 
          valid: false, 
          message: 'Device Mismatch: This license is locked to another computer.',
          code: 'DEVICE_MISMATCH'
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      valid: true,
      message: 'License verified',
      expires_at: license.expires_at
    });

  } catch (error: any) {
    console.error('License verification error:', error);
    return NextResponse.json(
      { valid: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

