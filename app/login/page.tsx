import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-sm">
        <LoginForm />
        <p className="mt-4 text-center text-xs text-slate-500">
          &copy; {new Date().getFullYear()} POS Toko Luwes
        </p>
      </div>
    </main>
  );
}