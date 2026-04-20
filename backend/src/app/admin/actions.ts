'use server'

import { createClient, createAdminClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    redirect('/admin/login?error=' + encodeURIComponent(error.message))
  }

  revalidatePath('/admin', 'layout')
  redirect('/admin')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/admin/login')
}

export async function createLicense(formData: FormData) {
  const supabase = await createAdminClient()
  
  // Get custom key or generate one
  let key = formData.get('key') as string;
  if (!key || key.trim() === '') {
    const randomChars = () => Math.random().toString(36).substring(2, 6).toUpperCase();
    key = `VIP-${randomChars()}-${randomChars()}`;
  }
  
  // Get custom duration
  const daysString = formData.get('days') as string;
  const days = daysString ? parseInt(daysString) : 365; // Default to 1 year if not specified
  
  const expires_at = new Date();
  expires_at.setDate(expires_at.getDate() + days);

  const { error } = await supabase
    .from('licenses')
    .insert([
      { 
        key: key.trim(), 
        status: 'active', 
        expires_at: expires_at.toISOString()
      }
    ])

  if (error) {
    console.error('Error creating license:', error)
  }

  revalidatePath('/admin')
}


export async function updateLicenseStatus(id: string, status: string) {
  try {
    const supabase = await createAdminClient()

    const { error } = await supabase
      .from('licenses')
      .update({ status })
      .eq('id', id)

    if (error) {
      console.error(`Error updating license ${id} to ${status}:`, error.message)
      throw new Error(`Failed to update license: ${error.message}`)
    }

    revalidatePath('/admin')
  } catch (err: any) {
    console.error('updateLicenseStatus catastrophic failure:', err)
  }
}

export async function deleteLicense(id: string) {
  const supabase = await createAdminClient()

  const { error } = await supabase
    .from('licenses')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting license:', error)
  }

  revalidatePath('/admin')
}

export async function resetMachineIdAction(id: string) {
  const supabase = await createAdminClient()

  const { error } = await supabase
    .from('licenses')
    .update({ machine_id: null })
    .eq('id', id)

  if (error) {
    console.error('Error resetting machine ID:', error)
  }

  revalidatePath('/admin')
}


