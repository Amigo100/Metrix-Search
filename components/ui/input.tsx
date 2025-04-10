// components/ui/input.tsx
import React, { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

/**
 * Minimal input that matches usage in login.tsx (type="email", type="password", etc.)
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    const baseStyles =
      'block w-full rounded-md border border-gray-700 bg-gray-900 text-gray-100 ' +
      'placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 ' +
      'focus:border-transparent transition-colors duration-200';

    return (
      <input
        ref={ref}
        className={cn(baseStyles, className)}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
