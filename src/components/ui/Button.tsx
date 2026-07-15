import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "brand" | "blue" | "green" | "yellow" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantClasses: Record<Variant, string> = {
  brand: "bg-brand text-brand-ink hover:brightness-105 active:brightness-95 shadow-[0_4px_0_0_rgb(var(--c-ink)/0.15)] hover:shadow-[0_2px_0_0_rgb(var(--c-ink)/0.15)] hover:translate-y-[2px]",
  blue: "bg-blue text-blue-ink hover:brightness-105 active:brightness-95 shadow-[0_4px_0_0_rgb(var(--c-ink)/0.15)] hover:shadow-[0_2px_0_0_rgb(var(--c-ink)/0.15)] hover:translate-y-[2px]",
  green: "bg-green text-green-ink hover:brightness-105 active:brightness-95 shadow-[0_4px_0_0_rgb(var(--c-ink)/0.15)] hover:shadow-[0_2px_0_0_rgb(var(--c-ink)/0.15)] hover:translate-y-[2px]",
  yellow: "bg-yellow text-yellow-ink hover:brightness-105 active:brightness-95 shadow-[0_4px_0_0_rgb(var(--c-ink)/0.15)] hover:shadow-[0_2px_0_0_rgb(var(--c-ink)/0.15)] hover:translate-y-[2px]",
  outline: "border-2 border-line bg-panel text-ink hover:border-brand hover:text-brand",
  ghost: "bg-transparent text-ink hover:bg-panel-2",
};

const sizeClasses: Record<Size, string> = {
  sm: "text-sm px-3 py-1.5 rounded-lg gap-1.5",
  md: "text-base px-5 py-2.5 rounded-xl gap-2",
  lg: "text-lg px-7 py-3.5 rounded-2xl gap-2.5",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "brand", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-bold transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none disabled:translate-y-0 disabled:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
