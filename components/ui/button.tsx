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
      'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2';
    const variantStyles = {
      default: 'bg-blue-600 hover:bg-blue-700 text-white border border-transparent',
      outline: 'bg-transparent border border-gray-500 text-gray-100 hover:bg-gray-800',
      ghost: 'bg-transparent text-gray-100 hover:bg-gray-800',
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
