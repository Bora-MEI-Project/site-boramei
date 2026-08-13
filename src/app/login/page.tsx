import { LogIn } from 'lucide-react';
import LoginForm from '@/components/LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-brand-bgLight text-[#111827]">
      <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-8 sm:px-6 sm:py-10">
        <header className="mb-8 flex items-center gap-3 self-start">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-purple">
            <LogIn className="h-6 w-6 text-white" strokeWidth={2.2} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Área do cliente</h1>
            <p className="text-sm text-neutral-500">Entre com seus dados para acessar sua conta.</p>
          </div>
        </header>

        <LoginForm />
      </div>
    </div>
  );
}
