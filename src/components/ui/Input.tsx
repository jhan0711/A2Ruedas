import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
  prefixText?: string;
  isMono?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightElement,
      prefixText,
      isMono = false,
      className = '',
      id,
      disabled,
      ...props
    },
    ref,
  ) => {
    const reactId = React.useId();
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : `input-${reactId}`);
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;
    const describedBy = error ? errorId : helperText ? helperId : undefined;

    return (
      <div className="w-full space-y-1 text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-medium text-slate-700 dark:text-slate-300"
          >
            {label}
          </label>
        )}

        <div className="relative flex rounded-md shadow-xs">
          {prefixText && (
            <span className="inline-flex items-center px-2.5 rounded-l-md border border-r-0 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-mono text-xs select-none">
              {prefixText}
            </span>
          )}

          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={`block w-full text-xs rounded-md border bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-100 dark:disabled:bg-slate-800 ${
              prefixText ? 'rounded-l-none' : ''
            } ${leftIcon ? 'pl-8' : 'pl-3'} ${rightElement ? 'pr-9' : 'pr-3'} py-1.5 ${
              error
                ? 'border-red-500 dark:border-red-500 focus:ring-red-500'
                : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'
            } ${isMono ? 'font-mono' : ''} ${className}`}
            {...props}
          />

          {rightElement && (
            <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400">
              {rightElement}
            </div>
          )}
        </div>

        {error ? (
          <p id={errorId} role="alert" className="text-[11px] text-red-600 dark:text-red-400 font-medium">{error}</p>
        ) : helperText ? (
          <p id={helperId} className="text-[11px] text-slate-500 dark:text-slate-400">{helperText}</p>
        ) : null}
      </div>
    );
  },
);

Input.displayName = 'Input';
