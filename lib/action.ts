// lib/action.ts
'use server';

// GANTI BARIS INI: ambil dari file server kita sendiri, bukan dari library langsung
import { createClient } from '@/lib/supabase-server'; 
import { redirect } from 'next/navigation';

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  // Sekarang createClient() ini tidak akan error karena tidak butuh argumen lagi
  const supabase = await createClient();

  const username = formData.get('username') as string;
  const password = formData.get('password') as string;
  const redirectTo = (formData.get('redirectTo') as string) || '/';

  const email = username.includes('@') ? username : `${username}@toko.com`;

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        return 'Username atau Password salah.';
      }
      return error.message;
    }
  } catch (err) {
    return 'Terjadi kesalahan sistem.';
  }

  // Redirect harus di luar try-catch
  redirect(redirectTo);
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}