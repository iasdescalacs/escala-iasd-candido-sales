"use client";

import { ChangeEvent } from "react";

type PhoneInputProps = {
  defaultValue?: string | null;
};

export function PhoneInput({ defaultValue }: PhoneInputProps) {
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    event.currentTarget.value = maskPhone(event.currentTarget.value);
  }

  return (
    <input
      autoComplete="tel"
      className="h-11 rounded-md border border-border bg-background px-3 text-foreground outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
      defaultValue={defaultValue ?? ""}
      inputMode="tel"
      name="phone"
      onChange={handleChange}
      placeholder="(77) 99999-0000"
      required
      type="tel"
    />
  );
}

function maskPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  const area = digits.slice(0, 2);
  const first = digits.length > 10 ? digits.slice(2, 7) : digits.slice(2, 6);
  const second = digits.length > 10 ? digits.slice(7, 11) : digits.slice(6, 10);

  if (digits.length <= 2) {
    return area ? `(${area}` : "";
  }

  if (!second) {
    return `(${area}) ${first}`;
  }

  return `(${area}) ${first}-${second}`;
}
