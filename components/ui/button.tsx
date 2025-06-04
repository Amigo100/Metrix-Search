// components/ui/button.tsx
import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  asChild?: boolean;
}

/**
 * Minimal button component that matches the usage in your index.tsx and login.tsx.
 * Feel free to expand or style further.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', children, ...props }, ref) => {

    const baseStyles =
      'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500';
    const variantStyles = {
      default: 'bg-teal-600 hover:bg-teal-700 text-white border border-transparent',
      outline: 'bg-white border border-teal-600 text-teal-700 hover:bg-teal-50',
      ghost: 'bg-transparent text-teal-700 hover:bg-teal-50',
    };
    const sizeStyles = {
      sm: 'px-3 py-1 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    };

    const combined = cn(
      baseStyles,
      variantStyles[variant],
      sizeStyles[size],
      className
    );

    return (
      <button ref={ref} className={combined} {...props}>
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
