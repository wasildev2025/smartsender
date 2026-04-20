import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env from .env.local
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLicense() {
  console.log("Checking for any active license key...");

  try {
    const { data: verifyData, error: verifyError } = await supabase
      .from('licenses')
      .select('*')
      .eq('status', 'active')
      .limit(1);

    if (verifyError) {
      console.error('Error fetching licenses:', verifyError.message);
      return;
    }

    if (verifyData && verifyData.length > 0) {
      console.log('Success! Found an active license key in your database.');
      console.log('License Details:', JSON.stringify(verifyData[0], null, 2));
    } else {
      console.log('No active license keys found in the database.');
      console.log('Please insert one to test the desktop app:');
      console.log("INSERT INTO public.licenses (key, status) VALUES ('PRO-USER-123', 'active');");
    }

  } catch (err: any) {
    console.error('Unexpected error:', err.message);
  }
}

testLicense();
