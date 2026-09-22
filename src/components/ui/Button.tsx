import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      className = '',
      type = 'button',
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-md cursor-pointer transition-all duration-150 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-600 dark:focus-visible:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 select-none';

    const sizeStyles: Record<ButtonSize, string> = {
      sm: 'px-3 py-1.5 text-xs gap-1.5 min-h-[32px]',
      md: 'px-4 py-2 text-xs font-semibold gap-2 min-h-[36px]',
      lg: 'px-5 py-2.5 text-sm font-semibold gap-2 min-h-[42px]',
    };

    const variantStyles: Record<ButtonVariant, string> = {
      primary:
        'bg-blue-600 hover:bg-blue-700 text-white shadow-xs focus:ring-blue-600 border border-blue-700',
      secondary:
        'bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs focus:ring-slate-400',
      danger:
        'bg-red-600 hover:bg-red-700 text-white shadow-xs focus:ring-red-600 border border-red-700',
      success:
        'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs focus:ring-emerald-600 border border-emerald-700',
      outline:
        'bg-transparent border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:ring-slate-400',
      ghost:
        'bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:ring-slate-400',
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        aria-busy={isLoading ? true : undefined}
        className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        ) : (
          leftIcon && <span className="inline-flex items-center shrink-0">{leftIcon}</span>
        )}
        <span className="inline-flex items-center leading-none">{children}</span>
        {!isLoading && rightIcon && <span className="inline-flex items-center shrink-0">{rightIcon}</span>}
      </button>
    );

  },
);

Button.displayName = 'Button';
