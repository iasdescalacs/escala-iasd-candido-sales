"use client";

import { Eye, EyeOff, Loader2 } from "lucide-react";
import { FormEvent, useState } from "react";

export function LoginPreviewForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    window.setTimeout(() => setIsLoading(false), 700);
  }

  return (
    <form
      className="rounded-lg border border-border bg-surface p-6 shadow-sm"
      onSubmit={handleSubmit}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-foreground sm:col-span-2">
          E-mail
          <input
            className="h-11 rounded-md border border-border bg-background px-3 text-foreground outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
            inputMode="email"
            placeholder="seuemail@exemplo.com"
            type="email"
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-foreground sm:col-span-2">
          Senha
          <span className="flex h-11 overflow-hidden rounded-md border border-border bg-background focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
            <input
              className="min-w-0 flex-1 bg-transparent px-3 text-foreground outline-none placeholder:text-muted"
              placeholder="Digite sua senha"
              type={showPassword ? "text" : "password"}
            />
            <button
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              className="flex w-11 items-center justify-center text-muted transition hover:text-foreground"
              onClick={() => setShowPassword((current) => !current)}
              type="button"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </span>
        </label>
      </div>

      <button
        className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        disabled={isLoading}
        type="submit"
      >
        {isLoading ? <Loader2 className="animate-spin" size={18} /> : null}
        {isLoading ? "Preparando..." : "Entrar em breve"}
      </button>
    </form>
  );
}
