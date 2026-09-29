import type { ComponentProps } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function Field({ label, id, ...props }: ComponentProps<typeof Input> & { label: string }) {
  const inputId = id ?? props.name;
  return (
    <div className="grid gap-2">
      <Label htmlFor={inputId}>{label}</Label>
      <Input id={inputId} {...props} />
    </div>
  );
}
