import { Suspense } from 'react'; // <--- WAJIB IMPORT INI
import LoginForm from "@/components/LoginForm";
import { Loader2 } from "lucide-react"; // Ikon loading biar cantik

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-sm">
        
        {/* BUNGKUS DENGAN SUSPENSE */}
        <Suspense fallback={
            <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
        }>
            <LoginForm />
        </Suspense>

        <p className="mt-4 text-center text-xs text-slate-500">
          &copy; {new Date().getFullYear()} POS Toko Luwes
        </p>
      </div>
    </main>
  );
}