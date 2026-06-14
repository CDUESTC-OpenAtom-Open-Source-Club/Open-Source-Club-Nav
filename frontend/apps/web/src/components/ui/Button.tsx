import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/cn";

const variants = {
  primary:
    "border-transparent bg-blue-600 text-white shadow-sm hover:bg-blue-700 focus-visible:ring-blue-500/30 disabled:bg-slate-300",
  secondary:
    "border-slate-200 bg-white text-slate-900 shadow-sm hover:bg-slate-50 focus-visible:ring-slate-400/30 disabled:text-slate-400",
  ghost:
    "border-transparent bg-transparent text-slate-700 hover:bg-slate-100 focus-visible:ring-slate-400/30 disabled:text-slate-400",
  danger:
    "border-transparent bg-rose-600 text-white shadow-sm hover:bg-rose-700 focus-visible:ring-rose-500/30 disabled:bg-slate-300",
} as const;

const sizes = {
  sm: "min-h-11 px-3 text-sm",
  md: "min-h-11 px-4 text-sm",
  lg: "min-h-12 px-5 text-base",
  icon: "h-11 w-11 p-0",
} as const;

export type ButtonVariant = keyof typeof variants;
export type ButtonSize = keyof typeof sizes;

export type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  isLoading?: boolean;
};

export function Button({
  className,
  children,
  disabled,
  isLoading = false,
  leadingIcon,
  trailingIcon,
  size = "md",
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg border font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-80",
        sizes[size],
        variants[variant],
        className,
      )}
      disabled={disabled || isLoading}
      type={type}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {isLoading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
      ) : (
        leadingIcon
      )}
      {children ? <span>{children}</span> : null}
      {trailingIcon}
    </button>
  );
}
