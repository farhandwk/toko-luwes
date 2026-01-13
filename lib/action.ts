// lib/action.ts
'use server';

import { signIn } from '@/auth'; // Pastikan import dari auth.ts anda
import { AuthError } from 'next-auth';

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    // Jalankan sign in NextAuth
    await signIn('credentials', formData);
  } catch (error) {
    // PENTING: NextAuth menggunakan throw error untuk redirect.
    // Kita harus melempar ulang error tersebut agar redirect terjadi.
    if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
        throw error;
    }
    
    // Handle error login biasa (password salah, user tak ditemukan)
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }
    throw error;
  }
}