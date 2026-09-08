"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

type PasswordFieldProps = {
  label: string;
  name: string;
  autoComplete: string;
  placeholder?: string;
};

export function PasswordField({
  label,
  name,
  autoComplete,
  placeholder = "Digite sua senha",
}: PasswordFieldProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <label className="grid gap-2 text-sm font-medium text-foreground">
      {label}
      <span className="flex h-11 overflow-hidden rounded-md border border-border bg-background focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
        <input
          autoComplete={autoComplete}
          className="min-w-0 flex-1 bg-transparent px-3 text-foreground outline-none placeholder:text-muted"
          name={name}
          placeholder={placeholder}
          required
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
  );
}
