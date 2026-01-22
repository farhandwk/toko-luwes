"use client";

import { useActionState } from "react";
import { authenticate } from "@/lib/action"; // Pastikan path ini sesuai struktur folder kamu
import { useSearchParams } from "next/navigation";
import { Loader2, LogIn } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert"; // Opsional: npx shadcn@latest add alert

export default function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  
  // Hook Server Action
  const [errorMessage, formAction, isPending] = useActionState(
    authenticate,
    undefined
  );

  return (
    <Card className="w-full shadow-lg border-slate-200">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold text-primary">Login</CardTitle>
        <CardDescription>
          Masukkan akun untuk mengakses dashboard
        </CardDescription>
      </CardHeader>
      
      <form action={formAction} className="grid gap-6">
        <CardContent className="grid gap-4">
          
          {/* Alert Error (Muncul jika ada error) */}
          {errorMessage && (
            <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
                ⚠️ {errorMessage}
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              name="username"
              type="text"
              placeholder="Contoh: admin"
              required
              autoFocus
              className="bg-slate-50"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="******"
              required
              className="bg-slate-50"
            />
          </div>

          <input type="hidden" name="redirectTo" value={callbackUrl} />
        </CardContent>

        <CardFooter>
          <Button className="w-full" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                <LogIn className="mr-2 h-4 w-4" />
                Masuk Aplikasi
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}