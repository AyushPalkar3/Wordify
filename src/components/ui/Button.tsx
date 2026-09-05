import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-ink text-paper-card hover:bg-[#343b4d] focus-visible:outline-ink",
  secondary:
    "bg-transparent text-ink border border-rule hover:bg-rule-soft focus-visible:outline-ink",
  ghost: "bg-transparent text-ink-soft hover:text-ink focus-visible:outline-ink",
  danger:
    "bg-transparent text-danger border border-danger/40 hover:bg-danger-tint focus-visible:outline-danger",
};

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }
>(function Button({ variant = "primary", className = "", ...props }, ref) {
  return (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center gap-2 rounded-sm px-4 py-2 font-sans text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
});
